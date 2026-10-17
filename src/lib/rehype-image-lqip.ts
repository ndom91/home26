import { dirname, resolve } from 'node:path'
import { imageLqip } from './image-lqip'
import { imageVariants, isRasterImage, variantQuery } from './image-variants'

interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}

interface VFile {
  path?: string
}

// The first image in a post may be above the fold, so only later ones lazy-load.
async function addLqips(
  node: HastNode,
  filePath: string,
  state: { seenImage: boolean }
): Promise<void> {
  if (node.type === 'element' && node.tagName === 'img') {
    const src = node.properties?.src

    if (
      typeof src === 'string' &&
      !src.startsWith('/') &&
      !src.includes('://') &&
      !src.startsWith('data:')
    ) {
      const absolutePath = resolve(dirname(filePath), src)
      node.properties ??= {}
      node.properties['data-lqip'] = await imageLqip(absolutePath)

      if (isRasterImage(src)) {
        // Query strings survive rehype-mdx-import-media, so vite-imagetools
        // turns each URL into a resized WebP at build time.
        const { width, height, widths } = await imageVariants(absolutePath)
        node.properties.src = `${src}${variantQuery(widths.at(-1) ?? width)}`
        node.properties.srcSet = widths.map((w) => `${src}${variantQuery(w)} ${w}w`).join(', ')
        // Post images render slightly wider than the 42rem prose column.
        node.properties.sizes = '(min-width: 50rem) 50rem, 100vw'
        node.properties.width = width
        node.properties.height = height
        node.properties.decoding = 'async'
        if (state.seenImage) node.properties.loading = 'lazy'
      }
      state.seenImage = true
    }
  }

  for (const child of node.children ?? []) await addLqips(child, filePath, state)
}

/**
 * Adds a build-time inline LQIP, intrinsic size and responsive WebP srcset to
 * local Markdown images before Vite imports them.
 */
export function rehypeImageLqip() {
  return async (tree: HastNode, file: VFile) => {
    if (!file.path) {
      return
    }

    await addLqips(tree, file.path, { seenImage: false })
  }
}
