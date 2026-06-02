/**
 * Node-only Mermaid render core, shared by the `pnpm mermaid` CLI
 * (scripts/render-mermaid.ts) and the dev-server vite plugin
 * (src/lib/mermaid-vite.ts).
 *
 * Renders ```mermaid fences to committed light/dark SVGs via the native `mmdr`
 * binary. MUST NOT be imported by application/client code — it shells out and
 * touches the filesystem.
 */
import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import {
  cachePaths,
  hashMermaid,
  MERMAID_CACHE_DIR,
  MERMAID_THEME_VARIANTS,
  type MermaidThemeVariant,
} from './mermaid.ts'

const repoRoot = process.cwd()
const blogDir = join(repoRoot, 'content/blog')
const cacheDir = join(repoRoot, MERMAID_CACHE_DIR)

const themeConfig: Record<MermaidThemeVariant, string> = {
  light: join(repoRoot, 'scripts/mermaid-theme.light.json'),
  dark: join(repoRoot, 'scripts/mermaid-theme.dark.json'),
}

const MERMAID_FENCE = /^```mermaid[^\n]*\n([\s\S]*?)^```/gm

export interface RenderSummary {
  rendered: number
  skipped: number
  unique: number
  pruned: number
}

/**
 * Delete cached SVGs that no longer correspond to any current diagram. The dev
 * plugin renders a fresh hash on every edit but never removes the superseded
 * one, so orphans accumulate without this.
 */
function pruneOrphans(validHashes: Set<string>): number {
  if (!existsSync(cacheDir)) return 0

  const keep = new Set<string>()
  for (const hash of validHashes) {
    const paths = cachePaths(hash)
    keep.add(basename(paths.light))
    keep.add(basename(paths.dark))
  }

  let pruned = 0
  for (const file of readdirSync(cacheDir)) {
    if (file.endsWith('.svg') && !keep.has(file)) {
      unlinkSync(join(cacheDir, file))
      pruned += 1
    }
  }
  return pruned
}

export async function findBlogMdxFiles(dir: string = blogDir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) return findBlogMdxFiles(fullPath)
      return entry.name.endsWith('.mdx') ? [fullPath] : []
    })
  )
  return nested.flat()
}

export function extractDiagrams(content: string): string[] {
  const diagrams: string[] = []
  for (const match of content.matchAll(MERMAID_FENCE)) {
    const code = match[1]?.trim()
    if (code) diagrams.push(code)
  }
  return diagrams
}

/** Remove fixed width/height so the SVG scales with its container (viewBox stays). */
function makeResponsive(svg: string): string {
  return svg.replace(/<svg\b[^>]*>/, (tag) => tag.replace(/\s(width|height)="[^"]*"/g, ''))
}

function renderVariant(code: string, variant: MermaidThemeVariant, outPath: string): void {
  const result = spawnSync('mmdr', ['-i', '-', '-e', 'svg', '-c', themeConfig[variant]], {
    input: code,
    encoding: 'utf8',
  })

  if (result.error) {
    if ((result.error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'mmdr binary not found on PATH. Install it with: cargo install mermaid-rs-renderer'
      )
    }
    throw result.error
  }

  if (result.status !== 0) {
    throw new Error(`mmdr failed for ${outPath}:\n${result.stderr}`)
  }

  writeFileSync(outPath, makeResponsive(result.stdout), 'utf8')
}

/** Render both theme SVGs for a single diagram if they aren't already cached. */
export function renderDiagram(code: string): 'rendered' | 'skipped' {
  const paths = cachePaths(hashMermaid(code))
  if (MERMAID_THEME_VARIANTS.every((variant) => existsSync(join(repoRoot, paths[variant])))) {
    return 'skipped'
  }

  mkdirSync(cacheDir, { recursive: true })
  for (const variant of MERMAID_THEME_VARIANTS) {
    renderVariant(code, variant, join(repoRoot, paths[variant]))
  }
  return 'rendered'
}

/** Render every diagram found in one MDX file. Returns the number rendered. */
export function renderMdxFile(absPath: string): number {
  const content = readFileSync(absPath, 'utf8')
  let rendered = 0
  for (const code of extractDiagrams(content)) {
    if (renderDiagram(code) === 'rendered') rendered += 1
  }
  return rendered
}

/** Render diagrams across every blog post. Used by `pnpm mermaid` and dev warm-up. */
export async function renderAllBlog(): Promise<RenderSummary> {
  if (!existsSync(blogDir)) {
    throw new Error(`Blog content directory not found: ${blogDir}`)
  }

  const files = await findBlogMdxFiles()
  const seen = new Set<string>()
  let rendered = 0
  let skipped = 0

  for (const file of files) {
    const content = readFileSync(file, 'utf8')
    for (const code of extractDiagrams(content)) {
      const hash = hashMermaid(code)
      if (seen.has(hash)) continue
      seen.add(hash)
      if (renderDiagram(code) === 'rendered') rendered += 1
      else skipped += 1
    }
  }

  const pruned = pruneOrphans(seen)

  return { rendered, skipped, unique: seen.size, pruned }
}

export function isBlogMdx(file: string): boolean {
  return file.endsWith('.mdx') && file.replaceAll('\\', '/').includes('/content/blog/')
}
