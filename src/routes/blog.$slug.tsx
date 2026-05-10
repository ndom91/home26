import { createFileRoute, notFound } from '@tanstack/react-router'
import { getPublishedPost } from '../lib/blog'

export const Route = createFileRoute('/blog/$slug')({
  loader: ({ params }) => {
    const post = getPublishedPost(params.slug)

    if (!post) {
      throw notFound()
    }

    return post
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} | Nick Nisi` },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: BlogPost,
})

function BlogPost() {
  const post = Route.useLoaderData()
  const { Component } = post

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <article>
        <time className="text-sm text-slate-500" dateTime={post.publishedAt}>
          {post.publishedAt}
        </time>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">{post.title}</h1>
        <p className="mt-4 text-xl text-slate-600">{post.description}</p>
        <div className="prose prose-slate mt-10 max-w-none">
          <Component />
        </div>
      </article>
    </main>
  )
}
