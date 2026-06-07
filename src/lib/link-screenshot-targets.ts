import { normalizeLinkScreenshotTarget } from './link-screenshot.ts'

/**
 * Shared, pure scanners that enumerate link-screenshot target URLs from source
 * text. Used by the blog content pipeline (`content-collections.ts`), the
 * project-card signer (`scripts/sign-link-screenshots.ts`), and the warm
 * script (`scripts/warm-link-screenshots.ts`) so all three agree on exactly
 * which links get previews.
 *
 * Both return de-duped, normalized URLs (see `normalizeLinkScreenshotTarget`).
 */

// Matches `url="..."` / `url={'...'}` / `url={"..."}` on a <ScreenshotLink> tag.
const SCREENSHOT_LINK_URL = /<ScreenshotLink[^>]*?\burl=\{?["']([^"']+)["']\}?/g

export function collectBlogLinkTargets(content: string): string[] {
  const contentWithoutCodeBlocks = content.replace(/```[\s\S]*?```/g, '')
  const urls = new Set<string>()

  for (const match of contentWithoutCodeBlocks.matchAll(/https?:\/\/[^\s<>'"`)\]}]+/g)) {
    const normalizedUrl = normalizeLinkScreenshotTarget(match[0])

    if (normalizedUrl) {
      urls.add(normalizedUrl)
    }
  }

  return [...urls]
}

export function collectProjectLinkTargets(source: string): string[] {
  const urls = new Set<string>()

  for (const match of source.matchAll(SCREENSHOT_LINK_URL)) {
    const normalizedUrl = normalizeLinkScreenshotTarget(match[1])

    if (normalizedUrl) {
      urls.add(normalizedUrl)
    }
  }

  return [...urls]
}
