import * as v from 'valibot'

const postModules = import.meta.glob('../../content/blog/*.mdx', {
  eager: true,
})

const frontmatterSchema = v.object({
  title: v.pipe(v.string(), v.nonEmpty()),
  description: v.pipe(v.string(), v.nonEmpty()),
  publishedAt: v.pipe(v.string(), v.isoDate()),
  tags: v.optional(v.array(v.string()), []),
  draft: v.optional(v.boolean(), false),
})

type Frontmatter = v.InferOutput<typeof frontmatterSchema>

type PostModule = {
  default: React.ComponentType
  frontmatter: unknown
}

export type BlogPost = Frontmatter & {
  slug: string
  Component: React.ComponentType
}

function slugFromPath(path: string) {
  const fileName = path.split('/').at(-1)

  if (!fileName) {
    throw new Error(`Unable to derive slug from path: ${path}`)
  }

  return fileName.replace(/\.mdx$/, '')
}

function getAllPosts() {
  const posts = Object.entries(postModules).map(([path, module]) => {
    const postModule = module as PostModule
    const frontmatter = v.parse(frontmatterSchema, postModule.frontmatter)

    return {
      ...frontmatter,
      slug: slugFromPath(path),
      Component: postModule.default,
    }
  })

  return [...posts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPublishedPosts() {
  return getAllPosts().filter((post) => !post.draft)
}

export function getPublishedPost(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug)
}
