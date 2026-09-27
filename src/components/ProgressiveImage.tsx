import type { ImgHTMLAttributes } from 'react'
import { useEffect, useRef, useState } from 'react'

const placeholderOptions = 'width=32,quality=35,blur=20,format=auto'

function placeholderUrl(src: string) {
  if (!src.startsWith('/') || src.startsWith('/api/') || src.startsWith('/cdn-cgi/')) {
    return null
  }

  return `/cdn-cgi/image/${placeholderOptions}${src}`
}

export function ProgressiveImage({
  alt = '',
  className,
  onError,
  onLoad,
  src,
  ...props
}: ImgHTMLAttributes<HTMLImageElement>) {
  const imageRef = useRef<HTMLImageElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const placeholder = src ? placeholderUrl(src) : null

  useEffect(() => {
    const image = imageRef.current
    setIsLoaded(image?.getAttribute('src') === src && image?.complete === true)
  }, [src])

  if (!src || !placeholder) {
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
        src={placeholder}
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
