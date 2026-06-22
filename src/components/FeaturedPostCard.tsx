import { Link } from '@tanstack/react-router'
import type { CSSProperties } from 'react'
import { longestWordEm, type PostListItem } from '../lib/blog'
import { FieldNoteBadge } from './FieldNoteBadge'
import { PostCardMeta } from './PostCardMeta'

export function FeaturedPostCard({ post }: { post: PostListItem }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="blog-paper-card group mb-5 grid overflow-hidden border border-blog-rule bg-blog-panel transition-[border-color,background-color,translate,scale] duration-300 hover:-translate-y-0.5 hover:border-blog-accent hover:bg-blog-hover active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,0.85fr)]"
    >
      <div className="@container flex min-h-80 min-w-0 flex-col justify-between p-5 sm:p-7">
        <div>
          <p className="font-mono mb-5 text-[9px] uppercase tracking-widest text-blog-muted">
            LATEST ENTRY
          </p>
          <h2
            className="text-balance font-heading text-[min(clamp(3.7rem,3vw,3.25rem),calc(100cqi/var(--title-fit-em)))] font-extrabold uppercase leading-[0.9] text-blog-text transition-colors group-hover:text-blog-accent wrap-break-word"
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
      {post.coverImageUrl ? (
        <div className="relative overflow-hidden border-t border-blog-rule lg:border-l lg:border-t-0">
          <img
            src={post.coverImageUrl}
            alt=""
            className="image-outline h-full min-h-72 w-full scale-[1.01] object-cover transition-transform duration-500 group-hover:scale-[1.05] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            fetchPriority="high"
          />
          {post.type === 'field-notes' ? <FieldNoteBadge /> : null}
        </div>
      ) : null}
    </Link>
  )
}
