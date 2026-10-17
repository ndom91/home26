import type { ComponentPropsWithoutRef, ReactNode } from 'react'
import { createContext, useContext, useRef, useState } from 'react'

const CodeBlockContext = createContext(false)

export function CodeBlock({ children, title }: { children?: ReactNode; title?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const bodyRef = useRef<HTMLDivElement>(null)

  async function copyCode() {
    // Read the rendered code on demand instead of walking the React tree.
    const code = bodyRef.current?.querySelector('pre')?.textContent?.trimEnd() ?? ''
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
    } catch {
      setCopyState('failed')
    }
    window.setTimeout(() => setCopyState('idle'), 1800)
  }

  return (
    <figure className="group/code my-8 overflow-hidden rounded-2xl border border-blog-rule bg-blog-panel shadow-[0_18px_50px_color-mix(in_oklab,var(--color-blog-bg)_65%,transparent)]">
      <figcaption className="flex h-10 mt-0 items-center gap-3 border-b border-blog-rule bg-blog-panel/70 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-blog-muted/40" />
          <span className="size-2.5 rounded-full bg-blog-muted/30" />
          <span className="size-2.5 rounded-full bg-blog-muted/20" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase leading-none tracking-widest text-blog-muted">
          {title ?? 'Code'}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="rounded-full border border-blog-rule px-3 py-1.5 font-mono text-[10px] uppercase leading-none tracking-widest text-blog-muted opacity-0 transition-[border-color,color,opacity,scale] hover:cursor-pointer hover:border-blog-accent hover:text-blog-accent active:scale-[0.96] focus-visible:opacity-100 focus-visible:outline-2! focus-visible:outline-blog-accent/60! focus-visible:outline-offset-2! disabled:pointer-events-none disabled:opacity-30 group-hover/code:opacity-100 motion-reduce:transition-none"
        >
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
        </button>
      </figcaption>
      <div
        ref={bodyRef}
        className="code-block-body [&_pre]:m-0! [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:shadow-none! [&_figure]:my-0!"
      >
        <CodeBlockContext.Provider value={true}>{children}</CodeBlockContext.Provider>
      </div>
    </figure>
  )
}

export function CodeFigure({ children, ...props }: ComponentPropsWithoutRef<'figure'>) {
  const isInsideCodeBlock = useContext(CodeBlockContext)
  const isPrettyCodeFigure = Object.hasOwn(props, 'data-rehype-pretty-code-figure')

  if (!isPrettyCodeFigure || isInsideCodeBlock) {
    return <figure {...props}>{children}</figure>
  }

  // Title comes from src/lib/rehype-code-title.ts at build time.
  const { 'data-code-title': title, ...figureProps } = props as typeof props & {
    'data-code-title'?: string
  }

  return (
    <CodeBlock title={title}>
      <figure {...figureProps}>{children}</figure>
    </CodeBlock>
  )
}
