import {
  type CSSProperties,
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
} from 'react'

type TocHeading = {
  id: string
  text: string
  level: 2 | 3
}

// Distance from the viewport top at which a heading is considered "current".
// Roughly clears the sticky site header plus a little breathing room.
const ACTIVE_OFFSET_PX = 128
const INTRODUCTION_ID = 'article-introduction'
const MARKER_GAP_PX = 12
const MARKER_SIZE_PX = 6
let scrollFrame = 0

function readHeadingText(heading: HTMLElement): string {
  // rehype-autolink-headings adds an `<a class="heading-anchor">#</a>`;
  // drop it so the label is just the heading text.
  const clone = heading.cloneNode(true) as HTMLElement
  clone.querySelector('.heading-anchor')?.remove()
  return clone.textContent?.trim() ?? ''
}

function scrollToProgressSection(
  event: MouseEvent<HTMLAnchorElement>,
  id: string,
  onComplete?: () => void
) {
  if (event.button !== 0 || event.metaKey || event.altKey || event.ctrlKey || event.shiftKey) {
    return
  }

  const target = document.getElementById(id)
  if (!target) return

  event.preventDefault()
  window.history.pushState(null, '', `#${id}`)
  const top = Math.min(
    Math.max(0, target.getBoundingClientRect().top + window.scrollY - ACTIVE_OFFSET_PX),
    document.documentElement.scrollHeight - window.innerHeight
  )

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    window.scrollTo({ top, behavior: 'auto' })
    onComplete?.()
    return
  }

  window.cancelAnimationFrame(scrollFrame)
  const start = window.scrollY
  const distance = top - start
  const duration = Math.min(700, Math.max(250, Math.abs(distance) * 0.25))
  const startedAt = performance.now()

  const scroll = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    window.scrollTo({ top: start + distance * (1 - (1 - progress) ** 3), behavior: 'auto' })
    if (progress < 1) {
      scrollFrame = window.requestAnimationFrame(scroll)
    } else {
      onComplete?.()
    }
  }

  scrollFrame = window.requestAnimationFrame(scroll)
}

