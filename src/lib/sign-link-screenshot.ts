import { createHmac } from 'node:crypto'

/**
 * Build-time HMAC signer for link-screenshot URLs. Shared by the blog content
 * pipeline (`content-collections.ts`) and the project-card scanner
 * (`scripts/sign-link-screenshots.ts`).
 *
 * Must stay in sync with the runtime validator in
 * `src/routes/api/link-screenshot.ts` (`v1:` prefix, HMAC-SHA256, base64url).
 *
 * Returns null when `LINK_SCREENSHOT_SIGNING_KEY` is unset so callers degrade
 * gracefully to plain links.
 */
export function signLinkScreenshotUrl(normalizedUrl: string): string | null {
  const signingKey = process.env.LINK_SCREENSHOT_SIGNING_KEY

  if (!signingKey) {
    return null
  }

  return createHmac('sha256', signingKey).update(`v1:${normalizedUrl}`).digest('base64url')
}
