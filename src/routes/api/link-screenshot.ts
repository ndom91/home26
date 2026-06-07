import { env, waitUntil } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'

const SIGNATURE_PREFIX = 'v1:'
const SCREENSHOT_CONTENT_TYPE = 'image/png'
// Bump when the capture pipeline changes (viewport, waits, injected scripts) so
// previously cached R2 screenshots are regenerated with the new settings.
const SCREENSHOT_VERSION = 'v2'
const BROWSER_RUN_INTERVAL_MS = 2500
// Wait after page load before capturing, so intro/entrance animations settle.
const SCREENSHOT_SETTLE_MS = 500
// Cap page navigation so a slow/never-idle page does not hang the request.
const SCREENSHOT_NAV_TIMEOUT_MS = 25000
// After a generation failure, skip Browser Run for this URL for a while. Stops
// a failing/unscreenshotable URL (e.g. youtube's strict-CSP page) from being
// re-attempted on every hover, which keeps Cloudflare's per-host Browser Run
// rate limit tripped and never lets it recover.
const SCREENSHOT_FAILURE_COOLDOWN_MS = 10 * 60 * 1000

// Best-effort: injected into the page after load to dismiss cookie/consent
// banners by clicking a visible "accept all"-style button. Pure string (no
// backslash escapes) so it survives template-literal embedding unchanged. Runs
// once immediately and retries once shortly after for banners that mount late.
const COOKIE_ACCEPT_SCRIPT = `
(() => {
  const PHRASES = ['accept all', 'allow all', 'accept cookies', 'accept & close', 'i agree', 'agree and close', 'got it', 'accept', 'agree'];
  const isVisible = (el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const clickAccept = () => {
    const els = document.querySelectorAll('button, [role="button"], input[type="button"], input[type="submit"]');
    for (const el of els) {
      const label = (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').trim().toLowerCase();
      if (!label || !isVisible(el)) continue;
      if (PHRASES.some((p) => label === p || label.includes(p))) {
        el.click();
        return true;
      }
    }
    return false;
  };
  try {
    if (!clickAccept()) setTimeout(clickAccept, 200);
  } catch (e) {}
})();
`

type LinkScreenshotEnv = {
  BROWSER?: unknown
  LINK_SCREENSHOT_SIGNING_KEY?: string
  home26_link_screenshots?: R2Bucket
}

type BrowserRunBinding = {
  quickAction(action: 'screenshot', options: unknown): Promise<Response>
}

const encoder = new TextEncoder()
let browserRunQueue: Promise<void> = Promise.resolve()
let lastBrowserRunStartedAt = 0
// De-dupes concurrent hovers of the same URL and holds the generation job so it
// can be registered with waitUntil (survives client cancel) and awaited for the
// response. Keyed by R2 cache key.
const inflightScreenshots = new Map<string, Promise<ArrayBuffer | null>>()
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
            headers: imageHeaders(cachedScreenshot.httpEtag),
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

        return new Response(screenshot, {
          headers: imageHeaders(),
        })
      },
    },
  },
})

