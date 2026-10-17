import { createHash } from 'node:crypto'
import { PeleError, render } from 'pele'

interface MdastNode {
  type: string
  lang?: string | null
  value?: string
  children?: MdastNode[]
}

interface MdxJsxAttribute {
  type: 'mdxJsxAttribute'
  name: string
  value: string
}

interface MdxJsxFlowElement {
  type: 'mdxJsxFlowElement'
  name: string
  attributes: MdxJsxAttribute[]
  children: never[]
}

function renderSvg(diagram: string): string {
  // Unique per diagram so two figures on one page never share SVG ids.
  const idPrefix = `m${createHash('sha256').update(diagram).digest('hex').slice(0, 8)}-`

  try {
    return render(diagram, {
      idPrefix,
      fontFamily: "'Neue Montreal', sans-serif",
      fontFamilyMono: "'IBM Plex Mono', monospace",
    }).svg
  } catch (error) {
    if (!(error instanceof PeleError)) throw error
    const preview = diagram.split('\n', 1)[0]?.slice(0, 60) ?? ''
    throw new Error(`Failed to render Mermaid diagram "${preview}…": ${error.message}`)
  }
}

function toMermaidFigure(code: string): MdxJsxFlowElement {
  return {
    type: 'mdxJsxFlowElement',
    name: 'MermaidFigure',
    attributes: [{ type: 'mdxJsxAttribute', name: 'svg', value: renderSvg(code.trim()) }],
    children: [],
  }
}

function transformChildren(node: MdastNode): void {
  if (!node.children) return

  node.children = node.children.flatMap((child) => {
    if (child.type === 'code' && child.lang === 'mermaid' && child.value) {
      return [toMermaidFigure(child.value) as unknown as MdastNode]
    }
    transformChildren(child)
    return [child]
  })
}

/**
 * Replaces ```mermaid fences with a <MermaidFigure> carrying a pele-rendered
 * SVG. Colors and fonts come from `--pele-*` CSS variables, so one SVG serves
 * both themes. Runs in the remark phase so the fence is gone before
 * rehype-pretty-code would otherwise try to highlight it.
 */
export function remarkMermaid() {
  return (tree: MdastNode) => {
    transformChildren(tree)
  }
}
