import { type PostListItem, readTimeLabel } from '../lib/blog'

export function PostCardMeta({
  post,
  showTags = true,
}: {
  post: PostListItem
  showTags?: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <time
        dateTime={post.publishedAt}
        className="font-mono text-[10px] tabular-nums uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent"
      >
        {post.publishedAt}
      </time>
      {showTags && <PostCardTags post={post} />}
      <span className="font-mono ml-auto whitespace-nowrap text-[10px] tabular-nums uppercase tracking-widest text-blog-muted transition-colors group-hover:text-blog-accent">
        {readTimeLabel(post.readTimeSeconds)}
      </span>
    </div>
  )
}

export function PostCardTags({ post }: { post: PostListItem }) {
  return post.tags.slice(0, 2).map((tag) => (
    <span
      key={tag}
      className="font-mono border border-blog-rule bg-blog-bg px-2 py-0.5 text-[9px] uppercase tracking-widest text-blog-muted transition-colors group-hover:border-blog-accent group-hover:text-blog-tag-hover"
    >
      {tag}
    </span>
  ))
}
