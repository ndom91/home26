import type { ComponentType } from 'react'

type MDXComponents = Record<string, ComponentType | keyof React.JSX.IntrinsicElements>

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...components,
  }
}
