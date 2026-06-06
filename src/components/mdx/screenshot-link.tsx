import { type ReactNode, useEffect, useState } from 'react'
import { useLinkScreenshotUrl } from './link-screenshot-context'

const previewImageCache = new Map<string, Promise<string>>()
const PREVIEW_LOAD_INTERVAL_MS = 1500
let lastPreviewLoadStartedAt = 0
let previewLoadQueue: Promise<unknown> = Promise.resolve()

function getScreenshotImage(image?: string): string | undefined {
  if (image?.startsWith('/') || image?.startsWith('http') || image?.startsWith('data:')) {
    return image
  }
}

function loadQueuedPreviewImage(imageSrc: string) {
  const cachedPreview = previewImageCache.get(imageSrc)

  if (cachedPreview) {
    return cachedPreview
  }

  const preview = previewLoadQueue
    .catch(() => {})
    .then(async () => {
      await waitForNextPreviewLoadSlot()

      return preloadPreviewImage(imageSrc)
    })

  previewLoadQueue = preview.catch(() => {})
  previewImageCache.set(imageSrc, preview)
  preview.catch(() => previewImageCache.delete(imageSrc))

  return preview
}

function preloadPreviewImage(imageSrc: string) {
  return new Promise<string>((resolve, reject) => {
    const previewImage = new Image()

    previewImage.decoding = 'async'
    previewImage.onload = () => resolve(imageSrc)
    previewImage.onerror = () => reject(new Error('Unable to load link preview'))
    previewImage.src = imageSrc
  })
}

async function waitForNextPreviewLoadSlot() {
  const now = Date.now()
  const delay = Math.max(0, lastPreviewLoadStartedAt + PREVIEW_LOAD_INTERVAL_MS - now)

  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay))
  }

  lastPreviewLoadStartedAt = Date.now()
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
  const signedScreenshotUrl = useLinkScreenshotUrl(url)
  const screenshotImage = getScreenshotImage(image)
  const imageSrc = screenshotImage ?? signedScreenshotUrl
  const shouldQueuePreview = !screenshotImage && !!signedScreenshotUrl
  const [shouldLoadPreview, setShouldLoadPreview] = useState(false)
  const [queuedPreviewSrc, setQueuedPreviewSrc] = useState<string>()
  const [previewFailed, setPreviewFailed] = useState(false)

  useEffect(() => {
    if (
      !imageSrc ||
      !shouldLoadPreview ||
      !shouldQueuePreview ||
      queuedPreviewSrc ||
      previewFailed
    ) {
      return
    }

    let isCurrent = true

    loadQueuedPreviewImage(imageSrc)
      .then((previewSrc) => {
        if (isCurrent) {
          setQueuedPreviewSrc(previewSrc)
        }
      })
      .catch(() => {
        if (isCurrent) {
          setPreviewFailed(true)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [imageSrc, previewFailed, queuedPreviewSrc, shouldLoadPreview, shouldQueuePreview])

  if (!imageSrc) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-dotted underline-offset-4"
      >
        {label}
      </a>
    )
  }

  function loadPreview() {
    setShouldLoadPreview(true)

    if (previewFailed) {
      setPreviewFailed(false)
    }
  }

  return (
    <span
      className="group/screenshot relative inline-block"
      onFocusCapture={loadPreview}
      onPointerEnter={loadPreview}
      onTouchStart={loadPreview}
    >
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-dotted underline-offset-4"
      >
        {label}
      </a>
      <span
        aria-hidden="true"
        className="not-prose pointer-events-none invisible absolute bottom-full left-1/2 z-30 mb-3 w-80 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 translate-y-1 scale-[0.98] overflow-hidden rounded-xl border border-blog-rule bg-blog-panel p-2 opacity-0 shadow-2xl shadow-black/35 transition-[opacity,transform,visibility] duration-200 ease-out before:absolute before:-bottom-3 before:left-0 before:h-3 before:w-full before:content-[''] group-hover/screenshot:visible group-hover/screenshot:translate-y-0 group-hover/screenshot:scale-100 group-hover/screenshot:opacity-100 group-focus-within/screenshot:visible group-focus-within/screenshot:translate-y-0 group-focus-within/screenshot:scale-100 group-focus-within/screenshot:opacity-100 motion-reduce:transition-none"
      >
        {previewFailed ? (
          <span className="flex aspect-video w-full items-center justify-center rounded-lg border border-blog-rule bg-blog-bg px-4 text-center font-mono text-[10px] uppercase tracking-widest text-blog-muted">
            Preview unavailable
          </span>
        ) : shouldLoadPreview && (!shouldQueuePreview || queuedPreviewSrc) ? (
          <img
            src={queuedPreviewSrc ?? imageSrc}
            alt=""
            loading="eager"
            decoding="async"
            onError={() => setPreviewFailed(true)}
            className="m-0! block aspect-video w-full! max-w-full! rounded-lg border border-blog-rule object-cover object-center"
          />
        ) : (
          <span className="block aspect-video w-full rounded-lg border border-blog-rule bg-blog-bg" />
        )}
        <span className="mt-2 block truncate px-1 font-mono text-[10px] uppercase tracking-widest text-blog-muted">
          {url.replace(/^https?:\/\//, '')}
        </span>
      </span>
    </span>
  )
}
