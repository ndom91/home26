import { type MouseEvent, type RefObject, useEffect, useRef, useState } from 'react'
import type { PostHeading } from '../lib/post-headings'

// A shared offset keeps the active section and anchor landing position aligned.
const ACTIVE_OFFSET_PX = 140
const MARKER_GAP_PX = 12
const MARKER_SIZE_PX = 5
const ARC_STEPS = 16

export function TableOfContents({
  headings,
  containerRef,
  className,
  readTime,
  mobile = false,
}: {
  /** Extracted at build time (src/lib/post-headings.ts), so the TOC prerenders. */
  headings: PostHeading[]
  containerRef: RefObject<HTMLElement | null>
  className?: string
  readTime: string
  mobile?: boolean
}) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const markerRef = useRef<HTMLSpanElement>(null)
  const headingRefs = useRef(new Map<string, HTMLLIElement>())
  const markerPosition = useRef<{ x: number; y: number } | null>(null)
  const markerAnimation = useRef<Animation | null>(null)

  // Track which heading the reader is currently under as they scroll.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const visible = window.matchMedia(mobile ? '(width < 1100px)' : '(min-width: 1100px)')
    const observer = new ResizeObserver(() => {
      if (visible.matches) onScroll()
    })
    let frame = 0

    const updateActive = () => {
      frame = 0
      const nodes = headings
        .map((heading) => document.getElementById(heading.id))
        .filter((node): node is HTMLElement => node !== null)

      const article = container.getBoundingClientRect()
      const distance = article.height - window.innerHeight + ACTIVE_OFFSET_PX
      let fraction = 0
      if (article.top <= ACTIVE_OFFSET_PX) {
        fraction =
          distance <= 0 ? 1 : Math.max(0, Math.min(1, (ACTIVE_OFFSET_PX - article.top) / distance))
      }
      setProgress(Math.round(fraction * 100))

      if (nodes.length === 0) return
      const articleComplete = article.bottom <= window.innerHeight

      // Treat the final heading as current once the article has been fully read.
      if (articleComplete) {
        setActiveId(nodes[nodes.length - 1].id)
        return
      }

      // Otherwise the current section is the last heading above the offset line.
      let current = nodes[0].id
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= ACTIVE_OFFSET_PX + 1) {
          current = node.id
        } else {
          break
        }
      }
      setActiveId(current)
    }

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(updateActive)
    }

    const stop = () => {
      if (frame) window.cancelAnimationFrame(frame)
      frame = 0
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      observer.disconnect()
    }
    const sync = () => {
      stop()
      if (!visible.matches) return
      updateActive()
      observer.observe(container)
      window.addEventListener('scroll', onScroll, { passive: true })
      window.addEventListener('resize', onScroll, { passive: true })
    }

    sync()
    visible.addEventListener('change', sync)

    return () => {
      stop()
      visible.removeEventListener('change', sync)
    }
  }, [headings, containerRef, mobile])

  // Sweep the marker along a short arc rather than teleporting it between sections.
  useEffect(() => {
    if (!activeId) return

    const marker = markerRef.current
    const heading = headingRefs.current.get(activeId)
    const list = marker?.parentElement
    if (!marker || !heading || !list) return

    const link = heading.querySelector<HTMLAnchorElement>('a')
    const scroller = scrollerRef.current
    if (!link || !scroller) return

    const positionMarker = () => {
      if (heading.getClientRects().length === 0 || heading.offsetHeight === 0) return
      const headingRect = heading.getBoundingClientRect()
      const bounds = scroller.getBoundingClientRect()
      if (headingRect.top < bounds.top) scroller.scrollTop -= bounds.top - headingRect.top
      else if (headingRect.bottom > bounds.bottom)
        scroller.scrollTop += headingRect.bottom - bounds.bottom

      // Both rects are read after scrolling; the marker is in list coordinates.
      const listRect = list.getBoundingClientRect()
      const itemRect = heading.getBoundingClientRect()
      const linkStyle = getComputedStyle(link)
      const lineHeight = Number.parseFloat(linkStyle.lineHeight)
      const markerY =
        itemRect.top -
        listRect.top +
        (Number.isNaN(lineHeight)
          ? (itemRect.height - MARKER_SIZE_PX) / 2
          : Number.parseFloat(linkStyle.paddingBlockStart) + (lineHeight - MARKER_SIZE_PX) / 2)
      const nextPosition = {
        x:
          link.getBoundingClientRect().left -
          listRect.left +
          Number.parseFloat(linkStyle.paddingInlineStart) -
          MARKER_GAP_PX,
        y: markerY,
      }

      if (!markerPosition.current) {
        marker.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`
        markerPosition.current = nextPosition
        return
      }

      let currentPosition = markerPosition.current
      if (markerAnimation.current) {
        const transform = getComputedStyle(marker).transform
        if (transform !== 'none') {
          const matrix = new DOMMatrixReadOnly(transform)
          currentPosition = { x: matrix.m41, y: matrix.m42 }
        }
        markerAnimation.current.cancel()
      }

      const distance = nextPosition.y - currentPosition.y
      const horizontalDistance = nextPosition.x - currentPosition.x
      markerPosition.current = nextPosition
      marker.style.transform = `translate3d(${nextPosition.x}px, ${nextPosition.y}px, 0)`

      if (
        (distance === 0 && horizontalDistance === 0) ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ) {
        return
      }

      // A quadratic curve bulges half as far as its control point, so this
      // swings the dot up to ~44px left of the list on long jumps.
      const arcOffset = Math.min(88, 12 + Math.abs(distance) * 0.3)
      const controlX = Math.min(currentPosition.x, nextPosition.x) - arcOffset
      markerAnimation.current = marker.animate(
        // Enough keyframes that the wide arc reads as a curve, not a polyline.
        Array.from({ length: ARC_STEPS + 1 }, (_, index) => {
          const progress = index / ARC_STEPS
          const remaining = 1 - progress
          const x =
            remaining ** 2 * currentPosition.x +
            2 * remaining * progress * controlX +
            progress ** 2 * nextPosition.x
          const y =
            remaining ** 2 * currentPosition.y +
            2 * remaining * progress * (currentPosition.y + distance / 2) +
            progress ** 2 * nextPosition.y

          return {
            offset: progress,
            transform: `translate3d(${x}px, ${y}px, 0)`,
          }
        }),
        {
          duration: 250,
          easing: 'ease-out',
          fill: 'both',
        }
      )
    }

    positionMarker()
    const observer = new ResizeObserver(positionMarker)
    observer.observe(list)
    observer.observe(scroller)
    return () => observer.disconnect()
  }, [activeId])

  useEffect(() => {
    return () => markerAnimation.current?.cancel()
  }, [])

  const navigateToHeading = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey)
      return
    const target = document.getElementById(id)
    if (!target) return
    event.preventDefault()
    window.history.pushState(null, '', `#${id}`)
    target.tabIndex = -1
    target.focus({ preventScroll: true })
    window.scrollTo({
      top: target.getBoundingClientRect().top + window.scrollY - ACTIVE_OFFSET_PX,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }

  return (
    <nav
      aria-label="Table of contents"
      className={`flex min-h-0 flex-col gap-[clamp(8px,2.5dvh,20px)] font-reading ${className ?? ''}`}
    >
      {headings.length > 0 ? (
        <>
          {!mobile ? (
            <p className="shrink-0 font-mono text-xs uppercase tracking-[0.28em] text-blog-muted">
              On this page
            </p>
          ) : null}
          {/* The left gutter keeps the bouncing marker inside the scrollable area. */}
          <div ref={scrollerRef} className="-ml-10 min-h-0 overflow-y-auto pl-10">
            <div className="relative">
              {activeId ? (
                <span
                  ref={markerRef}
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 size-[5px] rounded-full bg-blog-accent"
                />
              ) : null}
              <ul className="pl-[15px]">
                {headings.map((heading) => {
                  const isActive = heading.id === activeId
                  return (
                    <li
                      key={heading.id}
                      ref={(element) => {
                        if (element) headingRefs.current.set(heading.id, element)
                        else headingRefs.current.delete(heading.id)
                      }}
                    >
                      <a
                        href={`#${heading.id}`}
                        aria-current={isActive ? 'true' : undefined}
                        data-active={isActive || undefined}
                        onClick={(event) => navigateToHeading(event, heading.id)}
                        className={`block py-[3px] text-[0.9375rem] leading-[1.4] text-blog-muted transition-colors hover:text-blog-accent focus-visible:outline-2 focus-visible:outline-blog-accent data-[active]:text-blog-accent motion-reduce:transition-none ${
                          heading.level === 3 ? 'pl-[15px]' : ''
                        }`}
                      >
                        {heading.text}
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </>
      ) : null}
      <div className="flex shrink-0 items-center gap-3">
        <div
          role="progressbar"
          aria-label="Reading progress"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="h-[3px] w-[150px] max-w-[45%] overflow-hidden rounded-full bg-blog-rule"
        >
          <span
            className="block h-full origin-left bg-blog-accent"
            style={{ transform: `scaleX(${progress / 100})` }}
          />
        </div>
        <span className="whitespace-nowrap font-mono text-xs tabular-nums text-blog-muted">
          {progress}% · {readTime}
        </span>
      </div>
    </nav>
  )
}
