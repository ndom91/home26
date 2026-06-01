import { createFileRoute, Link } from '@tanstack/react-router'
import { SiteHeader } from '../components/SiteHeader'
import type { BlogPost } from '../lib/blog'
import { getPublishedPosts } from '../lib/blog'

type PostData = Omit<BlogPost, 'Component'>

export const Route = createFileRoute('/blog/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostData => post),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text [--focus-ring-offset:var(--color-blog-bg)]">
      <SiteHeader />

      <div className="border-b border-blog-rule bg-[linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_18%,transparent),transparent_38%)] px-6 py-10">
        <p className="font-mono mb-3 text-[9px] uppercase tracking-widest text-blog-muted">
          ARCHIVE
        </p>
        <h1 className="font-heading text-[clamp(3rem,10vw,8rem)] font-extrabold uppercase leading-none tracking-[-0.03em] text-blog-text">
          WRITING
        </h1>
        <p className="font-mono mt-3 text-xs text-blog-muted">
          {posts.length} {posts.length === 1 ? 'ENTRY' : 'ENTRIES'}
        </p>
      </div>

      <div className="flex-1">
        {posts.length === 0 ? (
          <div className="px-6 py-10">
            <p className="font-mono text-xs text-blog-empty">{'// no posts published yet'}</p>
          </div>
        ) : (
          <div className="divide-y divide-blog-rule">
            {posts.map((post) => (
              <Link
                key={post.slug}
                to="/blog/$slug"
                params={{ slug: post.slug }}
                className="group flex items-start justify-between gap-6 px-6 py-5 transition-colors hover:bg-blog-hover"
              >
                <div className="min-w-0 flex-1">
                  <h2 className="font-mono text-sm font-medium leading-snug text-blog-text transition-colors group-hover:text-blog-accent">
                    {post.title}
                  </h2>
                  <p className="font-mono mt-1 line-clamp-1 text-xs leading-relaxed text-blog-description">
                    {post.description}
                  </p>
                </div>
                <div className="mt-0.5 flex shrink-0 items-center gap-3">
                  {(post.tags ?? []).slice(0, 1).map((tag) => (
                    <span
                      key={tag}
                      className="font-mono border border-blog-rule bg-blog-panel px-2 py-0.5 text-[9px] uppercase tracking-widest text-blog-muted transition-colors group-hover:border-blog-accent group-hover:text-blog-tag-hover"
                    >
                      {tag}
                    </span>
                  ))}
                  <time
                    dateTime={post.publishedAt}
                    className="font-mono whitespace-nowrap text-[10px] text-blog-muted transition-colors group-hover:text-blog-accent"
                  >
                    {post.publishedAt}
                  </time>
                  <span className="font-mono text-xs text-blog-arrow transition-colors group-hover:text-blog-accent">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
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
