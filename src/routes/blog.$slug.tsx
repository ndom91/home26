import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { SiteHeader } from '../components/SiteHeader'
import type { BlogPost as BlogPostType } from '../lib/blog'
import { getPublishedPost } from '../lib/blog'
import { mdxComponents } from '../mdx-components'

type PostMeta = Omit<BlogPostType, 'Component'>

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }): PostMeta => {
    const post = getPublishedPost(params.slug)
    if (!post) throw notFound()
    const { Component: _c, ...meta } = post
    return meta
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

      <div className="border-b border-blog-rule bg-[radial-gradient(circle_at_20%_0%,color-mix(in_oklab,var(--color-blog-accent)_18%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_14%,transparent),transparent_46%)] px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <Link
            to="/blog"
            className="font-mono inline-block text-[10px] uppercase tracking-widest text-blog-muted transition-colors hover:text-blog-accent focus-visible:outline-2! focus-visible:outline-blog-accent! focus-visible:outline-offset-2!"
          >
            ← WRITING
          </Link>
          <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-start">
            <div className="min-w-0">
              <h1 className="text-balance font-heading max-w-4xl text-[clamp(2.4rem,5.6vw,4.75rem)] font-extrabold uppercase leading-[0.94] tracking-[-0.04em] text-blog-text wrap-anywhere">
                {meta.title}
              </h1>
              <p className="mt-5 max-w-2xl font-reading text-base leading-7 text-blog-description sm:text-lg sm:leading-8">
                {meta.description}
              </p>
            </div>
            <div className="border-l border-blog-rule pl-4 lg:text-right">
              <p className="font-mono mb-2 text-[9px] uppercase tracking-widest text-blog-faint">
                Published
              </p>
              <time
                dateTime={meta.publishedAt}
                className="font-mono text-[10px] uppercase tracking-widest text-blog-muted"
              >
                {meta.publishedAt}
              </time>
              {(meta.tags ?? []).length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2 lg:justify-end">
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
        </div>
      </div>

      <div className="flex-1 px-6 py-12 sm:py-16">
        <article className="prose mx-auto max-w-2xl font-reading prose-headings:mt-12 prose-headings:text-balance prose-headings:font-heading prose-headings:text-blog-text prose-p:text-[1.05rem] prose-p:leading-8 prose-p:text-blog-description prose-a:text-blog-accent prose-strong:text-blog-text prose-li:text-[1.05rem] prose-li:leading-8 prose-li:text-blog-description prose-th:text-blog-text prose-td:text-blog-description prose-code:bg-blog-panel prose-code:px-1 prose-code:py-0.5 prose-code:font-mono prose-code:text-blog-text prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-blog-accent prose-blockquote:text-blog-description prose-hr:border-blog-rule prose-img:border prose-img:border-blog-rule prose-img:bg-blog-panel prose-img:shadow-[0_0_0_1px_color-mix(in_oklab,var(--color-blog-accent)_12%,transparent)] lg:prose-img:-mx-16 lg:prose-img:w-[calc(100%+8rem)] lg:prose-img:max-w-none prose-pre:border prose-pre:border-blog-rule prose-pre:bg-blog-panel!">
          <Component components={mdxComponents} />
        </article>
      </div>

      <footer className="grid grid-cols-[1fr_auto] border-t border-blog-rule">
        <div className="border-r border-blog-rule px-6 py-5">
          <p className="font-mono text-[9px] uppercase tracking-widest text-blog-faint">NDO.DEV</p>
        </div>
        <div className="flex items-center gap-5 px-6 py-5">
          {(
            [
              ['GH', 'https://github.com/ndom91'],
              ['BS', 'https://bsky.app/ndom91'],
              ['ML', 'mailto:home@ndo.dev'],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[10px] uppercase tracking-widest text-blog-muted transition-colors hover:text-blog-accent"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
