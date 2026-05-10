import { createFileRoute, Link } from '@tanstack/react-router'
import { getPublishedPosts } from '../lib/blog'

export const Route = createFileRoute('/blog')({
  loader: () => getPublishedPosts(),
  component: BlogIndex,
})

function BlogIndex() {
  const posts = Route.useLoaderData()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-4xl font-bold tracking-tight">Writing</h1>
      <div className="mt-10 space-y-8">
        {posts.map((post) => (
          <article key={post.slug}>
            <time className="text-sm text-slate-500" dateTime={post.publishedAt}>
              {post.publishedAt}
            </time>
            <h2 className="mt-2 text-2xl font-semibold">
              <Link className="hover:underline" to="/blog/$slug" params={{ slug: post.slug }}>
                {post.title}
              </Link>
            </h2>
            <p className="mt-2 text-slate-600">{post.description}</p>
          </article>
        ))}
      </div>
    </main>
  )
}
