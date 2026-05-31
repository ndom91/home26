import { createFileRoute, Link } from '@tanstack/react-router'
import type { CSSProperties, PointerEvent } from 'react'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { TopographicField } from '../components/TopographicField'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  function handleDetailPointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()

    event.currentTarget.style.setProperty('--hover-target-x', `${event.clientX - rect.left}px`)
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
              onPointerMove={handleDetailPointerMove}
            >
              <strong>Currently</strong>
              <span>Plain</span>
            </div>
            <div
              style={{ '--detail-accent': '28 111 154' } as CSSProperties}
              onPointerMove={handleDetailPointerMove}
            >
              <strong>Based In</strong>
              <span>Berlin</span>
            </div>
            <div
              style={{ '--detail-accent': '174 87 55' } as CSSProperties}
              onPointerMove={handleDetailPointerMove}
            >
              <strong>Habit</strong>
              <span>OSS</span>
            </div>
            <div
              style={{ '--detail-accent': '118 76 153' } as CSSProperties}
              onPointerMove={handleDetailPointerMove}
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
