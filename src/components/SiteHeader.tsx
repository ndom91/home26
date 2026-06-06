import { Link } from '@tanstack/react-router'
import type { MouseEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'

const homeBarClass =
  'relative z-10 grid grid-cols-[auto_1fr] items-center border-b border-rule bg-paper text-[0.7rem] uppercase tracking-[0.16em] text-ink max-[820px]:grid-cols-[minmax(0,1fr)_auto] max-[520px]:text-[0.62rem] max-[520px]:tracking-[0.18em]'
const homeBarCellClass = 'px-5 py-4 max-[520px]:px-4 max-[520px]:py-3.5'
const themeIconClass =
  'absolute top-1/2 left-1/2 size-[0.95rem] -translate-x-1/2 -translate-y-1/2 origin-center stroke-[2.2] transition-[opacity,translate,rotate,scale] duration-540 ease-spring-toggle motion-reduce:duration-[1ms]'
const THEME_REVEAL_DELAY = 140

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    finished: Promise<void>
  }
}

export function SiteHeader() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const themeRevealSequence = useRef(0)
  const themeRevealTimeout = useRef<number | null>(null)
  const isDark = theme === 'dark'

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme')

    if (storedTheme === 'light' || storedTheme === 'dark') {
      setTheme(storedTheme)
      return
    }

    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

    document.documentElement.dataset.theme = systemTheme
    setTheme(systemTheme)
  }, [])

  useEffect(() => {
    return () => {
      if (themeRevealTimeout.current !== null) {
        window.clearTimeout(themeRevealTimeout.current)
      }
    }
  }, [])

  function toggleTheme(event: MouseEvent<HTMLButtonElement>) {
    const nextTheme = isDark ? 'light' : 'dark'
    const meta = document.querySelector('meta[name="color-scheme"]')
    const root = document.documentElement
    const rect = event.currentTarget.getBoundingClientRect()
    const transitionX = rect.left + rect.width / 2
    const transitionY = rect.top + rect.height / 2
    const transitionRadius = Math.ceil(
      Math.hypot(
        Math.max(transitionX, window.innerWidth - transitionX),
        Math.max(transitionY, window.innerHeight - transitionY)
      )
    )

    function updateDocumentTheme() {
      root.dataset.theme = nextTheme
      meta?.setAttribute('content', nextTheme)
      localStorage.setItem('theme', nextTheme)
    }

    const viewTransitionDocument = document as ViewTransitionDocument

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !viewTransitionDocument.startViewTransition
    ) {
      updateDocumentTheme()
      setTheme(nextTheme)
      return
    }

    flushSync(() => setTheme(nextTheme))

    themeRevealSequence.current += 1
    const revealSequence = themeRevealSequence.current

    if (themeRevealTimeout.current !== null) {
      window.clearTimeout(themeRevealTimeout.current)
    }

    themeRevealTimeout.current = window.setTimeout(() => {
      themeRevealTimeout.current = null
      root.style.setProperty('--theme-transition-x', `${transitionX}px`)
      root.style.setProperty('--theme-transition-y', `${transitionY}px`)
      root.style.setProperty('--theme-transition-radius', `${transitionRadius}px`)

      viewTransitionDocument.startViewTransition(updateDocumentTheme).finished.finally(() => {
        if (themeRevealSequence.current !== revealSequence) {
          return
        }

        root.style.removeProperty('--theme-transition-x')
        root.style.removeProperty('--theme-transition-y')
        root.style.removeProperty('--theme-transition-radius')
      })
    }, THEME_REVEAL_DELAY)
  }

  return (
    <header className={homeBarClass}>
      <nav
        className={`${homeBarCellClass} flex min-w-0 flex-wrap justify-center gap-x-5 gap-y-2 max-[820px]:justify-start max-[520px]:gap-x-4`}
        aria-label="Primary"
      >
        <Link to="/">Home</Link>
        <Link to="/blog">Write</Link>
        <Link to="/projects">Build</Link>
        <a href="https://github.com/ndom91" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </nav>
      <button
        className="me-5 cursor-pointer justify-self-end rounded-full border-0 bg-transparent p-0 text-inherit [view-transition-name:disabled] max-[520px]:me-4"
        type="button"
        onClick={toggleTheme}
        aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        aria-pressed={isDark}
      >
        <span
          className="relative grid h-[1.82rem] w-[calc(1.82rem*2-0.4rem)] grid-cols-2 items-center rounded-full border border-rule bg-[linear-gradient(90deg,rgb(var(--globe-accent)/0.14),transparent_54%),var(--paper)] p-[0.2rem] transition-[border-color,background] duration-[260ms] ease-in-out motion-reduce:duration-[1ms]"
          aria-hidden="true"
        >
          <span
            className={`relative grid aspect-square w-full place-items-center rounded-full bg-ink text-paper transition-[background,color,translate] duration-[540ms] ease-spring-toggle motion-reduce:duration-[1ms] ${
              isDark ? 'translate-x-full' : 'translate-x-0'
            }`}
          >
            <svg
              className={`${themeIconClass} ${
                isDark ? 'rotate-[70deg] scale-[0.55] opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="4" />
              <path d="M12 3v1" />
              <path d="M12 20v1" />
              <path d="M3 12h1" />
              <path d="M20 12h1" />
              <path d="m18.364 5.636-.707.707" />
              <path d="m6.343 17.657-.707.707" />
              <path d="m5.636 5.636.707.707" />
              <path d="m17.657 17.657.707.707" />
            </svg>
            <svg
              className={`${themeIconClass} ${
                isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-[70deg] scale-[0.55] opacity-0'
              }`}
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 5h4" />
              <path d="M20 3v4" />
              <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
            </svg>
          </span>
        </span>
      </button>
    </header>
  )
}
