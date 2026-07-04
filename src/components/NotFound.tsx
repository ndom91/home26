import { Link } from '@tanstack/react-router'
import { LifeField } from './LifeField'
import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

const eyebrowBars = [
  'bg-accent-100',
  'bg-accent-300',
  'bg-accent-500',
  'bg-accent-700',
  'bg-accent-900',
]

export function NotFound() {
  return (
    <main
      data-page="not-found"
      className="relative grid min-h-dvh grid-rows-[auto_1fr_auto] overflow-hidden bg-paper font-body text-ink"
    >
      <LifeField />

      <SiteHeader />

      <section
        className="relative z-1 grid place-items-center px-6 md:px-24 py-16 sm:py-24"
        aria-labelledby="notfound-title"
      >
        <div className="w-full max-w-7xl">
          <div className="mb-6 flex text-accent" aria-hidden="true">
            {eyebrowBars.map((barClass) => (
              <span
                key={barClass}
                className={`block h-9 w-7 border-2 border-r-0 border-paper max-[520px]:h-6 max-[520px]:w-4 ${barClass}`}
              />
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_32rem] lg:items-end">
            <h1
              id="notfound-title"
              className="m-0 min-w-0 text-balance font-heading text-[clamp(12rem,26vw,20rem)] font-extrabold uppercase leading-[0.8] tracking-[-0.03em] text-blog-text"
            >
              404
            </h1>

            <div className="border border-rule bg-paper/75 p-5 backdrop-blur-sm lg:self-end">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted">Dead cell</p>
              <p className="mt-3 text-pretty text-sm leading-6 text-muted">
                Underpopulation. This page had too few living neighbors and didn&rsquo;t survive to
                the next generation.
              </p>
              <p className="mt-2 text-pretty text-sm leading-6 text-muted">
                Maybe the link is stale, or the URL took a wrong turn.
              </p>

              <nav
                className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[0.7rem] uppercase tracking-[0.16em] [&>a]:relative [&>a]:inline-flex [&>a]:items-center [&>a]:transition-colors [&>a]:hover:text-accent"
                aria-label="Recover"
              >
                <Link to="/">&larr; Home</Link>
                <Link to="/blog">Read the blog</Link>
                <Link to="/projects">See the projects</Link>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
