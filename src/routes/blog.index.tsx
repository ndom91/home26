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
  const [featuredPost, ...archivePosts] = posts

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text [--focus-ring-offset:var(--color-blog-bg)]">
      <SiteHeader />

      <div className="border-b border-blog-rule bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--color-blog-accent)_22%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_48%)] px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono mb-3 text-[9px] uppercase tracking-widest text-blog-muted">
            ARCHIVE
          </p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <h1 className="font-heading min-w-0 text-[clamp(3rem,9vw,7.5rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-blog-text">
              WRITING
            </h1>
            <div className="border-l border-blog-rule pl-4 lg:pb-4">
              <p className="font-mono text-xs leading-relaxed text-blog-description">
                Field notes, server rituals, UI experiments, and the occasional strongly held
                opinion.
              </p>
              <p className="font-mono mt-4 text-[10px] uppercase tracking-widest text-blog-muted">
                {posts.length} {posts.length === 1 ? 'entry' : 'entries'} indexed
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 sm:py-10">
        {posts.length === 0 ? (
          <div className="mx-auto max-w-7xl py-10">
            <p className="font-mono text-xs text-blog-empty">{'// no posts published yet'}</p>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl">
            {featuredPost ? (
              <Link
                key={featuredPost.slug}
                to="/blog/$slug"
                params={{ slug: featuredPost.slug }}
                className="group mb-5 grid overflow-hidden border border-blog-rule bg-blog-panel transition-colors hover:border-blog-accent hover:bg-blog-hover lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
              >
                <div className="flex min-h-80 flex-col justify-between p-5 sm:p-7">
                  <div>
                    <p className="font-mono mb-5 text-[9px] uppercase tracking-widest text-blog-muted">
                      LATEST ENTRY
                    </p>
                    <h2 className="font-heading text-[clamp(2.3rem,6vw,5.8rem)] font-extrabold uppercase leading-[0.9] tracking-[-0.04em] text-blog-text transition-colors group-hover:text-blog-accent">
                      {featuredPost.title}
                    </h2>
                    <p className="font-mono mt-5 max-w-2xl text-sm leading-relaxed text-blog-description">
                      {featuredPost.description}
                    </p>
                  </div>
                  <PostCardMeta post={featuredPost} className="mt-8" />
                </div>
                {featuredPost.coverImageUrl ? (
                  <div className="overflow-hidden border-t border-blog-rule lg:border-l lg:border-t-0">
                    <img
                      src={featuredPost.coverImageUrl}
                      alt=""
                      className="h-full min-h-72 w-full object-cover opacity-85 saturate-[0.8] transition duration-500 group-hover:scale-[1.03] group-hover:opacity-100 group-hover:saturate-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                      fetchPriority="high"
                    />
                  </div>
                ) : null}
              </Link>
            ) : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {archivePosts.map((post, index) => (
                <Link
                  key={post.slug}
                  to="/blog/$slug"
                  params={{ slug: post.slug }}
                  className="group flex h-full flex-col overflow-hidden border border-blog-rule bg-blog-panel transition-colors hover:border-blog-accent hover:bg-blog-hover"
                >
                  {post.coverImageUrl ? (
                    <div className="overflow-hidden border-b border-blog-rule">
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="aspect-[4/3] w-full object-cover opacity-80 saturate-[0.75] transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100 group-hover:saturate-100 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-4">
                    <PostCardMeta post={post} />
                    <h2 className="font-mono mt-4 text-base font-medium leading-snug text-blog-text transition-colors group-hover:text-blog-accent">
                      {post.title}
                    </h2>
                    <p className="font-mono mt-3 text-xs leading-relaxed text-blog-description">
                      {post.description}
                    </p>
                    <div className="font-mono mt-auto flex items-center justify-between border-t border-blog-rule pt-3 text-[10px] uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent">
                      <span>Read note</span>
                      <span className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
                        →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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

function PostCardMeta({ post, className }: { post: PostData; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <time
        dateTime={post.publishedAt}
        className="font-mono text-[10px] uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent"
      >
        {post.publishedAt}
      </time>
      {(post.tags ?? []).slice(0, 2).map((tag) => (
        <span
          key={tag}
          className="font-mono border border-blog-rule bg-blog-bg px-2 py-0.5 text-[9px] uppercase tracking-widest text-blog-muted transition-colors group-hover:border-blog-accent group-hover:text-blog-tag-hover"
        >
          {tag}
        </span>
      ))}
    </div>
  )
}
