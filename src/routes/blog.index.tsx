import { createFileRoute, Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { SiteHeader } from '../components/SiteHeader'
import type { BlogPost } from '../lib/blog'
import { getPublishedPosts, longestWordEm } from '../lib/blog'

type PostData = Omit<BlogPost, 'Component'>

export const Route = createFileRoute('/blog/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostData => post),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()
  const [featuredPost, ...archivePosts] = posts

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text">
      <SiteHeader />

      <div className="border-b border-blog-rule bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--color-blog-accent)_22%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_48%)] px-6 py-12 sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="font-mono mb-3 text-[11px] uppercase tracking-widest text-blog-muted">
            ARCHIVE
          </p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <h1 className="text-balance font-heading min-w-0 text-[clamp(3rem,9vw,7.5rem)] font-extrabold uppercase leading-none tracking-[-0.04em] text-blog-text">
              WRITE
            </h1>
            <div className="border-l border-blog-rule pl-4 lg:pb-4">
              <p className="font-reading text-sm leading-6 text-blog-description">
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
                className="blog-paper-card group mb-5 grid overflow-hidden border border-blog-rule bg-blog-panel transition-[border-color,background-color,translate] duration-300 hover:-translate-y-0.5 hover:border-blog-accent hover:bg-blog-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
              >
                <div className="@container flex min-h-80 min-w-0 flex-col justify-between p-5 sm:p-7">
                  <div>
                    <p className="font-mono mb-5 text-[9px] uppercase tracking-widest text-blog-muted">
                      LATEST ENTRY
                    </p>
                    <h2
                      className="text-balance font-heading text-[min(clamp(1.7rem,3vw,3.25rem),calc(100cqi/var(--title-fit-em)))] font-extrabold uppercase leading-[0.9] tracking-[-0.08em] text-blog-accent wrap-break-word"
                      style={
                        { '--title-fit-em': longestWordEm(featuredPost.title) } as CSSProperties
                      }
                    >
                      {featuredPost.title}
                    </h2>
                    <p className="mt-5 max-w-2xl font-reading text-base leading-7 text-blog-description">
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
                      className="h-full min-h-72 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
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
                  className="blog-paper-card group flex h-full flex-col overflow-hidden border border-blog-rule bg-blog-panel transition-[border-color,background-color,translate] duration-300 hover:-translate-y-0.5 hover:border-blog-accent hover:bg-blog-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  {post.coverImageUrl ? (
                    <div className="overflow-hidden border-b border-blog-rule">
                      <img
                        src={post.coverImageUrl}
                        alt=""
                        className="aspect-[4/3] w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                        loading={index < 4 ? 'eager' : 'lazy'}
                        decoding="async"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col p-4">
                    <PostCardMeta post={post} />
                    <h2 className="mt-4 text-balance font-heading text-base font-medium leading-snug text-blog-accent">
                      {post.title}
                    </h2>
                    <p className="mt-3 font-reading text-sm leading-6 text-blog-description">
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
