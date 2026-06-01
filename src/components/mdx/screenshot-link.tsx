import type { ReactNode } from 'react'

function getScreenshotImage(url: string, image?: string): string {
  if (image?.startsWith('/') || image?.startsWith('http') || image?.startsWith('data:')) {
    return image
  }

  const screenshotUrl = new URL('https://api.microlink.io/')
  screenshotUrl.searchParams.set('url', url)
  screenshotUrl.searchParams.set('screenshot', 'true')
  screenshotUrl.searchParams.set('meta', 'false')
  screenshotUrl.searchParams.set('embed', 'screenshot.url')

  return screenshotUrl.toString()
}

export function ScreenshotLink({
  children,
  text,
  url,
  image,
}: {
  children?: ReactNode
  text?: string
  url: string
  image?: string
}) {
  const label = children ?? text ?? url

  const imageSrc = getScreenshotImage(url, image)

  return (
    <span className="group/screenshot relative inline-block">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="decoration-dotted underline-offset-4"
      >
        {label}
      </a>
      <span
        aria-hidden="true"
        className="not-prose pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-3 w-80 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 translate-y-1 scale-[0.98] overflow-hidden rounded-xl border border-blog-rule bg-blog-panel p-2 opacity-0 shadow-2xl shadow-black/35 transition-[opacity,transform,visibility] duration-200 ease-out before:absolute before:-bottom-3 before:left-0 before:h-3 before:w-full before:content-[''] group-hover/screenshot:visible group-hover/screenshot:translate-y-0 group-hover/screenshot:scale-100 group-hover/screenshot:opacity-100 group-focus-within/screenshot:visible group-focus-within/screenshot:translate-y-0 group-focus-within/screenshot:scale-100 group-focus-within/screenshot:opacity-100 motion-reduce:transition-none"
      >
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          className="m-0! block aspect-video w-full! max-w-full! rounded-lg border border-blog-rule object-cover object-center"
        />
        <span className="mt-2 block truncate px-1 font-mono text-[10px] uppercase tracking-widest text-blog-muted">
          {url.replace(/^https?:\/\//, '')}
        </span>
      </span>
    </span>
  )
}
