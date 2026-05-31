import { createFileRoute, Link } from '@tanstack/react-router'
import type { MouseEvent, PointerEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { TopographicField } from '../components/TopographicField'

export const Route = createFileRoute('/')({
  component: Home,
})

const homeBarClass =
  'relative z-10 grid grid-cols-[auto_1fr] items-center border-y border-rule bg-paper text-[0.7rem] uppercase tracking-[0.16em] max-[820px]:grid-cols-1'
const homeBarCellClass = 'px-5 py-4'
const themeIconClass =
  'absolute top-1/2 left-1/2 size-[0.95rem] -translate-x-1/2 -translate-y-1/2 origin-center stroke-[2.2] transition-[opacity,translate,rotate,scale] duration-[540ms] ease-spring-toggle motion-reduce:duration-[1ms]'
const detailCardClass =
  "relative min-h-32 overflow-hidden border-r border-rule p-[1.15rem] [--hover-color-strength:1] [--hover-tilt:2.5deg] [--hover-x:50%] before:pointer-events-none before:absolute before:inset-y-[-30%] before:left-0 before:w-[min(32rem,160%)] before:bg-[linear-gradient(90deg,transparent,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_22%,rgb(var(--detail-accent)/calc(0.14*var(--hover-color-strength)))_50%,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_78%,transparent)] before:content-[''] before:opacity-0 before:blur-[8px] before:transition-opacity before:duration-500 before:translate-x-[calc(var(--hover-x)-50%)] before:rotate-[var(--hover-tilt)] after:pointer-events-none after:absolute after:inset-0 after:bg-[image:var(--grit-image)] after:bg-[length:180px_180px] after:bg-repeat after:content-[''] after:opacity-0 after:mix-blend-normal after:transition-opacity after:duration-500 hover:before:opacity-100 hover:before:duration-180 hover:after:opacity-[var(--grit-opacity)] hover:after:duration-180"
const detailLabelClass = 'relative z-[1] mb-2 block text-[0.72rem] uppercase tracking-[0.22em]'
const detailValueClass = 'relative z-[1] text-[0.72rem] uppercase tracking-[0.14em] text-muted'

const eyebrowBars = [
  'bg-accent-100',
  'bg-accent-300',
  'bg-accent-500',
  'bg-accent-700',
  'bg-accent-900',
]
const details = [
  { label: 'Currently', value: 'Plain', accentClass: '[--detail-accent:169_75_16]' },
  { label: 'Based In', value: 'Berlin', accentClass: '[--detail-accent:28_111_154]' },
  { label: 'Habit', value: 'OSS', accentClass: '[--detail-accent:174_87_55]' },
  { label: 'Online', value: '2026', accentClass: '[--detail-accent:118_76_153]' },
] as const
const THEME_REVEAL_DELAY = 140

type ViewTransitionDocument = Document & {
  startViewTransition?: (updateCallback: () => void) => {
    finished: Promise<void>
  }
}

function Home() {
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

  function setDetailHoverPosition(detail: HTMLDivElement, x: number) {
    detail.style.setProperty('--hover-x', `${x}px`)
    detail.style.setProperty('--hover-target-x', `${x}`)
    detail.style.setProperty('--hover-tilt', '2deg')
    detail.style.setProperty('--hover-target-tilt', '2')
    detail.style.setProperty('--hover-color-strength', '1')
    detail.style.setProperty('--hover-target-color-strength', '1')
    detail.dataset.hoverActive = 'true'
    detail.dataset.hoverLastX = String(x)
    detail.dataset.hoverLastTime = String(performance.now())
  }

  function handleDetailPointerEnter(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    setDetailHoverPosition(event.currentTarget, event.clientX - rect.left)
  }

  function handleDetailPointerMove(event: PointerEvent<HTMLDivElement>) {
    const detail = event.currentTarget
    const rect = event.currentTarget.getBoundingClientRect()
    const targetX = event.clientX - rect.left
    const now = performance.now()

    if (!detail.dataset.hoverActive) {
      setDetailHoverPosition(detail, targetX)
      return
    }

    const lastX = Number.parseFloat(detail.dataset.hoverLastX || `${targetX}`)
    const lastTime = Number.parseFloat(detail.dataset.hoverLastTime || `${now}`)
    const elapsed = Math.max(now - lastTime, 1)
    const velocity = (targetX - lastX) / elapsed
    const direction = velocity < 0 ? -1 : 1
    const movementStrength = Math.abs(velocity)
    const tilt = direction * Math.min(8, Math.max(2, movementStrength * 32))
    const colorStrength = Math.min(1.12, Math.max(0.82, 0.84 + movementStrength * 0.38))
    const currentX = Number.parseFloat(detail.style.getPropertyValue('--hover-x')) || targetX

    detail.style.setProperty('--hover-target-x', `${targetX}`)
    detail.style.setProperty('--hover-target-tilt', `${tilt}`)
    detail.style.setProperty('--hover-target-color-strength', `${colorStrength}`)
    detail.dataset.hoverLastX = String(targetX)
    detail.dataset.hoverLastTime = String(now)

    if (detail.dataset.hoverFrame) {
      return
    }

    function followPointer() {
      const latestTargetX = Number.parseFloat(detail.style.getPropertyValue('--hover-target-x'))
      const latestX = Number.parseFloat(detail.style.getPropertyValue('--hover-x')) || currentX
      const latestTargetTilt = Number.parseFloat(
        detail.style.getPropertyValue('--hover-target-tilt')
      )
      const latestTilt =
        Number.parseFloat(detail.style.getPropertyValue('--hover-tilt')) || latestTargetTilt
      const latestTargetColorStrength = Number.parseFloat(
        detail.style.getPropertyValue('--hover-target-color-strength')
      )
      const latestColorStrength =
        Number.parseFloat(detail.style.getPropertyValue('--hover-color-strength')) ||
        latestTargetColorStrength
      const nextX = latestX + (latestTargetX - latestX) * 0.11
      const nextTilt = latestTilt + (latestTargetTilt - latestTilt) * 0.18
      const nextColorStrength =
        latestColorStrength + (latestTargetColorStrength - latestColorStrength) * 0.12

      detail.style.setProperty('--hover-x', `${nextX}px`)
      detail.style.setProperty('--hover-tilt', `${nextTilt}deg`)
      detail.style.setProperty('--hover-color-strength', `${nextColorStrength}`)

      if (
        Math.abs(latestTargetX - nextX) < 0.5 &&
        Math.abs(latestTargetTilt - nextTilt) < 0.1 &&
        Math.abs(latestTargetColorStrength - nextColorStrength) < 0.01
      ) {
        delete detail.dataset.hoverFrame
        return
      }

      detail.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
    }

    detail.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
  }

  function handleDetailPointerLeave(event: PointerEvent<HTMLDivElement>) {
    const detail = event.currentTarget

    if (detail.dataset.hoverFrame) {
      cancelAnimationFrame(Number(detail.dataset.hoverFrame))
      delete detail.dataset.hoverFrame
    }

    delete detail.dataset.hoverActive
    delete detail.dataset.hoverLastX
    delete detail.dataset.hoverLastTime
  }

  return (
    <main className="relative grid min-h-dvh grid-rows-[auto_1fr_auto] overflow-hidden bg-paper font-body text-ink">
      <TopographicField />

      <header className={homeBarClass}>
        <nav
          className={`${homeBarCellClass} flex justify-center gap-5 max-[820px]:justify-self-start`}
          aria-label="Primary"
        >
          <Link to="/blog">Writing</Link>
          <a href="https://github.com/ndom91" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="mailto:home@ndo.dev">Contact</a>
        </nav>
        <button
          className="me-5 cursor-pointer justify-self-end rounded-full border-0 bg-transparent p-0 text-inherit [view-transition-name:disabled]"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
          aria-pressed={isDark}
        >
          <span
            className="relative grid h-[1.82rem] w-[calc(1.82rem*2-0.4rem)] grid-cols-2 items-center rounded-full border border-rule bg-[linear-gradient(90deg,rgb(var(--globe-accent)/0.14),transparent_54%),var(--paper)] p-[0.2rem] transition-[border-color,background] duration-[260ms] ease-in-out before:absolute before:inset-[0.38rem] before:rounded-[inherit] before:bg-[radial-gradient(currentColor_0.7px,transparent_0.7px)] before:bg-[length:4px_4px] before:content-[''] before:opacity-[0.16] motion-reduce:duration-[1ms]"
            aria-hidden="true"
          >
            <span
              className={`relative grid aspect-square w-full place-items-center rounded-full bg-ink text-paper transition-[background,color,translate] duration-[540ms] ease-spring-toggle motion-reduce:duration-[1ms] ${
                isDark ? 'translate-x-full' : 'translate-x-0'
              }`}
            >
              <svg
                className={`${themeIconClass} ${
                  isDark
                    ? 'rotate-[70deg] scale-[0.55] opacity-0'
                    : 'rotate-0 scale-100 opacity-100'
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
                  isDark
                    ? 'rotate-0 scale-100 opacity-100'
                    : '-rotate-[70deg] scale-[0.55] opacity-0'
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

      <div className="relative z-1 grid grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] gap-px border-b border-rule max-[820px]:grid-cols-1">
        <section
          className="grid min-h-[72dvh] justify-end content-end overflow-hidden p-[clamp(1.5rem,4vw,4.5rem)]"
          aria-labelledby="home-title"
        >
          <div>
            <div className="mb-10 flex justify-self-end text-accent" aria-hidden="true">
              {eyebrowBars.map((barClass) => (
                <span
                  key={barClass}
                  className={`block h-[3.2rem] w-[2.2rem] border-2 border-r-0 border-paper ${barClass}`}
                />
              ))}
            </div>
            <h1
              id="home-title"
              className="m-0 max-w-[12ch] font-logo text-[clamp(3.2rem,12vw,12rem)] font-bold leading-[0.8] -tracking-widest lowercase"
            >
              .domino
            </h1>
          </div>
        </section>

        <aside
          className="grid grid-rows-[1fr_auto] border-l border-rule max-[820px]:border-l-0 max-[820px]:border-t"
          aria-label="Profile summary"
        >
          <section className="relative grid min-h-[28rem] content-end overflow-hidden bg-ink p-[clamp(1.25rem,3vw,3rem)] text-paper">
            <AsciiGlobe />
            <p className="relative z-[1] m-0 max-w-[31rem] text-[clamp(1.25rem,2.1vw,2.3rem)] leading-[1.16] tracking-[-0.04em]">
              I build sharp web tools, developer systems, and the occasional over-engineered side
              quest.
            </p>
          </section>

          <section
            className="relative z-[2] grid grid-cols-2 border-t border-rule bg-paper"
            aria-label="Details"
          >
            {details.map((detail, index) => (
              <div
                key={detail.label}
                className={`${detailCardClass} ${detail.accentClass} ${index < 2 ? 'border-b border-rule' : ''}`}
                onPointerEnter={handleDetailPointerEnter}
                onPointerMove={handleDetailPointerMove}
                onPointerLeave={handleDetailPointerLeave}
              >
                <strong className={detailLabelClass}>{detail.label}</strong>
                <span className={detailValueClass}>{detail.value}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <footer className="relative z-10 grid grid-cols-[auto_1fr] items-center border-b border-rule bg-paper text-[0.7rem] uppercase tracking-[0.16em] max-[820px]:grid-cols-1">
        <span className={`${homeBarCellClass} overflow-hidden whitespace-nowrap`}>
          Software Engineer · Open Source · Linux · Woodworking · Electronics
        </span>
      </footer>
    </main>
  )
}
