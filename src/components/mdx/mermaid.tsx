/**
 * Renders a Mermaid diagram from two pre-rendered, theme-matched SVGs.
 *
 * Both SVGs are emitted at build time by `pnpm mermaid` (mmdr) and injected by
 * the `remarkMermaid` plugin. The markup is self-authored and build-time only,
 * so `dangerouslySetInnerHTML` is safe and renders during prerender with no
 * client-side Mermaid runtime. CSS in `styles.css` shows the variant that
 * matches the active theme.
 */
export function MermaidFigure({ lightSvg, darkSvg }: { lightSvg: string; darkSvg: string }) {
  return (
    <figure className="not-prose my-8 overflow-hidden rounded-2xl border border-blog-rule bg-blog-panel shadow-[0_18px_50px_color-mix(in_oklab,var(--color-blog-bg)_65%,transparent)]">
      <div className="overflow-x-auto px-4 py-6">
        <div className="mermaid-light" dangerouslySetInnerHTML={{ __html: lightSvg }} />
        <div className="mermaid-dark" dangerouslySetInnerHTML={{ __html: darkSvg }} />
      </div>
    </figure>
  )
}
