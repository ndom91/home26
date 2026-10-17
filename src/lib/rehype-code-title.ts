import { toString as hastToString } from 'hast-util-to-string'

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

// rehype-pretty-code writes raw kebab-case keys rather than hast's camelCase.
const has = (node: HastNode, key: string) => !!node.properties && key in node.properties

function findLanguage(node: HastNode): string | undefined {
  const language = node.properties?.['data-language'] ?? node.properties?.dataLanguage
  if (typeof language === 'string' && language) return language
  for (const child of node.children ?? []) {
    const found = findLanguage(child)
    if (found) return found
  }
  return undefined
}

/**
 * Runs after rehype-pretty-code. Moves each code figure's title (or, failing
 * that, its language) onto `data-code-title` and drops the title node, so
 * CodeFigure renders the header without walking the React tree at runtime.
 */
export function rehypeCodeTitle() {
  return (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === 'element' && has(node, 'data-rehype-pretty-code-figure')) {
        const children = node.children ?? []
        const titleNode = children.find((child) => has(child, 'data-rehype-pretty-code-title'))
        const title = titleNode
          ? hastToString(titleNode as Parameters<typeof hastToString>[0]).trim()
          : findLanguage(node)
        if (titleNode) node.children = children.filter((child) => child !== titleNode)
        if (title && node.properties) node.properties['data-code-title'] = title
        return
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }
}
