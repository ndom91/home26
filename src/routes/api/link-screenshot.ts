import { env, waitUntil } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'
import {
  getCacheKey,
  signLinkScreenshotUrl,
  timingSafeEqual,
} from '../../lib/link-screenshot-crypto'
import { fetchYoutubeThumbnail, youtubeThumbnailUrl } from '../../lib/youtube-thumbnail'

const SCREENSHOT_CONTENT_TYPE = 'image/png'
const YOUTUBE_THUMBNAIL_CONTENT_TYPE = 'image/jpeg'
const BROWSER_RUN_INTERVAL_MS = 2500
// Wait after page load before capturing, so intro/entrance animations settle.
const SCREENSHOT_SETTLE_MS = 500
// Cap page navigation so a slow/never-idle page does not hang the request.
const SCREENSHOT_NAV_TIMEOUT_MS = 25000
// After a generation failure, skip Browser Run for this URL for a while. Stops
// a failing/unscreenshotable URL (e.g. youtube's strict-CSP page) from being
// re-attempted on every hover, which keeps Cloudflare's per-host Browser Run
// rate limit tripped and never lets it recover.
const SCREENSHOT_FAILURE_COOLDOWN_MS = 3 * 60 * 1000

type LinkScreenshotEnv = {
  BROWSER?: unknown
  LINK_SCREENSHOT_SIGNING_KEY?: string
  home26_link_screenshots?: R2Bucket
}

type BrowserRunBinding = {
  quickAction(action: 'screenshot', options: unknown): Promise<Response>
}

let browserRunQueue: Promise<void> = Promise.resolve()
let lastBrowserRunStartedAt = 0
type ScreenshotResult = { body: ArrayBuffer; contentType: string }

// De-dupes concurrent hovers of the same URL and holds the generation job so it
// can be registered with waitUntil (survives client cancel) and awaited for the
// response. Keyed by R2 cache key.
const inflightScreenshots = new Map<string, Promise<ScreenshotResult | null>>()
// Negative cache: cacheKey -> epoch ms when the URL may be retried after a
// recent generation failure. See SCREENSHOT_FAILURE_COOLDOWN_MS.
const screenshotFailureCooldowns = new Map<string, number>()

export const Route = createFileRoute('/api/link-screenshot')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url)
        const targetUrl = requestUrl.searchParams.get('url')
        const signature = requestUrl.searchParams.get('sig')
        const normalizedUrl = targetUrl ? normalizeLinkScreenshotTarget(targetUrl) : null

        if (!normalizedUrl || !signature) {
          return new Response('Missing or invalid screenshot URL', { status: 400 })
        }

        const workerEnv = env as LinkScreenshotEnv
        const signingKey = workerEnv.LINK_SCREENSHOT_SIGNING_KEY
        const browser = getBrowserRunBinding(workerEnv.BROWSER)

        if (!signingKey || !browser || !workerEnv.home26_link_screenshots) {
          return new Response('Link screenshot service is not configured', { status: 503 })
        }

        const expectedSignature = await signLinkScreenshotUrl(signingKey, normalizedUrl)

        if (!timingSafeEqual(signature, expectedSignature)) {
          return new Response('Invalid screenshot signature', { status: 403 })
        }

        const cacheKey = await getCacheKey(normalizedUrl)
        const cachedScreenshot = await workerEnv.home26_link_screenshots.get(cacheKey)

        if (cachedScreenshot) {
          return new Response(cachedScreenshot.body, {
            headers: imageHeaders(
              cachedScreenshot.httpMetadata?.contentType ?? SCREENSHOT_CONTENT_TYPE,
              cachedScreenshot.httpEtag
            ),
          })
        }

        const screenshot = await generateAndCacheScreenshot({
          browser,
          bucket: workerEnv.home26_link_screenshots,
          cacheKey,
          normalizedUrl,
        })

        if (!screenshot) {
          return new Response('Unable to generate screenshot', { status: 502 })
        }

        return new Response(screenshot.body, {
          headers: imageHeaders(screenshot.contentType),
        })
      },
    },
  },
})

function imageHeaders(contentType: string, etag?: string) {
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': contentType,
  })

  if (etag) {
    headers.set('ETag', etag)
  }

  return headers
}

function getBrowserRunBinding(binding: unknown): BrowserRunBinding | null {
  if (
    typeof binding === 'object' &&
    binding !== null &&
    'quickAction' in binding &&
    typeof binding.quickAction === 'function'
  ) {
    return binding as BrowserRunBinding
  }

  return null
}

