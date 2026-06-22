import type { PostListItem } from '../lib/blog'

export function PostCardMeta({ post, className }: { post: PostListItem; className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ''}`}>
      <time
        dateTime={post.publishedAt}
        className="font-mono text-[10px] tabular-nums uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent"
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
