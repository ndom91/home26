import { buildLinkScreenshotUrl } from './link-screenshot.ts'
import { signLinkScreenshotUrl } from './link-screenshot-crypto.ts'

/**
 * Build-time map-builder for link-screenshot previews. Shared by the blog
 * content pipeline (`content-collections.ts`) and the project-card scanner
 * (`scripts/sign-link-screenshots.ts`).
 *
 * Takes already-normalized target URLs (see `normalizeLinkScreenshotTarget`),
 * signs each with the shared Web Crypto signer in `link-screenshot-crypto.ts`
 * (the same function the runtime validator uses, so signatures can't drift),
 * and returns a `{ normalizedUrl: signedEndpointUrl }` map.
 *
 * Returns an empty map when `LINK_SCREENSHOT_SIGNING_KEY` is unset so callers
 * degrade gracefully to plain links.
 */
export async function signLinkScreenshotUrls(
  normalizedUrls: string[]
): Promise<Record<string, string>> {
  const signingKey = process.env.LINK_SCREENSHOT_SIGNING_KEY

  if (!signingKey) {
    return {}
  }

  const entries: Record<string, string> = {}

  for (const normalizedUrl of normalizedUrls) {
    const signature = await signLinkScreenshotUrl(signingKey, normalizedUrl)
    entries[normalizedUrl] = buildLinkScreenshotUrl(normalizedUrl, signature)
  }

  return entries
}