function generateAndCacheScreenshot({
  browser,
  bucket,
  cacheKey,
  normalizedUrl,
}: {
  browser: BrowserRunBinding
  bucket: R2Bucket
  cacheKey: string
  normalizedUrl: string
}) {
  const existing = inflightScreenshots.get(cacheKey)

  if (existing) {
    return existing
  }

  // Negative-cache short-circuit: skip Browser Run entirely (do not even queue a
  // slot) while this URL is cooling down from a recent failure.
  const retryAt = screenshotFailureCooldowns.get(cacheKey)

  if (retryAt !== undefined) {
    if (Date.now() < retryAt) {
      return Promise.resolve(null)
    }

    screenshotFailureCooldowns.delete(cacheKey)
  }

  const job = withBrowserRunSlot(async (): Promise<ScreenshotResult | null> => {
    const cachedScreenshot = await bucket.get(cacheKey)

    if (cachedScreenshot) {
      return {
        body: await cachedScreenshot.arrayBuffer(),
        contentType: cachedScreenshot.httpMetadata?.contentType ?? SCREENSHOT_CONTENT_TYPE,
      }
    }

    // youtube persistently blocks Browser Run screenshots (per-host 429),
    // regardless of our request rate. Use the video thumbnail instead — no
    // browser, no rate limit, and a nicer preview than youtube's consent page.
    const thumbnailUrl = youtubeThumbnailUrl(normalizedUrl)

    if (thumbnailUrl) {
      const thumbnail = await fetchYoutubeThumbnail(thumbnailUrl)

      if (!thumbnail) {
        coolDownFailure(cacheKey)

        return null
      }

      return await cacheScreenshot(
        bucket,
        cacheKey,
        thumbnail,
        YOUTUBE_THUMBNAIL_CONTENT_TYPE,
        normalizedUrl
      )
    }

    const screenshotResponse = await captureScreenshot(browser, normalizedUrl)

    if (!screenshotResponse?.ok) {
      if (screenshotResponse) {
        await logBrowserRunFailure(normalizedUrl, screenshotResponse)
      }

      coolDownFailure(cacheKey)

      return null
    }

    const screenshot = await screenshotResponse.arrayBuffer()

    return await cacheScreenshot(
      bucket,
      cacheKey,
      screenshot,
      SCREENSHOT_CONTENT_TYPE,
      normalizedUrl
    )
  }).finally(() => {
    inflightScreenshots.delete(cacheKey)
  })

  inflightScreenshots.set(cacheKey, job)
  // Keep the worker alive until generation + R2 put finish even if the client
  // cancels the request (e.g. its <img> preview times out). Without this the
  // cancel kills the put, so the URL never caches and re-triggers forever.
  waitUntil(job)

  return job
}

async function cacheScreenshot(
  bucket: R2Bucket,
  cacheKey: string,
  body: ArrayBuffer,
  contentType: string,
  normalizedUrl: string
): Promise<ScreenshotResult> {
  await bucket.put(cacheKey, body, {
    httpMetadata: {
      contentType,
    },
    customMetadata: {
      createdAt: new Date().toISOString(),
      sourceUrl: normalizedUrl,
    },
  })

  screenshotFailureCooldowns.delete(cacheKey)

  return { body, contentType }
}

// Cool a URL down after a failure so we stop hammering Browser Run on every
// hover. Prunes already-expired entries first so the map can't grow unbounded
// in a long-lived isolate.
function coolDownFailure(cacheKey: string) {
  const now = Date.now()

  for (const [key, retryAt] of screenshotFailureCooldowns) {
    if (now >= retryAt) {
      screenshotFailureCooldowns.delete(key)
    }
  }

  screenshotFailureCooldowns.set(cacheKey, now + SCREENSHOT_FAILURE_COOLDOWN_MS)
}

async function captureScreenshot(
  browser: BrowserRunBinding,
  normalizedUrl: string
): Promise<Response | null> {
  try {
    await waitForNextBrowserRunSlot()

    return await browser.quickAction('screenshot', {
      url: normalizedUrl,
      viewport: {
        width: 1280,
        height: 720,
      },
      waitForTimeout: SCREENSHOT_SETTLE_MS,
      // Cap navigation so a slow/never-idle page fails fast instead of leaving
      // the request pending; bestAttempt still captures what loaded by then.
      gotoOptions: { waitUntil: 'load', timeout: SCREENSHOT_NAV_TIMEOUT_MS },
      bestAttempt: true,
    })
  } catch (error) {
    logBrowserRunError(normalizedUrl, error)

    return null
  }
}

async function waitForNextBrowserRunSlot() {
  const now = Date.now()
  const delay = Math.max(0, lastBrowserRunStartedAt + BROWSER_RUN_INTERVAL_MS - now)

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  lastBrowserRunStartedAt = Date.now()
}

async function withBrowserRunSlot<T>(task: () => Promise<T>) {
  const previousBrowserRun = browserRunQueue.catch(() => {})
  let releaseBrowserRunSlot = () => {}

  browserRunQueue = new Promise<void>((resolve) => {
    releaseBrowserRunSlot = resolve
  })

  await previousBrowserRun

  try {
    return await task()
  } finally {
    releaseBrowserRunSlot()
  }
}

async function logBrowserRunFailure(normalizedUrl: string, response: Response) {
  let bodySnippet = ''

  try {
    bodySnippet = (await response.text()).slice(0, 1000)
  } catch (error) {
    bodySnippet = `Unable to read failure body: ${String(error)}`
  }

  // biome-ignore lint/suspicious/noConsole: Emit Worker diagnostics for Browser Run failures.
  console.warn('Link screenshot Browser Run failed', {
    bodySnippet,
    status: response.status,
    statusText: response.statusText,
    targetUrl: normalizedUrl,
  })
}

function logBrowserRunError(normalizedUrl: string, error: unknown) {
  // biome-ignore lint/suspicious/noConsole: Emit Worker diagnostics for Browser Run failures.
  console.warn('Link screenshot Browser Run threw', {
    error: error instanceof Error ? { message: error.message, name: error.name } : String(error),
    targetUrl: normalizedUrl,
  })
}
