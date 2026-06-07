import { env, waitUntil } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import {
  type BrowserRunBinding,
  captureScreenshot,
  getBrowserRunBinding,
} from '../../lib/browser-run'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'
import {
  getCacheKey,
  signLinkScreenshotUrl,
  timingSafeEqual,
} from '../../lib/link-screenshot-crypto'
import { fetchYoutubeThumbnail, youtubeThumbnailUrl } from '../../lib/youtube-thumbnail'

const SCREENSHOT_CONTENT_TYPE = 'image/png'
const YOUTUBE_THUMBNAIL_CONTENT_TYPE = 'image/jpeg'
// After a generation failure, skip Browser Run for this URL for a while. Stops
// a failing/unscreenshotable URL (bot-protected sites, pages that never settle)
// from being re-attempted on every hover and burning Browser Run quota.
const SCREENSHOT_FAILURE_COOLDOWN_MS = 3 * 60 * 1000

type LinkScreenshotEnv = {
  BROWSER?: unknown
  LINK_SCREENSHOT_SIGNING_KEY?: string
  home26_link_screenshots?: R2Bucket
}

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

  // Negative-cache short-circuit while this URL is cooling down from a failure.
  const retryAt = screenshotFailureCooldowns.get(cacheKey)

  if (retryAt !== undefined) {
    if (Date.now() < retryAt) {
      return Promise.resolve(null)
    }

    screenshotFailureCooldowns.delete(cacheKey)
  }

  const job = produceScreenshot({ browser, bucket, cacheKey, normalizedUrl }).finally(() => {
    inflightScreenshots.delete(cacheKey)
  })

  inflightScreenshots.set(cacheKey, job)
  // Keep the worker alive until generation + R2 put finish even if the client
  // cancels the request (e.g. its <img> preview times out). Without this the
  // cancel kills the put, so the URL never caches and re-triggers forever.
  waitUntil(job)

  return job
}

async function produceScreenshot({
  browser,
  bucket,
  cacheKey,
  normalizedUrl,
}: {
  browser: BrowserRunBinding
  bucket: R2Bucket
  cacheKey: string
  normalizedUrl: string
}): Promise<ScreenshotResult | null> {
  // Re-check the cache: another isolate may have generated it while this
  // request was queued.
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

  const screenshot = await captureScreenshot(browser, normalizedUrl)

  if (!screenshot) {
    coolDownFailure(cacheKey)

    return null
  }

  return await cacheScreenshot(bucket, cacheKey, screenshot, SCREENSHOT_CONTENT_TYPE, normalizedUrl)
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
