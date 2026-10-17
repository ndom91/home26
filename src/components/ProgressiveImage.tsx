import type { ImgHTMLAttributes } from 'react'

type ProgressiveImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  placeholderSrc?: string | null
}

/** Image layered over its blurred LQIP; CSS-only, so it renders without JS. */
export function ProgressiveImage({
  alt = '',
  className,
  placeholderSrc,
  ...props
}: ProgressiveImageProps) {
  if (!props.src || !placeholderSrc) {
    return <img alt={alt} className={className} {...props} />
  }

  return (
    <span className="progressive-image">
      <img alt={alt} className={`progressive-image__image ${className ?? ''}`} {...props} />
      <img
        src={placeholderSrc}
        alt=""
        aria-hidden="true"
        loading={props.loading}
        decoding="async"
        fetchPriority="low"
        className="progressive-image__placeholder"
      />
    </span>
  )
}
