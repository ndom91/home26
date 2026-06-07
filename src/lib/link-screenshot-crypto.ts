/**
 * Single source of truth for the link-screenshot signing + cache-key contract.
 *
 * Uses only Web Crypto (`crypto.subtle`), so the exact same implementation runs
 * at build time (Node), in the Cloudflare Worker (runtime validation), and in
 * the browser if ever needed. The build-time signer and the runtime validator
 * MUST agree, so they share this module rather than reimplementing the scheme.
 */
const SIGNATURE_PREFIX = 'v1:'
// Bump when the capture pipeline changes (viewport, waits, injected scripts) so
// previously cached R2 screenshots are regenerated with the new settings.
export const SCREENSHOT_VERSION = 'v2'

const encoder = new TextEncoder()

export async function signLinkScreenshotUrl(signingKey: string, normalizedUrl: string) {
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

export async function getCacheKey(normalizedUrl: string) {
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(normalizedUrl))

  return `link-screenshots/${SCREENSHOT_VERSION}/${base64UrlEncode(new Uint8Array(hash))}.png`
}

export function timingSafeEqual(left: string, right: string) {
  if (left.length !== right.length) {
    return false
  }

  let difference = 0

  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }

  return difference === 0
}

function base64UrlEncode(bytes: Uint8Array) {
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
