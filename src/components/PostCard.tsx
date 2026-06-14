import { Link } from '@tanstack/react-router'
import type { PostListItem } from '../lib/blog'
import { PostCardMeta } from './PostCardMeta'

export function PostCard({ post, eager = false }: { post: PostListItem; eager?: boolean }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className="blog-paper-card group flex h-full flex-col overflow-hidden border border-blog-rule bg-blog-panel transition-[border-color,background-color,translate] duration-300 hover:-translate-y-0.5 hover:border-blog-accent hover:bg-blog-hover motion-reduce:transition-none motion-reduce:hover:translate-y-0"
    >
      {post.coverImageUrl ? (
        <div className="overflow-hidden border-b border-blog-rule">
          <img
            src={post.coverImageUrl}
            alt=""
            className="aspect-4/3 w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
          />
        </div>
      ) : null}
      <div className="flex flex-1 flex-col p-4">
        <PostCardMeta post={post} />
        <h2 className="mt-4 text-pretty font-heading font-light text-[2rem] leading-[0.9] text-blog-accent">
          {post.title}
        </h2>
        <p className="mt-3 mb-5 font-reading text-sm leading-6 text-blog-description">
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
  )
}
