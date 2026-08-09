interface HastNode {
  type: string
  tagName?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
  value?: string
}

function imageCaption(node: HastNode): string | undefined {
  const alt = node.properties?.alt
  return typeof alt === 'string' && alt ? alt : undefined
}

function toImageFigure(content: HastNode, caption: string): HastNode {
  return {
    type: 'element',
    tagName: 'figure',
    properties: { className: ['mdx-image-figure'] },
    children: [
      content,
      {
        type: 'element',
        tagName: 'figcaption',
        properties: { className: ['mdx-image-caption'] },
        children: [{ type: 'text', value: caption }],
      },
    ],
  }
}

function imageContent(node: HastNode): { content: HastNode; caption?: string } | undefined {
  if (node.type === 'element' && node.tagName === 'img') {
    return { content: node, caption: imageCaption(node) }
  }

  const image = node.children?.[0]
  if (
    node.type === 'element' &&
    node.tagName === 'a' &&
    node.children?.length === 1 &&
    image?.type === 'element' &&
    image.tagName === 'img'
  ) {
    return { content: node, caption: imageCaption(image) }
  }
}

function imageFigures(node: HastNode): HastNode[] | undefined {
  if (node.type !== 'element' || node.tagName !== 'p' || !node.children?.length) return

  const images: HastNode[] = []
  for (const child of node.children) {
    if (child.type === 'text' && !child.value?.trim()) continue

    const image = imageContent(child)
    if (!image) return

    images.push(image.caption ? toImageFigure(image.content, image.caption) : image.content)
  }

  return images.length ? images : undefined
}

function transformChildren(node: HastNode): void {
  if (!node.children) return

  node.children = node.children.flatMap((child) => {
    transformChildren(child)

    return imageFigures(child) ?? [child]
  })
}

/** Converts standalone Markdown images with alt text into semantic figures. */
export function rehypeImageCaptions() {
  return (tree: HastNode) => transformChildren(tree)
}
