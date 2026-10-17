import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { longestWordEm, type PostListItem } from '../lib/blog'
import { PostCardMeta } from './PostCardMeta'
import { PostCover, postCardShellClass } from './PostCover'

export function FeaturedPostCard({ post }: { post: PostListItem }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${postCardShellClass} mb-5 grid lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]`}
    >
      <div className="@container flex min-h-80 min-w-0 flex-col justify-between p-5 sm:p-7">
        <div>
          <p className="font-mono mb-5 text-[9px] uppercase tracking-widest text-blog-muted">
            LATEST ENTRY
          </p>
          <h2
            className="text-balance font-heading text-[min(3.7rem,calc(100cqi/var(--title-fit-em)))] font-extrabold uppercase leading-[0.9] text-blog-text transition-colors group-hover:text-blog-accent wrap-break-word"
            style={{ '--title-fit-em': longestWordEm(post.title) } as CSSProperties}
          >
            {post.title}
          </h2>
          <p className="mt-5 max-w-2xl text-pretty font-reading text-base leading-7 text-blog-description">
            {post.description}
          </p>
        </div>
        <PostCardMeta post={post} className="mt-8" />
      </div>
      <PostCover
        post={post}
        className="relative mb-px flex flex-col overflow-hidden border-t border-blog-rule *:flex-1 lg:mt-px lg:border-l lg:border-t-0"
        imageClassName="image-outline h-full min-h-72 w-full scale-[1.01] object-cover transition-transform duration-400 ease-smooth-out group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        sizes="(min-width: 64rem) 50vw, 100vw"
        fetchPriority="high"
      />
    </Link>
  )
}
