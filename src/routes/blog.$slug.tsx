import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { BlueskyComments } from '../components/BlueskyComments'
import { LinkScreenshotProvider } from '../components/mdx/link-screenshot-context'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import type { BlogPost as BlogPostType } from '../lib/blog'
import { getPublishedPost, getPublishedPosts, longestWordEm } from '../lib/blog'
import { mdxComponents } from '../mdx-components'

type PostMeta = Omit<BlogPostType, 'Component'>
type ArticleNavPost = Pick<PostMeta, 'description' | 'publishedAt' | 'slug' | 'title'>
type PostLoaderData = PostMeta & {
  nextPost: ArticleNavPost | null
  previousPost: ArticleNavPost | null
}

function toArticleNavPost(post: BlogPostType): ArticleNavPost {
  return {
    description: post.description,
    publishedAt: post.publishedAt,
    slug: post.slug,
    title: post.title,
  }
}

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }): PostLoaderData => {
    const posts = getPublishedPosts()
    const postIndex = posts.findIndex((post) => post.slug === params.slug)
    const post = posts[postIndex]

    if (!post) {
      throw notFound()
    }

    const { Component: _c, ...meta } = post

    return {
      ...meta,
      nextPost: posts[postIndex + 1] ? toArticleNavPost(posts[postIndex + 1]) : null,
      previousPost: posts[postIndex - 1] ? toArticleNavPost(posts[postIndex - 1]) : null,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — ndom91` },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: BlogPost,
})

function BlogPost() {
  const meta = Route.useLoaderData()
  const post = getPublishedPost(meta.slug)
  if (!post) return null
  const { Component } = post

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text">
      <SiteHeader />

      <header className="relative isolate overflow-hidden border-b border-blog-rule bg-[radial-gradient(circle_at_18%_8%,color-mix(in_oklab,var(--color-blog-accent)_20%,transparent),transparent_32%),radial-gradient(circle_at_82%_18%,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_28%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_48%)] px-5 py-8 sm:px-6 sm:py-12 lg:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-(image:--grit-image) bg-size-[220px_220px] bg-repeat opacity-[0.05] mix-blend-overlay"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <Link
            to="/blog"
            className="font-mono inline-block text-xs uppercase tracking-widest text-blog-muted transition-colors hover:text-blog-accent focus-visible:outline-2! focus-visible:outline-blog-accent! focus-visible:outline-offset-2!"
          >
            ← WRITING
          </Link>
          <div
            className={`mt-8 grid gap-7 ${
              meta.coverImageUrl
                ? 'lg:grid-cols-[minmax(22rem,0.95fr)_minmax(0,0.75fr)] lg:items-center lg:gap-10'
                : 'mx-auto max-w-5xl lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start'
            }`}
          >
            <div className="@container min-w-0 lg:pb-3 space-y-4">
              <p className="font-mono text-[9px] uppercase tracking-[0.34em] text-blog-faint mb-3">
                Field Note / {meta.publishedAt.slice(0, 4)}
              </p>
              <h1
                className="text-pretty font-heading max-w-4xl text-[min(clamp(3.15rem,5.5vw,6.55rem),calc(100cqi/var(--title-fit-em)))] font-extrabold uppercase leading-[0.94] tracking-normal text-blog-text wrap-break-word"
                style={{ '--title-fit-em': longestWordEm(meta.title) } as CSSProperties}
              >
                {meta.title}
              </h1>
              <p className="mt-5 max-w-xl font-reading text-base leading-7 text-blog-description sm:text-md sm:leading-8">
                {meta.description}
              </p>
              <div className="mt-7 border-l border-blog-rule pl-4">
                <p className="font-mono text-[9px] uppercase tracking-widest text-blog-faint">
                  Published
                </p>
                <time
                  dateTime={meta.publishedAt}
                  className="font-mono text-[10px] uppercase tracking-widest text-blog-muted"
                >
                  {meta.publishedAt}
                </time>
                {(meta.tags ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(meta.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="font-mono border border-blog-rule bg-blog-panel px-2 py-0.5 text-[9px] uppercase tracking-widest text-blog-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {meta.coverImageUrl ? (
              <figure className="relative order-first -mx-5 sm:mx-0 lg:order-none lg:rotate-[-1.4deg]">
                <div
                  className="pointer-events-none absolute -inset-4 hidden border border-blog-rule bg-blog-panel/55 dark:bg-ink lg:block"
                  aria-hidden="true"
                />
                <div className="relative overflow-hidden border-y border-blog-rule bg-blog-panel shadow-[0_1.5rem_4rem_color-mix(in_oklab,var(--color-blog-accent)_18%,transparent)] sm:border">
                  <img
                    src={meta.coverImageUrl}
                    alt=""
                    width="1448"
                    height="1086"
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  <div
                    className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,transparent_58%,color-mix(in_oklab,var(--color-blog-accent)_22%,transparent)),linear-gradient(0deg,rgb(0_0_0/0.14),transparent_34%)] mix-blend-multiply dark:mix-blend-screen"
                    aria-hidden="true"
                  />
                </div>
              </figure>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex-1 px-6 py-12 sm:py-16">
        <article className="prose mx-auto max-w-2xl font-reading prose-headings:mt-12 prose-headings:text-balance prose-headings:font-heading prose-headings:text-blog-text prose-p:text-[1.05rem] prose-p:leading-8 prose-p:text-blog-description prose-a:text-blog-accent prose-strong:text-blog-text prose-li:text-[1.05rem] prose-li:leading-8 prose-li:text-blog-description prose-th:text-blog-text prose-td:text-blog-description prose-code:bg-blog-panel prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-blog-text prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-blog-accent prose-blockquote:text-blog-description prose-hr:border-blog-rule prose-img:border prose-img:border-blog-rule prose-img:bg-blog-panel prose-img:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-blog-accent)_12%,transparent)] lg:prose-img:-mx-16 lg:prose-img:w-[calc(100%+8rem)] lg:prose-img:max-w-none prose-pre:border prose-pre:border-blog-rule prose-pre:bg-blog-panel!">
          <LinkScreenshotProvider urls={meta.linkScreenshotUrls}>
            <Component components={mdxComponents} />
          </LinkScreenshotProvider>
        </article>
        <ArticleNavigation nextPost={meta.nextPost} previousPost={meta.previousPost} />
        {meta.atprotoUri ? <BlueskyComments atprotoUri={meta.atprotoUri} /> : null}
      </div>

      <SiteFooter variant="blog" />
    </div>
  )
}

function ArticleNavigation({
  nextPost,
  previousPost,
}: {
  nextPost: ArticleNavPost | null
  previousPost: ArticleNavPost | null
}) {
  if (!nextPost && !previousPost) {
    return null
  }

  return (
    <nav
      aria-label="Article navigation"
      className="mx-auto mt-14 grid max-w-5xl gap-px overflow-hidden border border-blog-rule bg-blog-rule sm:grid-cols-2"
    >
      {previousPost ? (
        <ArticleNavLink direction="previous" post={previousPost} />
      ) : (
        <div className="hidden bg-blog-bg sm:block" aria-hidden="true" />
      )}
      {nextPost ? (
        <ArticleNavLink direction="next" post={nextPost} />
      ) : (
        <div className="hidden bg-blog-bg sm:block" aria-hidden="true" />
      )}
    </nav>
  )
}

function ArticleNavLink({
  direction,
  post,
}: {
  direction: 'next' | 'previous'
  post: ArticleNavPost
}) {
  const isNext = direction === 'next'

  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`group flex min-h-48 flex-col justify-between bg-blog-panel p-5 transition-colors hover:bg-blog-hover sm:p-6 ${
        isNext ? 'text-right' : ''
      }`}
    >
      <div>
        <p className="font-mono mb-4 text-[9px] uppercase tracking-widest text-blog-faint transition-colors group-hover:text-blog-accent">
          {isNext ? 'Next article' : 'Prev article'}
        </p>
        <h2 className="text-balance font-heading text-xl font-extrabold uppercase leading-[0.95] text-blog-text transition-colors group-hover:text-blog-accent sm:text-4xl">
          {post.title}
        </h2>
        <p className="mt-4 line-clamp-2 font-reading text-sm leading-6 text-blog-description">
          {post.description}
        </p>
      </div>
      <div
        className={`font-mono mt-6 flex items-center gap-3 text-[10px] uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent ${
          isNext ? 'justify-end' : ''
        }`}
      >
        {!isNext ? (
          <span className="transition-transform group-hover:-translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            ←
          </span>
        ) : null}
        <time dateTime={post.publishedAt}>{post.publishedAt}</time>
        {isNext ? (
          <span className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            →
          </span>
        ) : null}
      </div>
    </Link>
  )
}
