import { dirname, resolve } from 'node:path'
import { imageLqip } from './image-lqip'

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

interface VFile {
  path?: string
}

async function addLqips(node: HastNode, filePath: string): Promise<void> {
  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src

    if (
      typeof src === 'string' &&
      !src.startsWith('/') &&
      !src.includes('://') &&
      !src.startsWith('data:')
    ) {
      node.properties ??= {}
      node.properties['data-lqip'] = await imageLqip(resolve(dirname(filePath), src))
    }
  }

  await Promise.all(node.children?.map((child) => addLqips(child, filePath)) ?? [])
}

/** Adds a build-time inline LQIP to local Markdown images before Vite imports them. */
export function rehypeImageLqip() {
  return async (tree: HastNode, file: VFile) => {
    if (!file.path) {
      return
    }

    await addLqips(tree, file.path)
  }
}
