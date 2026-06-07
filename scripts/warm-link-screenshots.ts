/**
 * Pre-warm the link-screenshot R2 cache so readers never wait on a cold capture.
 *
 * Every preview target is known ahead of time (blog post links + project-card
 * ScreenshotLinks), so this enumerates them, signs each, and GETs the live
 * `/api/link-screenshot` endpoint. The endpoint checks R2 first and reports
 * `X-Screenshot-Cache: hit|miss`, so already-cached targets are fast no-ops and
 * only genuinely-new links cost a Browser Run capture. Re-running is therefore
 * incremental and idempotent.
 *
 * Run AFTER deploy (it hits the deployed endpoint): `pnpm warm`
 *   LINK_SCREENSHOT_SIGNING_KEY=… [WARM_SITE_ORIGIN=https://ndo.dev] pnpm warm
 *
 * Misses are spaced to stay under the free-plan Browser Run rate limit. A first
 * run with many new links may exhaust the daily browser budget and 502 the rest;
 * a later run resumes (cached ones skip). When the signing key is unset it warns
 * and exits 0 (nothing to warm).
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildLinkScreenshotUrl } from '../src/lib/link-screenshot.ts'
import { signLinkScreenshotUrl } from '../src/lib/link-screenshot-crypto.ts'
import {
  collectBlogLinkTargets,
  collectProjectLinkTargets,
} from '../src/lib/link-screenshot-targets.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const BLOG_DIR = join(scriptDir, '../content/blog')
const PROJECTS_PATH = join(scriptDir, '../src/lib/projects.tsx')

const SITE_ORIGIN = process.env.WARM_SITE_ORIGIN ?? 'https://ndo.dev'
// Space generated (miss) requests to stay under the free-plan ~6 Browser Run
// REST requests/min. Cache hits are not paced.
const WARM_REQUEST_INTERVAL_MS = 11_000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Epoch ms of a post's publishedAt (legacy `date` fallback), 0 if absent. Used
// only to order warming, so undated posts simply sort last.
function publishedAtFromFrontmatter(content: string): number {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]

  if (!frontmatter) {
    return 0
  }

  const match =
    frontmatter.match(/^\s*publishedAt:\s*(.+)$/m) ?? frontmatter.match(/^\s*date:\s*(.+)$/m)
  const parsed = match ? Date.parse(match[1].trim().replace(/^["']|["']$/g, '')) : Number.NaN

  return Number.isNaN(parsed) ? 0 : parsed
}

// Newest blog posts first (so the latest content warms first across deploys),
// then project-card links. A Set preserves insertion order and dedupes, so a
// URL shared by posts keeps its newest position.
function collectTargets(): string[] {
  const posts: { content: string; publishedAt: number }[] = []

  for (const entry of readdirSync(BLOG_DIR, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) {
      continue
    }

    const content = readFileSync(join(entry.parentPath, entry.name), 'utf8')
    posts.push({ content, publishedAt: publishedAtFromFrontmatter(content) })
  }

  posts.sort((a, b) => b.publishedAt - a.publishedAt)

  const targets = new Set<string>()

  for (const post of posts) {
    for (const url of collectBlogLinkTargets(post.content)) {
      targets.add(url)
    }
  }

  for (const url of collectProjectLinkTargets(readFileSync(PROJECTS_PATH, 'utf8'))) {
    targets.add(url)
  }

  return [...targets]
}

async function main() {
  const signingKey = process.env.LINK_SCREENSHOT_SIGNING_KEY

  if (!signingKey) {
    console.warn('Warm: LINK_SCREENSHOT_SIGNING_KEY unset — nothing to warm.')
    return
  }

  const targets = collectTargets()
  console.log(`Warm: ${targets.length} target(s) against ${SITE_ORIGIN}`)

  let cached = 0
  let generated = 0
  let failed = 0

  for (const [index, normalizedUrl] of targets.entries()) {
    const signature = await signLinkScreenshotUrl(signingKey, normalizedUrl)
    const requestUrl = `${SITE_ORIGIN}${buildLinkScreenshotUrl(normalizedUrl, signature)}`

    let response: Response

    try {
      response = await fetch(requestUrl)
    } catch (error) {
      failed += 1
      console.warn(`  ! ${normalizedUrl}: ${error instanceof Error ? error.message : error}`)
      continue
    }

    if (!response.ok) {
      failed += 1
      console.warn(`  ! ${normalizedUrl}: ${response.status} ${response.statusText}`)
      continue
    }

    const cacheStatus = response.headers.get('x-screenshot-cache')

    if (cacheStatus === 'hit') {
      cached += 1
      console.log(`  · ${normalizedUrl}: cached`)
      continue
    }

    generated += 1
    console.log(`  ✓ ${normalizedUrl}: generated`)

    // Pace only generated misses, and not after the final target.
    if (index < targets.length - 1) {
      await sleep(WARM_REQUEST_INTERVAL_MS)
    }
  }

  console.log(`Warm: ${cached} cached, ${generated} generated, ${failed} failed`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
