import { createFileRoute } from '@tanstack/react-router'
import { FeaturedPostCard } from '../components/FeaturedPostCard'
import { PageHero } from '../components/PageHero'
import { PostCard } from '../components/PostCard'
import { SiteFooter } from '../components/SiteFooter'
import { SiteHeader } from '../components/SiteHeader'
import type { PostListItem } from '../lib/blog'
import { getPublishedPosts } from '../lib/blog'
import {
  blogId,
  blogWebPageId,
  contentLicense,
  isoDateToUtcDateTime,
  personId,
  siteLanguage,
  websiteId,
} from '../lib/structured-data'

export const Route = createFileRoute('/blog/')({
  loader: () => getPublishedPosts().map(({ Component: _c, ...post }): PostListItem => post),
  head: ({ loaderData }) => {
    const latestPost = loaderData?.[0]

    return {
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            '@id': blogId,
            isPartOf: {
              '@id': websiteId,
            },
            mainEntityOfPage: {
              '@id': blogWebPageId,
            },
            name: "Nico's Blog",
            description:
              'Field notes, server rituals, UI experiments, and open-source side projects.',
            inLanguage: siteLanguage,
            dateModified: latestPost ? isoDateToUtcDateTime(latestPost.publishedAt) : undefined,
            publisher: {
              '@id': personId,
            },
            license: contentLicense,
          }),
        },
      ],
    }
  },
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()
  const [featuredPost, ...archivePosts] = posts

  return (
    <div className="flex min-h-screen flex-col bg-blog-bg text-blog-text">
      <SiteHeader />

      <PageHero
        title="WRITE"
        description="Field notes, server rituals, UI experiments, and the occasional strongly held opinion."
        eyebrow={
          <p className="font-mono sm:mt-4 sm:mb-6 text-[11px] uppercase tracking-widest text-blog-muted">
            ARCHIVE
          </p>
        }
        meta={`${posts.length} ${posts.length === 1 ? 'entry' : 'entries'} indexed`}
      />

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
