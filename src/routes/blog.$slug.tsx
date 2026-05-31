import { createFileRoute, Link, notFound } from '@tanstack/react-router'
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
    <div className="flex min-h-screen flex-col bg-[#0d0c0a] text-[#ede8df]">
      <nav
        className="grid border-b"
        style={{ gridTemplateColumns: 'auto 1fr auto', borderColor: '#242220' }}
      >
        <div className="border-r px-6 py-4" style={{ borderColor: '#242220' }}>
          <Link
            to="/"
            className="font-mono text-[11px] font-medium uppercase tracking-[0.25em] transition-colors hover:text-white"
          >
            NDOM91
          </Link>
        </div>
        <div className="flex items-center gap-7 px-7">
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-widest text-[#606060] transition-colors hover:text-[#ede8df]"
          >
            WRITING
          </Link>
          <a
            href="https://github.com/ndom91"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest text-[#606060] transition-colors hover:text-[#ede8df]"
          >
            GITHUB
          </a>
          <a
            href="mailto:home@ndo.dev"
            className="font-mono text-[10px] uppercase tracking-widest text-[#606060] transition-colors hover:text-[#ede8df]"
          >
            CONTACT
          </a>
        </div>
        <div
          className="flex items-center gap-2.5 border-l px-6 py-4"
          style={{ borderColor: '#242220' }}
        >
          <span className="block size-1.5 rounded-full bg-[#c8ff00]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#606060]">
            PLAIN.COM
          </span>
        </div>
      </nav>

      <div className="border-b px-6 py-10" style={{ borderColor: '#242220' }}>
        <Link
          to="/blog"
          className="font-mono mb-4 inline-block text-[9px] uppercase tracking-widest text-[#555] transition-colors hover:text-[#c8ff00]"
        >
          ← WRITING
        </Link>
        <div className="mt-4 flex items-start justify-between gap-8">
          <div className="min-w-0 flex-1">
            <h1
              className="font-heading uppercase leading-none tracking-[-0.03em] text-[#ede8df]"
              style={{ fontSize: 'clamp(2rem, 5vw, 4rem)', fontWeight: 800 }}
            >
              {meta.title}
            </h1>
            <p className="font-mono mt-3 max-w-prose text-sm leading-relaxed text-[#555]">
              {meta.description}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <time
              dateTime={meta.publishedAt}
              className="font-mono text-[10px] uppercase tracking-widest text-[#555]"
            >
              {meta.publishedAt}
            </time>
            {(meta.tags ?? []).length > 0 && (
              <div className="mt-2 flex justify-end gap-2">
                {(meta.tags ?? []).map((tag) => (
                  <span
                    key={tag}
                    className="font-mono px-2 py-0.5 text-[9px] uppercase tracking-widest text-[#555]"
                    style={{ border: '1px solid #242220' }}
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
        <article className="prose prose-invert mx-auto max-w-2xl">
          <Component />
        </article>
      </div>

      <footer
        className="grid border-t"
        style={{ gridTemplateColumns: '1fr auto', borderColor: '#242220' }}
      >
        <div className="border-r px-6 py-5" style={{ borderColor: '#242220' }}>
          <p className="font-mono text-[9px] uppercase tracking-widest text-[#333]">
            NDOM91 · YO@NDO.DEV · NDO.DEV
          </p>
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
              className="font-mono text-[10px] uppercase tracking-widest text-[#555] transition-colors hover:text-[#c8ff00]"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
