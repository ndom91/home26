import { type CSSProperties, type MouseEvent, type RefObject, useEffect, useState } from 'react'

type TocHeading = {
  id: string
  text: string
  level: 2 | 3
}

// Distance from the viewport top at which a heading is considered "current".
// Roughly clears the sticky site header plus a little breathing room.
const ACTIVE_OFFSET_PX = 128
const INTRODUCTION_ID = 'article-introduction'
let scrollFrame = 0

function readHeadingText(heading: HTMLElement): string {
  // rehype-autolink-headings adds an `<a class="heading-anchor">#</a>`;
  // drop it so the label is just the heading text.
  const clone = heading.cloneNode(true) as HTMLElement
  clone.querySelector('.heading-anchor')?.remove()
  return clone.textContent?.trim() ?? ''
}

function scrollToProgressSection(event: MouseEvent<HTMLAnchorElement>, id: string) {
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
    if (progress < 1) scrollFrame = window.requestAnimationFrame(scroll)
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
            const end = nextSection ?? articleBottom - window.innerHeight + ACTIVE_OFFSET_PX
            const distance = end - start
            const progress =
              distance <= 0
                ? Number(start <= ACTIVE_OFFSET_PX)
                : Math.max(0, Math.min(1, (ACTIVE_OFFSET_PX - start) / distance))
            return [sectionId, progress]
          })
        )
      )

      // Treat the final heading as current once the article has been fully read.
      if (articleComplete) {
        setActiveId(nodes[nodes.length - 1].id)
        return
      }

      // Otherwise the current section is the last heading above the offset line.
      let current = nodes[0].id
      for (const node of nodes) {
        if (node.getBoundingClientRect().top <= ACTIVE_OFFSET_PX) {
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
          <ul className="mt-4 space-y-0.5">
            {headings.map((heading) => {
              const isActive = heading.id === activeId
              return (
                <li key={heading.id}>
                  <a
                    href={`#${heading.id}`}
                    aria-current={isActive ? 'location' : undefined}
                    data-active={isActive || undefined}
                    onClick={(event) => scrollToProgressSection(event, heading.id)}
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
            <li key={section.id} className="min-h-7 flex-1">
              <a
                href={`#${section.id}`}
                aria-label={`Jump to ${section.text}`}
                onClick={(event) => scrollToProgressSection(event, section.id)}
                className="block h-full overflow-hidden rounded-full bg-blog-rule outline-offset-4 focus-visible:outline-2 focus-visible:outline-blog-accent"
              >
                <span className="sr-only">Jump to {section.text}</span>
                <span
                  aria-hidden="true"
                  className="block h-full origin-top bg-blog-accent"
                  style={
                    {
                      '--section-progress': sectionProgress[section.id] ?? 0,
                      transform: 'scaleY(var(--section-progress))',
                    } as CSSProperties
                  }
                />
              </a>
            </li>
          ))}
        </ol>
      </div>
    </nav>
  )
}
