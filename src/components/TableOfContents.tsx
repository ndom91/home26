import { type RefObject, useEffect, useState } from 'react'

type TocHeading = {
  id: string
  text: string
  level: 2 | 3
}

// Distance from the viewport top at which a heading is considered "current".
// Roughly clears the sticky site header plus a little breathing room.
const ACTIVE_OFFSET_PX = 128

function readHeadingText(heading: HTMLElement): string {
  // rehype-autolink-headings prepends an `<a class="heading-anchor">#</a>`;
  // drop it so the label is just the heading text.
  const clone = heading.cloneNode(true) as HTMLElement
  clone.querySelector('.heading-anchor')?.remove()
  return clone.textContent?.trim() ?? ''
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

      // Bottom of the page: last heading wins regardless of offsets.
      const scrolledToBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (scrolledToBottom) {
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

  return (
    <nav aria-label="Table of contents" className={className}>
      <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-blog-faint">
        On this page
      </p>
      <ul className="mt-4 space-y-0.5 border-l border-blog-rule">
        {headings.map((heading) => {
          const isActive = heading.id === activeId
          return (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                aria-current={isActive ? 'location' : undefined}
                data-active={isActive || undefined}
                className={`-ml-px block border-l-2 border-transparent py-1 font-mono text-xs leading-snug tracking-wide text-blog-muted transition-colors hover:text-blog-accent data-[active]:border-blog-accent data-[active]:text-blog-accent ${
                  heading.level === 3 ? 'pl-7' : 'pl-4'
                }`}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
