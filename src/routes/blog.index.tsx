import { createFileRoute } from '@tanstack/react-router'
import { FeaturedPostCard } from '../components/FeaturedPostCard'
import { PostCard } from '../components/PostCard'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import type { PostListItem } from '../lib/blog'
import { getPublishedPosts } from '../lib/blog'

export const Route = createFileRoute('/blog/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostListItem => post),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()
  const [featuredPost, ...archivePosts] = posts

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text">
      <SiteHeader />

      <div className="relative isolate overflow-hidden border-b border-blog-rule bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--color-blog-accent)_22%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_48%)] px-6 py-12 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-(image:--grit-image) bg-size-[220px_220px] bg-repeat opacity-[0.5] dark:opacity-[0.20] mix-blend-overlay"
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-7xl">
          <p className="font-mono sm:mt-4 sm:mb-6 text-[11px] uppercase tracking-widest text-blog-muted">
            ARCHIVE
          </p>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <h1 className="text-balance font-heading min-w-0 text-[clamp(7rem,15vw,13rem)] font-extrabold uppercase leading-35 tracking-[-0.375px] text-blog-text">
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
            {featuredPost ? <FeaturedPostCard post={featuredPost} /> : null}

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {archivePosts.map((post, index) => (
                <PostCard key={post.slug} post={post} eager={index < 4} />
              ))}
            </div>
          </div>
        )}
      </div>

      <SiteFooter variant="blog" />
    </div>
  )
}
