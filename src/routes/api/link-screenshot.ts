import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'

const SIGNATURE_PREFIX = 'v1:'
const SCREENSHOT_CONTENT_TYPE = 'image/png'
const SCREENSHOT_VERSION = 'v1'
const BROWSER_RUN_INTERVAL_MS = 2500

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

        const screenshot = await getOrCreateScreenshot({
          browser,
          bucket: workerEnv.home26_link_screenshots,
          cacheKey,
          normalizedUrl,
        })

        if (!screenshot) {
          return new Response('Unable to generate screenshot', { status: 502 })
        }

        if (screenshot.source === 'cache') {
          return new Response(screenshot.object.body, {
            headers: imageHeaders(screenshot.object.httpEtag),
          })
        }

        return new Response(screenshot.body, {
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

async function getOrCreateScreenshot({
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
  return withBrowserRunSlot(async () => {
    const cachedScreenshot = await bucket.get(cacheKey)

    if (cachedScreenshot) {
      return { object: cachedScreenshot, source: 'cache' as const }
    }

    let screenshotResponse: Response

    try {
      await waitForNextBrowserRunSlot()

      screenshotResponse = await browser.quickAction('screenshot', {
        url: normalizedUrl,
        viewport: {
          width: 1280,
          height: 720,
        },
      })
    } catch (error) {
      logBrowserRunError(normalizedUrl, error)

      return null
    }

    if (!screenshotResponse.ok) {
      await logBrowserRunFailure(normalizedUrl, screenshotResponse)

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

    return { body: screenshot, source: 'generated' as const }
  })
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
