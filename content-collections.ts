import {
  createDefaultImport,
  defineCollection,
  defineConfig,
} from '@content-collections/core'
import type { MDXContent } from 'mdx/types.js'
import * as v from 'valibot'
import { collectBlogLinkTargets } from './src/lib/link-screenshot-targets'
import { signLinkScreenshotUrls } from './src/lib/sign-link-screenshot'

const isoDate = v.pipe(v.string(), v.isoDate())

function slugFromPath(path: string) {
  const parts = path.split('/')
  const fileName = parts.at(-1)

  if (!fileName) {
    throw new Error(`Unable to derive slug from path: ${path}`)
  }

  if (fileName === 'index.mdx') {
    const directoryName = parts.at(-2)

    if (!directoryName) {
      throw new Error(`Unable to derive slug from path: ${path}`)
    }

    return directoryName
  }

  return fileName.replace(/\.mdx$/, '')
}

function directoryFromPath(path: string) {
  const parts = path.split('/')
  const fileName = parts.at(-1)

  if (!fileName) {
    throw new Error(`Unable to derive directory from path: ${path}`)
  }

  if (fileName === 'index.mdx') {
    return parts.slice(0, -1).join('/')
  }

  return parts.slice(0, -1).join('/')
}

function imageImportPath(postPath: string, imageFile: string) {
  if (imageFile.startsWith('./')) {
    const directory = directoryFromPath(postPath)
    const filePath = [directory, imageFile.slice(2)].filter(Boolean).join('/')

    return `#content/blog/${filePath}`
  }

  return `#content/blog/${imageFile}`
}

function descriptionFromContent(content: string) {
  const firstParagraph = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .find(
      (block) =>
        block.length > 0 &&
        !block.startsWith('import ') &&
        !block.startsWith('#') &&
        !block.startsWith('```') &&
        !block.startsWith('<')
    )

  if (!firstParagraph) {
    return 'Notes from the archive.'
  }

  const description = firstParagraph
    .replace(/<([A-Z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/g, '$2')
    .replace(/<[^>]+>/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return excerptCompleteSentences(description)
}

function excerptCompleteSentences(text: string, targetLength = 180) {
  if (text.length <= targetLength) {
    return text
  }

  const sentenceEnd = /[.!?](?:["')\]]+)?(?=\s|$)/g
  let lastEndBeforeTarget = 0
  let firstEnd = 0

  for (const match of text.matchAll(sentenceEnd)) {
    const end = match.index + match[0].length

    if (isDottedAbbreviation(text.slice(0, end))) {
      continue
    }

    firstEnd ||= end

    if (end > targetLength) {
      break
    }

    lastEndBeforeTarget = end
  }

  const end = lastEndBeforeTarget || firstEnd

  return end ? text.slice(0, end).trim() : text
}

function isDottedAbbreviation(textBeforeBoundary: string) {
  return /(?:^|\s)(?:e\.g|i\.e|vs|mr|mrs|ms|dr|prof|sr|jr)\.$/i.test(textBeforeBoundary)
}

function linkScreenshotUrlsFromContent(content: string) {
  return signLinkScreenshotUrls(collectBlogLinkTargets(content))
}

const posts = defineCollection({
  name: 'posts',
  directory: 'content/blog',
  include: '**/*.mdx',
  schema: v.object({
    title: v.pipe(v.string(), v.nonEmpty()),
    description: v.optional(v.string()),
    publishedAt: v.optional(isoDate),
    date: v.optional(isoDate),
    tags: v.optional(v.array(v.string()), []),
    draft: v.optional(v.boolean(), false),
    type: v.optional(v.picklist(['post', 'field-notes']), 'post'),
    discussionAtprotoUri: v.optional(v.pipe(v.string(), v.startsWith('at://'))),
    standardSiteUri: v.optional(v.pipe(v.string(), v.startsWith('at://'))),
    cover: v.optional(
      v.object({
        imageFile: v.string(),
      })
    ),
    content: v.string(),
  }),
  transform: async (post) => {
    const publishedAt = post.publishedAt ?? post.date

    if (!publishedAt) {
      throw new Error(`Missing publishedAt/date frontmatter for post: ${post._meta.filePath}`)
    }

    return {
      title: post.title,
      description: post.description ?? descriptionFromContent(post.content),
      publishedAt,
      tags: post.tags,
      draft: post.draft,
      type: post.type,
      discussionAtprotoUri: post.discussionAtprotoUri ?? null,
      standardSiteUri: post.standardSiteUri ?? null,
      slug: slugFromPath(post._meta.filePath),
      linkScreenshotUrls: await linkScreenshotUrlsFromContent(post.content),
      coverImageUrl: post.cover
        ? createDefaultImport<string>(imageImportPath(post._meta.filePath, post.cover.imageFile))
        : null,
      Component: createDefaultImport<MDXContent>(`#content/blog/${post._meta.filePath}`),
    }
  },
})

export default defineConfig({
  content: [posts],
})
