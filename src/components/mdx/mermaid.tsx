/**
 * Renders a Mermaid diagram from an SVG that pele produced at build time.
 *
 * The SVG is injected by the `remarkMermaid` plugin. The markup is
 * self-authored and build-time only, so `dangerouslySetInnerHTML` is safe and
 * renders during prerender with no client-side Mermaid runtime. Colors follow
 * the active theme through the `--pele-*` variables set in `styles.css`.
 */
export function MermaidFigure({ svg }: { svg: string }) {
  return (
    <figure className="mermaid-figure not-prose my-8 overflow-hidden rounded-2xl border border-blog-rule bg-blog-panel shadow-[0_18px_50px_color-mix(in_oklab,var(--color-blog-bg)_65%,transparent)]">
      <div className="overflow-x-auto px-4 py-6" dangerouslySetInnerHTML={{ __html: svg }} />
    </figure>
  )
}
