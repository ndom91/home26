import type { ComponentType } from 'react'
import { Callout } from './components/mdx/callout'
import { CodeBlock, CodeEditor } from './components/mdx/code-block'
import { ScreenshotLink } from './components/mdx/screenshot-link'

type MDXComponent = ComponentType<Record<string, unknown>> | keyof React.JSX.IntrinsicElements
type MDXComponents = Record<string, MDXComponent>

function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout: Callout as unknown as MDXComponent,
    CodeBlock: CodeBlock as unknown as MDXComponent,
    CodeEditor: CodeEditor as unknown as MDXComponent,
    ScreenshotLink: ScreenshotLink as unknown as MDXComponent,
    ...components,
  }
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components)
}

export const mdxComponents = getMDXComponents({})
