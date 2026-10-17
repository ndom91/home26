// Post-build: add a <link rel="modulepreload"> for each post's body chunk to
// its prerendered page, so the browser fetches it alongside the entry JS
// instead of after hydration starts (src/lib/post-body.ts loads it lazily).
// Chunk filenames are hashed, so they come from Vite's client manifest, which
// is deleted afterwards to keep it out of the deployed assets.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { slugFromPath } from '../src/lib/post-meta.ts'

const CLIENT_DIR = 'dist/client'
const MANIFEST_DIR = join(CLIENT_DIR, '.vite')
const BLOG_PREFIX = 'content/blog/'

const manifest = JSON.parse(readFileSync(join(MANIFEST_DIR, 'manifest.json'), 'utf8')) as Record<
  string,
  { file: string }
>

let injected = 0

for (const [source, entry] of Object.entries(manifest)) {
  if (!source.startsWith(BLOG_PREFIX) || !source.endsWith('.mdx')) continue

  const page = join(CLIENT_DIR, 'blog', slugFromPath(relative(BLOG_PREFIX, source)), 'index.html')
  // Drafts are bundled but not prerendered.
  if (!existsSync(page)) continue

  const html = readFileSync(page, 'utf8')
  const link = `<link rel="modulepreload" href="/${entry.file}"/>`
  if (html.includes(link)) continue

  writeFileSync(page, html.replace('</head>', `${link}</head>`))
  injected++
}

rmSync(MANIFEST_DIR, { recursive: true, force: true })
console.log(`[preload-post-bodies] added modulepreload to ${injected} post pages`)
