import type { Logger, Plugin } from 'vite'
import { isBlogMdx, renderAllBlog, renderMdxFile } from './mermaid-render.ts'

/**
 * Dev-only convenience: keeps the committed Mermaid SVG cache in sync while the
 * dev server runs, so editing a ```mermaid fence no longer requires manually
 * running `pnpm mermaid` and restarting.
 *
 * - On startup it warms the cache for every blog post.
 * - On each blog MDX change it (re)renders that file's diagrams *before* the
 *   MDX module re-transforms, so `remarkMermaid` finds the fresh SVGs.
 *
 * Production builds don't use this plugin (apply: 'serve'); they read the
 * committed SVGs only, so no browser/mmdr is ever needed in CI.
 */
export function mermaidPlugin(): Plugin {
  let logger: Logger | Console = console

  return {
    name: 'mermaid-dev-render',
    apply: 'serve',
    configResolved(config) {
      logger = config.logger
    },
    async buildStart() {
      try {
        const { rendered, unique } = await renderAllBlog()
        if (rendered > 0) {
          logger.info(`[mermaid] warmed cache: ${rendered} rendered, ${unique} unique diagram(s)`)
        }
      } catch (error) {
        logger.warn(`[mermaid] ${error instanceof Error ? error.message : String(error)}`)
      }
    },
    handleHotUpdate(ctx) {
      if (!isBlogMdx(ctx.file)) return
      try {
        const rendered = renderMdxFile(ctx.file)
        if (rendered > 0) {
          logger.info(
            `[mermaid] rendered ${rendered} diagram(s) in ${ctx.file.split('/content/').at(-1)}`
          )
        }
      } catch (error) {
        logger.warn(`[mermaid] ${error instanceof Error ? error.message : String(error)}`)
      }
    },
  }
}
