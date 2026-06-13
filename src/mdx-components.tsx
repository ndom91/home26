import type { AnchorHTMLAttributes, ComponentType } from 'react'
import { Callout } from './components/mdx/callout'
import { CodeBlock, CodeEditor, CodeFigure } from './components/mdx/code-block'
import { MermaidFigure } from './components/mdx/mermaid'
import { ScreenshotLink } from './components/mdx/screenshot-link'
import { normalizeLinkScreenshotTarget } from './lib/link-screenshot'

type MDXComponent = ComponentType<Record<string, unknown>> | keyof React.JSX.IntrinsicElements
type MDXComponents = Record<string, MDXComponent>

function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: MdxAnchor as unknown as MDXComponent,
    figure: CodeFigure as unknown as MDXComponent,
    Callout: Callout as unknown as MDXComponent,
    CodeBlock: CodeBlock as unknown as MDXComponent,
    CodeEditor: CodeEditor as unknown as MDXComponent,
    MermaidFigure: MermaidFigure as unknown as MDXComponent,
    ScreenshotLink: ScreenshotLink as unknown as MDXComponent,
    ...components,
  }
}

function MdxAnchor({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && normalizeLinkScreenshotTarget(href)) {
    return <ScreenshotLink url={href}>{children}</ScreenshotLink>
  }

  return (
    <a href={href} {...props}>
      {children}
    </a>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components)
}

export const mdxComponents = getMDXComponents({})
