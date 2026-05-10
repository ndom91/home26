import { createFileRoute, Link } from '@tanstack/react-router'
import { DominoCanvas } from '../components/DominoCanvas'

export const Route = createFileRoute('/')({
  component: Home,
})

const TICKER =
  '01001110 01000100 00110000 00110001 · ndom91 · .domino · yo@ndo.dev · BERLIN_DE · PLAIN.COM · 01111001 01101111 · '

function Ticker() {
  return (
    <div className="overflow-hidden border-b border-[#1a1815]">
      <div className="py-1.5">
        <span className="ticker-track font-mono text-[9px] tracking-wide text-[#38342f]">
          {TICKER.repeat(10)}
        </span>
      </div>
    </div>
  )
}

function Home() {
  const year = new Date().getFullYear()

  return (
    <main className="flex h-dvh flex-col overflow-hidden bg-[#0d0c0a] text-[#ede8df]">
      <Ticker />

      <nav
        className="grid border-b border-[#242220]"
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        <div className="border-r border-[#242220] px-5 py-4 sm:px-6">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.25em]">
            NDOM91
          </span>
        </div>
        <div className="flex items-center gap-5 px-5 sm:gap-7 sm:px-7">
          <Link
            to="/blog"
            className="font-mono text-[10px] uppercase tracking-widest text-[#66615a] transition-colors hover:text-[#ede8df]"
          >
            WRITING
          </Link>
          <a
            href="https://github.com/ndom91"
            target="_blank"
            rel="noreferrer"
            className="font-mono text-[10px] uppercase tracking-widest text-[#66615a] transition-colors hover:text-[#ede8df]"
          >
            GITHUB
          </a>
          <a
            href="mailto:yo@ndo.dev"
            className="font-mono text-[10px] uppercase tracking-widest text-[#66615a] transition-colors hover:text-[#ede8df]"
          >
            CONTACT
          </a>
        </div>
        <div className="hidden items-center gap-2.5 border-l border-[#242220] px-6 py-4 sm:flex">
          <span className="block size-1.5 rounded-full bg-[#c8ff00]" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#66615a]">
            PLAIN.COM
          </span>
        </div>
      </nav>

      <div className="flex items-center border-b border-[#242220] px-5 py-2.5 sm:px-6">
        <span className="font-mono text-[9px] uppercase tracking-widest text-[#55504a]">
          SOFTWARE ENGINEER · OPEN SOURCE · TYPESCRIPT · REACT · GO
        </span>
        <span className="ml-auto hidden border-l border-[#242220] pl-5 font-mono text-[9px] uppercase tracking-widest text-[#55504a] sm:block">
          BERLIN, DE
        </span>
        <span className="ml-4 hidden border-l border-[#242220] pl-4 font-mono text-[9px] uppercase tracking-widest text-[#55504a] sm:block">
          {year}
        </span>
      </div>

      <section className="relative isolate grid min-h-0 flex-1 place-items-center overflow-hidden px-5 py-6 sm:px-8">
        <DominoCanvas />

        <div className="hero-in relative w-full max-w-7xl">
          <div className="mb-4 flex items-center justify-between gap-4 font-mono text-[9px] uppercase tracking-[0.28em] text-[#625d55] sm:mb-6">
            <span>BUILDING QUIET SOFTWARE</span>
            <span className="hidden sm:inline">NDOM91 / .DOMINO</span>
          </div>

          <h1 className="domino-title font-heading text-[clamp(3.8rem,15vw,14rem)] font-extrabold leading-[0.82] tracking-[-0.085em] text-[#f2eee5]">
            .domino
          </h1>

          <div className="mt-4 grid gap-4 border-y border-[#242220] bg-[#0d0c0a]/85 py-4 backdrop-blur-[2px] sm:mt-6 sm:grid-cols-[1.2fr_0.8fr] sm:py-5">
            <p className="max-w-3xl font-mono text-sm leading-7 text-[#cfc8bb] sm:text-base sm:leading-8">
              I build fast, durable product surfaces and developer systems with TypeScript, React,
              Go, and a bias toward useful constraints.
            </p>
            <div className="grid grid-cols-2 gap-px bg-[#242220] font-mono text-[10px] uppercase tracking-widest text-[#706a61]">
              <div className="bg-[#0d0c0a] p-4">
                <span className="block text-[#ede8df]">Plain</span>
                Currently
              </div>
              <div className="bg-[#0d0c0a] p-4">
                <span className="block text-[#ede8df]">Berlin</span>
                Based In
              </div>
              <div className="bg-[#0d0c0a] p-4">
                <span className="block text-[#ede8df]">OSS</span>
                Habit
              </div>
              <div className="bg-[#0d0c0a] p-4">
                <span className="block text-[#ede8df]">2026</span>
                Online
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer
        className="grid border-t border-[#242220]"
        style={{ gridTemplateColumns: '1fr auto' }}
      >
        <div className="min-w-0 border-r border-[#242220] px-5 py-4 sm:px-6">
          <p className="truncate font-mono text-[9px] uppercase tracking-widest text-[#55504a]">
            NDOM91 · YO@NDO.DEV · NDO.DEV · BUILT WITH TANSTACK START
          </p>
        </div>
        <div className="flex items-center gap-5 px-5 py-4 sm:px-6">
          {(
            [
              ['GH', 'https://github.com/ndom91'],
              ['X', 'https://x.com/ndom91'],
              ['ML', 'mailto:yo@ndo.dev'],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="font-mono text-[10px] uppercase tracking-widest text-[#66615a] transition-colors hover:text-[#c8ff00]"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </main>
  )
}
