import { createProcessor } from '@mdx-js/mdx'
import { toString as hastToString } from 'hast-util-to-string'
import rehypeCallouts from 'rehype-callouts'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

export type PostHeading = { id: string; text: string; level: 2 | 3 }

interface HastNode {
  type: string
  tagName?: string
  properties?: { id?: unknown }
  children?: HastNode[]
}

/**
 * Build-time table of contents. Runs the same heading-affecting plugins as
 * the MDX pipeline in vite.config.ts (callouts, then rehype-slug), so the
 * ids match the rendered headings exactly. Keep the two lists in sync.
 */
export async function extractHeadings(content: string): Promise<PostHeading[]> {
  const headings: PostHeading[] = []

  const collect = () => (tree: HastNode) => {
    const visit = (node: HastNode) => {
      if (node.type === 'element' && (node.tagName === 'h2' || node.tagName === 'h3')) {
        const id = node.properties?.id
        const text = hastToString(node as Parameters<typeof hastToString>[0]).trim()
        if (typeof id === 'string' && text) {
          headings.push({ id, text, level: node.tagName === 'h3' ? 3 : 2 })
        }
      }
      node.children?.forEach(visit)
    }
    visit(tree)
  }

  await createProcessor({
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeCallouts, { theme: 'vitepress' }], rehypeSlug, collect],
  }).process(content)

  return headings
}
