import type { ComponentType, ReactNode } from 'react'
import { Callout } from './components/mdx/callout'

type MDXComponent = ComponentType<Record<string, unknown>> | keyof React.JSX.IntrinsicElements
type MDXComponents = Record<string, MDXComponent>

function CodeEditor({ children, title }: { children?: ReactNode; title?: string }) {
  return (
    <figure className="my-6 overflow-hidden border border-blog-rule bg-blog-panel">
      {title ? (
        <figcaption className="border-b border-blog-rule px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-blog-muted">
          {title}
        </figcaption>
      ) : null}
      <div className="[&>pre]:!my-0 [&>pre]:!rounded-none [&>pre]:!border-0">{children}</div>
    </figure>
  )
}

function ScreenshotLink({
  children,
  text,
  url,
}: {
  children?: ReactNode
  text?: string
  url: string
  image?: string
}) {
  return (
    <a href={url} target="_blank" rel="noreferrer">
      {children ?? text ?? url}
    </a>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout: Callout as unknown as MDXComponent,
    CodeEditor: CodeEditor as unknown as MDXComponent,
    ScreenshotLink: ScreenshotLink as unknown as MDXComponent,
    ...components,
  }
}