function imageHeaders(etag?: string) {
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Type': SCREENSHOT_CONTENT_TYPE,
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

  const job = withBrowserRunSlot(async () => {
    const cachedScreenshot = await bucket.get(cacheKey)

    if (cachedScreenshot) {
      return await cachedScreenshot.arrayBuffer()
    }

    // youtube persistently blocks Browser Run screenshots (per-host 429),
    // regardless of our request rate. Use the video thumbnail instead — no
    // browser, no rate limit, and a nicer preview than youtube's consent page.
    const thumbnailUrl = youtubeThumbnailUrl(normalizedUrl)

    if (thumbnailUrl) {
      const thumbnail = await fetchYoutubeThumbnail(thumbnailUrl)

      if (thumbnail) {
        await bucket.put(cacheKey, thumbnail, {
          httpMetadata: {
            contentType: SCREENSHOT_CONTENT_TYPE,
          },
          customMetadata: {
            createdAt: new Date().toISOString(),
            sourceUrl: normalizedUrl,
          },
        })

        screenshotFailureCooldowns.delete(cacheKey)

        return thumbnail
      }

      screenshotFailureCooldowns.set(cacheKey, Date.now() + SCREENSHOT_FAILURE_COOLDOWN_MS)

      return null
    }

    // First attempt injects the cookie-dismiss script. Strict-CSP / Trusted
    // Types pages (e.g. youtube.com) reject addScriptTag with a 422 and fail
    // the whole capture, so retry once without the script on a 422. Other
    // failures (429 rate limit, 5xx) are not script-related — retrying just
    // burns more Browser Run quota, so give up rather than double the calls.
    let screenshotResponse = await captureScreenshot(browser, normalizedUrl, true)

    if (screenshotResponse?.status === 422) {
      screenshotResponse = await captureScreenshot(browser, normalizedUrl, false)
    }

    if (!screenshotResponse?.ok) {
      if (screenshotResponse) {
        await logBrowserRunFailure(normalizedUrl, screenshotResponse)
      }

      // Cool the URL down so we stop hammering Browser Run on every hover.
      screenshotFailureCooldowns.set(cacheKey, Date.now() + SCREENSHOT_FAILURE_COOLDOWN_MS)

      return null
    }

    const screenshot = await screenshotResponse.arrayBuffer()

    await bucket.put(cacheKey, screenshot, {
      httpMetadata: {
        contentType: SCREENSHOT_CONTENT_TYPE,
      },
      customMetadata: {
        createdAt: new Date().toISOString(),
        sourceUrl: normalizedUrl,
      },
    })

    screenshotFailureCooldowns.delete(cacheKey)

    return screenshot
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

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])
// Path segments that precede a video id, e.g. /shorts/<id>, /embed/<id>.
const YOUTUBE_ID_PATH_PREFIXES = new Set(['shorts', 'embed', 'live', 'v'])

// Returns the youtube video id for a watch/youtu.be/shorts/embed URL, or null.
function youtubeVideoId(normalizedUrl: string): string | null {
  let url: URL

  try {
    url = new URL(normalizedUrl)
  } catch {
    return null
  }

  if (!YOUTUBE_HOSTS.has(url.hostname.toLowerCase())) {
    return null
  }

  if (url.hostname.toLowerCase() === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  const watchId = url.searchParams.get('v')

  if (watchId) {
    return watchId
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length >= 2 && YOUTUBE_ID_PATH_PREFIXES.has(segments[0])) {
    return segments[1]
  }

  return null
}

function youtubeThumbnailUrl(normalizedUrl: string): string | null {
  const videoId = youtubeVideoId(normalizedUrl)

  // Guard the id charset so it can only ever form an img.youtube.com path.
  if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) {
    return null
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

async function fetchYoutubeThumbnail(thumbnailUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(thumbnailUrl)

    if (!response.ok) {
      return null
    }

    return await response.arrayBuffer()
  } catch {
    return null
  }
}

async function captureScreenshot(
  browser: BrowserRunBinding,
  normalizedUrl: string,
  injectCookieScript: boolean
): Promise<Response | null> {
  try {
    await waitForNextBrowserRunSlot()

    return await browser.quickAction('screenshot', {
      url: normalizedUrl,
      viewport: {
        width: 1280,
        height: 720,
      },
      // Best-effort cookie-banner dismissal; omitted on the fallback attempt
      // because addScriptTag is what strict-CSP pages reject.
      ...(injectCookieScript ? { addScriptTag: [{ content: COOKIE_ACCEPT_SCRIPT }] } : {}),
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

async function signLinkScreenshotUrl(signingKey: string, normalizedUrl: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(signingKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${SIGNATURE_PREFIX}${normalizedUrl}`)
  )

  return base64UrlEncode(new Uint8Array(signature))
}

async function getCacheKey(normalizedUrl: string) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(normalizedUrl))

  return `link-screenshots/${SCREENSHOT_VERSION}/${base64UrlEncode(new Uint8Array(hash))}.png`
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let difference = 0

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return difference === 0
}
