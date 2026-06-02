import { env } from 'cloudflare:workers'
import { createFileRoute } from '@tanstack/react-router'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'

const SIGNATURE_PREFIX = 'v1:'
const SCREENSHOT_CONTENT_TYPE = 'image/png'
const SCREENSHOT_VERSION = 'v1'

type LinkScreenshotEnv = {
  BROWSER?: unknown
  LINK_SCREENSHOT_SIGNING_KEY?: string
  home26_link_screenshots?: R2Bucket
}

type BrowserRunBinding = {
  quickAction(action: 'screenshot', options: unknown): Promise<Response>
}

const encoder = new TextEncoder()

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

        let screenshotResponse: Response

        try {
          screenshotResponse = await browser.quickAction('screenshot', {
            url: normalizedUrl,
            viewport: {
              width: 1280,
              height: 720,
            },
          })
        } catch (error) {
          logBrowserRunError(normalizedUrl, error)

          return new Response('Unable to generate screenshot', { status: 502 })
        }

        if (!screenshotResponse.ok) {
          await logBrowserRunFailure(normalizedUrl, screenshotResponse)

          return new Response('Unable to generate screenshot', { status: 502 })
        }

        const screenshot = await screenshotResponse.arrayBuffer()

        await workerEnv.home26_link_screenshots.put(cacheKey, screenshot, {
          httpMetadata: {
            contentType: SCREENSHOT_CONTENT_TYPE,
          },
          customMetadata: {
            createdAt: new Date().toISOString(),
            sourceUrl: normalizedUrl,
          },
        })

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
