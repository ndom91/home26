/**
 * Local Mermaid pre-render step.
 *
 * Scans `content/blog/**\/*.mdx` for ```mermaid fences and renders each one to a
 * pair of theme-matched SVGs (light + dark) using the native `mmdr` binary
 * (mermaid-rs-renderer). Output is written to `content/.mermaid/` and committed
 * to the repo, so the Cloudflare build never needs a browser or mmdr.
 *
 * Run with: `pnpm mermaid`
 * Requires `mmdr` on PATH: `cargo install mermaid-rs-renderer`.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, readdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  MERMAID_CACHE_DIR,
  MERMAID_THEME_VARIANTS,
  type MermaidThemeVariant,
  cachePaths,
  hashMermaid,
} from '../src/lib/mermaid.ts'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(scriptDir, '..')
const blogDir = join(repoRoot, 'content/blog')
const cacheDir = join(repoRoot, MERMAID_CACHE_DIR)

const themeConfig: Record<MermaidThemeVariant, string> = {
  light: join(scriptDir, 'mermaid-theme.light.json'),
  dark: join(scriptDir, 'mermaid-theme.dark.json'),
}

const MERMAID_FENCE = /^```mermaid[^\n]*\n([\s\S]*?)^```/gm

async function findMdxFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) return findMdxFiles(fullPath)
      return entry.name.endsWith('.mdx') ? [fullPath] : []
    })
  )
  return files.flat()
}

function extractDiagrams(content: string): string[] {
  const diagrams: string[] = []
  for (const match of content.matchAll(MERMAID_FENCE)) {
    const code = match[1]?.trim()
    if (code) diagrams.push(code)
  }
  return diagrams
}

/** Remove fixed width/height so the SVG scales with its container (viewBox stays). */
function makeResponsive(svg: string): string {
  return svg.replace(/<svg\b[^>]*>/, (tag) =>
    tag.replace(/\s(width|height)="[^"]*"/g, '')
  )
}

function renderVariant(code: string, variant: MermaidThemeVariant, outPath: string): void {
  const result = spawnSync(
    'mmdr',
    ['-i', '-', '-e', 'svg', '-c', themeConfig[variant]],
    { input: code, encoding: 'utf8' }
  )

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

async function main(): Promise<void> {
  if (!existsSync(blogDir)) {
    throw new Error(`Blog content directory not found: ${blogDir}`)
  }

  await mkdir(cacheDir, { recursive: true })

  const files = await findMdxFiles(blogDir)
  const seen = new Set<string>()
  let rendered = 0
  let skipped = 0

  for (const file of files) {
    const content = await readFile(file, 'utf8')
    for (const code of extractDiagrams(content)) {
      const hash = hashMermaid(code)
      if (seen.has(hash)) continue
      seen.add(hash)

      const paths = cachePaths(hash)
      const allExist = MERMAID_THEME_VARIANTS.every((variant) =>
        existsSync(join(repoRoot, paths[variant]))
      )
      if (allExist) {
        skipped += 1
        continue
      }

      for (const variant of MERMAID_THEME_VARIANTS) {
        renderVariant(code, variant, join(repoRoot, paths[variant]))
      }
      rendered += 1
    }
  }

  console.log(
    `Mermaid: ${rendered} rendered, ${skipped} cached, ${seen.size} unique diagram(s) across ${files.length} file(s).`
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
