import type { ImgHTMLAttributes } from 'react'
import type { PostListItem } from '../lib/blog'
import { FieldNoteBadge } from './FieldNoteBadge'
import { ProgressiveImage } from './ProgressiveImage'

// Shared shell for post list cards (PostCard, FeaturedPostCard).
export const postCardShellClass =
  'group overflow-hidden border border-blog-rule bg-blog-panel transition-[border-color,background-color,translate,scale] duration-250 ease-smooth-out hover:-translate-y-0.5 hover:border-blog-accent hover:bg-blog-hover active:scale-[0.96] motion-reduce:transition-none motion-reduce:hover:translate-y-0'

type PostCoverProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> & {
  post: PostListItem
  imageClassName: string
}

/** Cover image plus the field-notes badge, or nothing when the post has no cover. */
export function PostCover({ post, className, imageClassName, ...imageProps }: PostCoverProps) {
  if (!post.coverImageUrl) return null

  return (
    <div className={className}>
      <ProgressiveImage
        src={post.coverImageUrl}
        srcSet={post.coverImageSrcSet ?? undefined}
        placeholderSrc={post.coverImageLqip}
        alt=""
        className={imageClassName}
        {...imageProps}
      />
      {post.type === 'field-notes' ? <FieldNoteBadge /> : null}
    </div>
  )
}
