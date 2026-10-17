import { Link } from '@tanstack/react-router'
import type { PostListItem } from '../lib/blog'
import { PostCardMeta } from './PostCardMeta'
import { PostCover, postCardShellClass } from './PostCover'

export function PostCard({ post, eager = false }: { post: PostListItem; eager?: boolean }) {
  return (
    <Link
      to="/blog/$slug"
      params={{ slug: post.slug }}
      className={`${postCardShellClass} flex h-full flex-col`}
    >
      <PostCover
        post={post}
        className="relative overflow-hidden border-b border-blog-rule"
        imageClassName="aspect-4/3 w-full object-cover transition-transform duration-400 ease-smooth-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        sizes="(min-width: 96rem) 25vw, (min-width: 80rem) 33vw, (min-width: 40rem) 50vw, 100vw"
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
      />
      <div className="flex flex-1 flex-col p-4">
        <PostCardMeta post={post} />
        <h2 className="mt-4 text-balance font-heading font-extrabold text-[2rem] tracking-[0.005em] leading-[0.9] text-blog-text transition-colors group-hover:text-blog-accent">
          {post.title}
        </h2>
        <p className="mt-3 mb-5 text-pretty font-reading text-sm leading-6 text-blog-description">
          {post.description}
        </p>
        <div className="font-mono mt-auto flex items-center justify-between border-t border-blog-rule pt-3 text-[10px] uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent">
          <span>{post.type === 'field-notes' ? 'Read note' : 'Read post'}</span>
          <span className="transition-transform duration-250 ease-smooth-out group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            →
          </span>
        </div>
      </div>
    </Link>
  )
}
