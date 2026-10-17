import {
  createDefaultImport,
  defineCollection,
  defineConfig,
} from '@content-collections/core'
import readingTime from 'reading-time'
import * as v from 'valibot'
import { imageLqip } from './src/lib/image-lqip'
import { imageVariants, socialImageQuery, srcsetQuery, variantQuery } from './src/lib/image-variants'
import { extractHeadings } from './src/lib/post-headings'
import { descriptionFromContent, slugFromPath } from './src/lib/post-meta'
import { collectBlogLinkTargets } from './src/lib/link-screenshot-targets'
import { signLinkScreenshotUrls } from './src/lib/sign-link-screenshot'

const isoDate = v.pipe(v.string(), v.isoDate())

function directoryFromPath(path: string) {
  const parts = path.split('/')
  const fileName = parts.at(-1)

  if (!fileName) {
    throw new Error(`Unable to derive directory from path: ${path}`)
  }

  return parts.slice(0, -1).join('/')
}

function imageFilePath(postPath: string, imageFile: string) {
  if (imageFile.startsWith('./')) {
    const directory = directoryFromPath(postPath)
    return [directory, imageFile.slice(2)].filter(Boolean).join('/')
  }

  return imageFile
}

function imageImportPath(postPath: string, imageFile: string) {
  return `#content/blog/${imageFilePath(postPath, imageFile)}`
}

function linkScreenshotUrlsFromContent(content: string) {
  return signLinkScreenshotUrls(collectBlogLinkTargets(content))
}

// Reading time in seconds, via the `reading-time` library (what
// remark-reading-time wraps). Computed here in the transform because the header
// estimate is post metadata, not part of the MDX render pipeline.
function readTimeSecondsFromContent(content: string) {
  return Math.round(readingTime(content).time / 1000)
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

    const coverPath = post.cover
      ? `${process.cwd()}/content/blog/${imageFilePath(post._meta.filePath, post.cover.imageFile)}`
      : null
    const coverVariants = coverPath ? await imageVariants(coverPath) : null
    const coverImport = post.cover
      ? imageImportPath(post._meta.filePath, post.cover.imageFile)
      : null

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
      readTimeSeconds: readTimeSecondsFromContent(post.content),
      headings: await extractHeadings(post.content),
      linkScreenshotUrls: await linkScreenshotUrlsFromContent(post.content),
      coverImageUrl:
        coverImport && coverVariants
          ? createDefaultImport<string>(`${coverImport}${variantQuery(coverVariants.widths.at(-1) ?? coverVariants.width)}`)
          : null,
      coverImageSrcSet:
        coverImport && coverVariants
          ? createDefaultImport<string>(`${coverImport}${srcsetQuery(coverVariants.widths)}`)
          : null,
      coverImageSocialUrl: coverImport
        ? createDefaultImport<string>(`${coverImport}${socialImageQuery()}`)
        : null,
      coverImageLqip: coverPath ? await imageLqip(coverPath) : null,
      bodyPath: post._meta.filePath,
    }
  },
})

export default defineConfig({
  content: [posts],
})
