import type { ImgHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'

type ProgressiveImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  placeholderSrc?: string | null
}

export function ProgressiveImage({
  alt = '',
  className,
  onError,
  onLoad,
  placeholderSrc,
  src,
  ...props
}: ProgressiveImageProps) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    const image = imageRef.current
    setIsLoaded(image?.getAttribute('src') === src && image?.complete === true)
  }, [src])

  if (!src || !placeholderSrc) {
    return (
      <img src={src} alt={alt} className={className} onError={onError} onLoad={onLoad} {...props} />
    )
  }

  return (
    <span className="progressive-image">
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`progressive-image__image${isLoaded ? ' progressive-image__image--loaded' : ''} ${className ?? ''}`}
        onError={(event) => {
          setIsLoaded(true)
          onError?.(event)
        }}
        onLoad={(event) => {
          setIsLoaded(true)
          onLoad?.(event)
        }}
        {...props}
      />
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
