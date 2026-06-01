import type { ReactNode } from 'react'
import { isValidElement, useState } from 'react'

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }

  return ''
}

export function CodeBlock({ children, title }: { children?: ReactNode; title?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const code = getNodeText(children).trimEnd()

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1800)
    }
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
          disabled={!code}
          className="rounded-full border border-blog-rule px-3 py-1 font-mono text-[10px] uppercase leading-none tracking-widest text-blog-muted opacity-0 transition hover:cursor-pointer hover:border-blog-accent hover:text-blog-accent focus-visible:opacity-100 focus-visible:outline-2! focus-visible:outline-blog-accent/60! focus-visible:outline-offset-2! disabled:pointer-events-none disabled:opacity-30 group-hover/code:opacity-100 motion-reduce:transition-none"
        >
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
        </button>
      </figcaption>
      <div className="[&_pre]:m-0! [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:shadow-none! [&_figure]:my-0!">
        {children}
      </div>
    </figure>
  )
}

export function CodeEditor(props: { children?: ReactNode; title?: string }) {
  return <CodeBlock {...props} />
}
