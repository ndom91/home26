import { createHash } from 'node:crypto'

/**
 * Directory (relative to the repo root) where pre-rendered Mermaid SVGs are
 * committed. Diagrams are rendered locally via `pnpm mermaid` (mmdr) so the
 * Cloudflare build never needs a browser or the mmdr binary.
 */
export const MERMAID_CACHE_DIR = 'content/.mermaid'

/**
 * Stable identifier for a diagram derived from its source text. The pre-render
 * script and the remark plugin both call this so cache lookups never drift.
 */
export function hashMermaid(code: string): string {
  return createHash('sha256').update(code.trim()).digest('hex').slice(0, 16)
}

export interface MermaidCachePaths {
  light: string
  dark: string
}

/**
 * Cache file paths for a diagram hash, one SVG per theme variant.
 */
export function cachePaths(hash: string): MermaidCachePaths {
  return {
    light: `${MERMAID_CACHE_DIR}/${hash}.light.svg`,
    dark: `${MERMAID_CACHE_DIR}/${hash}.dark.svg`,
  }
}

export const MERMAID_THEME_VARIANTS = ['light', 'dark'] as const

export type MermaidThemeVariant = (typeof MERMAID_THEME_VARIANTS)[number]
