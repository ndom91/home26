import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { SiteHeader } from '../components/SiteHeader'
import type { BlogPost as BlogPostType } from '../lib/blog'
import { getPublishedPost } from '../lib/blog'

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
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text [--focus-ring-offset:var(--color-blog-bg)]">
      <SiteHeader />

      <div className="border-b border-blog-rule bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_18%,transparent),transparent_42%)] px-6 py-10">
        <Link
          to="/blog"
          className="font-mono mb-4 inline-block text-[9px] uppercase tracking-widest text-blog-muted transition-colors hover:text-blog-accent"
        >
          ← WRITING
        </Link>
        <div className="mt-4 flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1 className="font-heading text-[clamp(2rem,5vw,4rem)] font-extrabold uppercase leading-none tracking-[-0.03em] text-blog-text">
              {meta.title}
            </h1>
            <p className="font-mono mt-3 max-w-prose text-sm leading-relaxed text-blog-muted">
              {meta.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <time
              dateTime={meta.publishedAt}
              className="font-mono text-[10px] uppercase tracking-widest text-blog-muted"
            >
              {meta.publishedAt}
            </time>
            {(meta.tags ?? []).length > 0 && (
              <div className="mt-2 flex justify-end gap-2">
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

      <div className="flex-1 px-6 py-12">
        <article className="prose mx-auto max-w-2xl prose-headings:font-heading prose-headings:text-blog-text prose-p:text-blog-description prose-a:text-blog-accent prose-strong:text-blog-text prose-li:text-blog-description prose-th:text-blog-text prose-td:text-blog-description prose-code:bg-blog-panel prose-code:px-1 prose-code:py-0.5 prose-code:text-blog-text prose-code:before:content-none prose-code:after:content-none prose-blockquote:border-blog-accent prose-blockquote:text-blog-description prose-hr:border-blog-rule prose-pre:border prose-pre:border-blog-rule prose-pre:!bg-blog-panel">
          <Component />
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
              ['X', 'https://bsky.app/ndom91'],
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
