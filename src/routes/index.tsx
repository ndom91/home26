import { createFileRoute, Link } from '@tanstack/react-router'
import type { CSSProperties, PointerEvent } from 'react'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { TopographicField } from '../components/TopographicField'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  function setDetailHoverPosition(detail: HTMLDivElement, x: number) {
    detail.style.setProperty('--hover-x', `${x}px`)
    detail.style.setProperty('--hover-target-x', `${x}`)
    detail.dataset.hoverActive = 'true'
  }

  function handleDetailPointerEnter(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    setDetailHoverPosition(event.currentTarget, event.clientX - rect.left)
  }

  function handleDetailPointerMove(event: PointerEvent<HTMLDivElement>) {
    const detail = event.currentTarget
    const rect = event.currentTarget.getBoundingClientRect()
    const targetX = event.clientX - rect.left

    if (!detail.dataset.hoverActive) {
      setDetailHoverPosition(detail, targetX)
      return
    }

    const currentX = Number.parseFloat(detail.style.getPropertyValue('--hover-x')) || targetX

    detail.style.setProperty('--hover-target-x', `${targetX}`)

    if (detail.dataset.hoverFrame) {
      return
    }

    function followPointer() {
      const latestTargetX = Number.parseFloat(detail.style.getPropertyValue('--hover-target-x'))
      const latestX = Number.parseFloat(detail.style.getPropertyValue('--hover-x')) || currentX
      const nextX = latestX + (latestTargetX - latestX) * 0.025

      detail.style.setProperty('--hover-x', `${nextX}px`)

      if (Math.abs(latestTargetX - nextX) < 0.5) {
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
        <span className="home-status">Plain.com</span>
      </header>

      <div className="home-main-grid">
        <section className="home-hero" aria-labelledby="home-title">
          <p className="home-eyebrow">
            Software engineer · open source · TypeScript · React · Go · Berlin
          </p>
          <h1 id="home-title">.domino</h1>
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
        <span className="home-ticker">01001110 · 01000100 · product systems · developer tools</span>
        <span className="home-status">Available async</span>
      </footer>
    </main>
  )
}