export function TableOfContents({
  containerRef,
  className,
}: {
  containerRef: RefObject<HTMLElement | null>
  className?: string
}) {
  const [headings, setHeadings] = useState<TocHeading[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({})
  const markerRef = useRef<HTMLSpanElement>(null)
  const headingRefs = useRef(new Map<string, HTMLLIElement>())
  const markerPosition = useRef<{ x: number; y: number } | null>(null)
  const markerAnimation = useRef<Animation | null>(null)
  const pendingHeadingId = useRef<string | null>(null)

  // Collect headings from the rendered article once it exists in the DOM.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const found = Array.from(container.querySelectorAll<HTMLElement>('h2, h3'))
      .filter((heading) => heading.id)
      .map((heading) => ({
        id: heading.id,
        text: readHeadingText(heading),
        level: (heading.tagName === 'H3' ? 3 : 2) as 2 | 3,
      }))
      .filter((heading) => heading.text.length > 0)

    setHeadings(found)
  }, [containerRef])

  // Track which heading the reader is currently under as they scroll.
  useEffect(() => {
    if (headings.length === 0) return

    const container = containerRef.current
    if (!container) return

    let frame = 0

    const updateActive = () => {
      frame = 0
      const nodes = headings
        .map((heading) => document.getElementById(heading.id))
        .filter((node): node is HTMLElement => node !== null)

      if (nodes.length === 0) return

      const scrollMargin = Number.parseFloat(getComputedStyle(nodes[0]).scrollMarginTop) || 0
      const activeOffset = ACTIVE_OFFSET_PX + scrollMargin

      const sections = nodes.filter((node) => node.tagName === 'H2')
      const sectionIds = [INTRODUCTION_ID, ...sections.map((section) => section.id)]
      const sectionStarts = [
        container.getBoundingClientRect().top,
        ...sections.map((section) => section.getBoundingClientRect().top),
      ]
      const articleBottom = container.getBoundingClientRect().bottom
      const articleComplete = articleBottom <= window.innerHeight
      setSectionProgress(
        Object.fromEntries(
          sectionIds.map((sectionId, index) => {
            if (articleComplete) return [sectionId, 1]

            const start = sectionStarts[index]
            const nextSection = sectionStarts[index + 1]
            // The final section completes when the article has fully entered the viewport.
            const end = nextSection ?? articleBottom - window.innerHeight + activeOffset
            const distance = end - start
            const progress =
              distance <= 0
                ? Number(start <= ACTIVE_OFFSET_PX)
                : Math.max(0, Math.min(1, (activeOffset - start) / distance))
            return [sectionId, progress]
          })
        )
      )

      // Keep a clicked heading selected until the controlled scroll reaches it.
      if (pendingHeadingId.current) return

      // Treat the final heading as current once the article has been fully read.
      if (articleComplete) {
        setActiveId(nodes[nodes.length - 1].id)
        return
      }

      // Otherwise the current section is the last heading above the offset line.
      let current = nodes[0].id
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= activeOffset) {
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

    updateActive()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      if (frame) window.cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [headings, containerRef])

  // Sweep the marker along a short arc rather than teleporting it between sections.
  useEffect(() => {
    if (!activeId) return

    const marker = markerRef.current
    const heading = headingRefs.current.get(activeId)
    const list = marker?.parentElement
    if (!marker || !heading || !list) return

    const link = heading.querySelector<HTMLAnchorElement>('a')
    if (!link) return

    const headingRect = heading.getBoundingClientRect()
    const listRect = list.getBoundingClientRect()
    const linkStyle = getComputedStyle(link)
    const lineHeight = Number.parseFloat(linkStyle.lineHeight)
    const markerY =
      headingRect.top -
      listRect.top +
      (Number.isNaN(lineHeight)
        ? (headingRect.height - MARKER_SIZE_PX) / 2
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

    const arcOffset = Math.min(16, 5 + Math.abs(distance) * 0.08)
    const controlX = Math.min(currentPosition.x, nextPosition.x) - arcOffset
    markerAnimation.current = marker.animate(
      Array.from({ length: 5 }, (_, index) => {
        const progress = index / 4
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
  }, [activeId])

  useEffect(() => {
    return () => markerAnimation.current?.cancel()
  }, [])

  const navigateToHeading = (event: MouseEvent<HTMLAnchorElement>, id: string) => {
    pendingHeadingId.current = id
    setActiveId(id)
    scrollToProgressSection(event, id, () => {
      pendingHeadingId.current = null
    })
  }

  if (headings.length === 0) return null

  const sections = [
    { id: INTRODUCTION_ID, text: 'Introduction' },
    ...headings.filter((heading) => heading.level === 2),
  ]

  return (
    <nav aria-label="Table of contents" className={`font-reading ${className ?? ''}`}>
      <div className="flex h-full gap-6">
        <div className="min-w-0 flex-1 overflow-y-auto">
          <p className="text-[10px] uppercase tracking-[0.28em] text-blog-faint">On this page</p>
          <ul className="relative mt-4 space-y-0.5 pl-6">
            {activeId ? (
              <span
                ref={markerRef}
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 size-1.5 rounded-full bg-blog-accent"
              />
            ) : null}
            {headings.map((heading) => {
              const isActive = heading.id === activeId
              return (
                <li
                  key={heading.id}
                  ref={(element) => {
                    if (element) {
                      headingRefs.current.set(heading.id, element)
                    } else {
                      headingRefs.current.delete(heading.id)
                    }
                  }}
                >
                  <a
                    href={`#${heading.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    data-active={isActive || undefined}
                    onClick={(event) => navigateToHeading(event, heading.id)}
                    className={`block py-1 text-sm leading-snug text-blog-muted transition-colors hover:text-blog-accent data-[active]:text-blog-accent ${
                      heading.level === 3 ? 'pl-3' : ''
                    }`}
                  >
                    {heading.text}
                  </a>
                </li>
              )
            })}
          </ul>
        </div>
        <ol aria-label="Article progress" className="flex w-1 shrink-0 flex-col gap-1">
          {sections.map((section) => (
            <li key={section.id} className="relative min-h-7 flex-1">
              <a
                href={`#${section.id}`}
                aria-label={`Jump to ${section.text}`}
                onClick={(event) =>
                  section.id === INTRODUCTION_ID
                    ? scrollToProgressSection(event, section.id)
                    : navigateToHeading(event, section.id)
                }
                className="absolute -inset-x-3 inset-y-0 flex justify-center outline-offset-4 focus-visible:outline-2 focus-visible:outline-blog-accent"
              >
                <span className="sr-only">Jump to {section.text}</span>
                <span
                  aria-hidden="true"
                  className="block h-full w-1 overflow-hidden rounded-full bg-blog-rule"
                >
                  <span
                    className="block h-full origin-top bg-blog-accent"
                    style={
                      {
                        '--section-progress': sectionProgress[section.id] ?? 0,
                        transform: 'scaleY(var(--section-progress))',
                      } as CSSProperties
                    }
                  />
                </span>
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
