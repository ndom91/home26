import { createFileRoute, Link } from '@tanstack/react-router'
import type { CSSProperties, PointerEvent } from 'react'
import { useEffect, useState } from 'react'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { TopographicField } from '../components/TopographicField'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

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

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    const meta = document.querySelector('meta[name="color-scheme"]')

    document.documentElement.dataset.theme = nextTheme
    meta?.setAttribute('content', nextTheme)
    localStorage.setItem('theme', nextTheme)
    setTheme(nextTheme)
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
    const tilt = direction * Math.min(10, Math.max(2, movementStrength * 18))
    const colorStrength = Math.min(1.28, Math.max(0.82, 0.86 + movementStrength * 0.65))
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
      const nextX = latestX + (latestTargetX - latestX) * 0.025
      const nextTilt = latestTilt + (latestTargetTilt - latestTilt) * 0.1
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
    <main className="home-page">
      <TopographicField />

      <header className="home-bar">
        <nav aria-label="Primary">
          <Link to="/blog">Writing</Link>
          <a href="https://github.com/ndom91" target="_blank" rel="noreferrer">
            GitHub
          </a>
          <a href="mailto:home@ndo.dev">Contact</a>
        </nav>
        <button
          className="theme-toggle"
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-pressed={theme === 'dark'}
        >
          <span className="theme-toggle__track" aria-hidden="true">
            <span className="theme-toggle__thumb">
              <svg
                className="theme-toggle__icon theme-toggle__icon--sun"
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
                className="theme-toggle__icon theme-toggle__icon--moon"
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

      <div className="home-main-grid">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-wordmark">
            <div className="home-eyebrow" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
            <h1 id="home-title">.domino</h1>
          </div>
        </section>

        <aside className="home-intro" aria-label="Profile summary">
          <section className="home-poster-card">
            <AsciiGlobe />
            <p>
              I build fast, durable product surfaces and developer systems with useful constraints.
            </p>
          </section>

          <section className="home-details" aria-label="Details">
            <div
              style={{ '--detail-accent': '136 169 0' } as CSSProperties}
              onPointerEnter={handleDetailPointerEnter}
              onPointerMove={handleDetailPointerMove}
              onPointerLeave={handleDetailPointerLeave}
            >
              <strong>Currently</strong>
              <span>Plain</span>
            </div>
            <div
              style={{ '--detail-accent': '28 111 154' } as CSSProperties}
              onPointerEnter={handleDetailPointerEnter}
              onPointerMove={handleDetailPointerMove}
              onPointerLeave={handleDetailPointerLeave}
            >
              <strong>Based In</strong>
              <span>Berlin</span>
            </div>
            <div
              style={{ '--detail-accent': '174 87 55' } as CSSProperties}
              onPointerEnter={handleDetailPointerEnter}
              onPointerMove={handleDetailPointerMove}
              onPointerLeave={handleDetailPointerLeave}
            >
              <strong>Habit</strong>
              <span>OSS</span>
            </div>
            <div
              style={{ '--detail-accent': '118 76 153' } as CSSProperties}
              onPointerEnter={handleDetailPointerEnter}
              onPointerMove={handleDetailPointerMove}
              onPointerLeave={handleDetailPointerLeave}
            >
              <strong>Online</strong>
              <span>2026</span>
            </div>
          </section>
        </aside>
      </div>

      <footer className="home-bar home-footer">
        <span className="home-ticker">
          Software Engineer · Open Source · Linux · Woodworking · Electronics
        </span>
      </footer>
    </main>
  )
}
