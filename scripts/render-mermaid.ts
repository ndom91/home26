/**
 * Local Mermaid pre-render step.
 *
 * Renders every ```mermaid fence under `content/blog` to a pair of theme-matched
 * SVGs (light + dark) in `content/.mermaid/`, committed to the repo so the
 * Cloudflare build never needs a browser or mmdr.
 *
 * Run with: `pnpm mermaid`
 * Requires `mmdr` on PATH: `cargo install mermaid-rs-renderer`.
 */
import { renderAllBlog } from '../src/lib/mermaid-render.ts'

renderAllBlog()
  .then(({ rendered, skipped, unique }) => {
    console.log(`Mermaid: ${rendered} rendered, ${skipped} cached, ${unique} unique diagram(s).`)
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
