import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { cachePaths, hashMermaid } from './mermaid'

// Anchor to the repo root. The plugin module is bundled into the vite config,
// so import.meta.url is unreliable; vite always runs from the project root.
const repoRoot = process.cwd()

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

function readCachedSvg(relativePath: string, diagram: string): string {
  try {
    return readFileSync(join(repoRoot, relativePath), 'utf8')
  } catch {
    const preview = diagram.split('\n', 1)[0]?.slice(0, 60) ?? ''
    throw new Error(
      `Missing pre-rendered Mermaid SVG: ${relativePath} (diagram "${preview}…").\n` +
        'Run `pnpm mermaid` to (re)render Mermaid diagrams, then commit content/.mermaid.'
    )
  }
}

function toMermaidFigure(code: string): MdxJsxFlowElement {
  const diagram = code.trim()
  const paths = cachePaths(hashMermaid(diagram))

  return {
    type: 'mdxJsxFlowElement',
    name: 'MermaidFigure',
    attributes: [
      { type: 'mdxJsxAttribute', name: 'lightSvg', value: readCachedSvg(paths.light, diagram) },
      { type: 'mdxJsxAttribute', name: 'darkSvg', value: readCachedSvg(paths.dark, diagram) },
    ],
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
 * Replaces ```mermaid fences with a <MermaidFigure> element carrying the two
 * pre-rendered (light/dark) SVGs. Runs in the remark phase so the fence is gone
 * before rehype-pretty-code would otherwise try to highlight it.
 */
export function remarkMermaid() {
  return (tree: MdastNode) => {
    transformChildren(tree)
  }
}
