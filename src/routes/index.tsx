import { createFileRoute } from '@tanstack/react-router'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { LifeField } from '../components/LifeField'
import { SiteHeader } from '../components/SiteHeader'
import { usePointerSweep } from '../lib/use-pointer-sweep'

export const Route = createFileRoute('/')({
  component: Home,
})

const homeBarCellClass = 'px-5 py-4'
const detailCardClass =
  "relative min-h-32 overflow-hidden border-r border-rule p-[1.15rem] [--hover-color-strength:1] [--sweep-int:calc(var(--hover-color-strength)*var(--sweep-dampen))] [--hover-tilt:2.5deg] [--hover-x:50%] before:pointer-events-none before:absolute before:inset-y-[-30%] before:left-0 before:w-[min(42rem,190%)] before:bg-[linear-gradient(90deg,transparent,rgb(var(--detail-accent)/calc(0.034*var(--sweep-int)))_10%,rgb(var(--detail-accent)/calc(0.11*var(--sweep-int)))_30%,rgb(var(--detail-accent)/calc(0.14*var(--sweep-int)))_42%,rgb(var(--detail-accent)/calc(0.14*var(--sweep-int)))_58%,rgb(var(--detail-accent)/calc(0.11*var(--sweep-int)))_70%,rgb(var(--detail-accent)/calc(0.034*var(--sweep-int)))_90%,transparent)] before:content-[''] before:opacity-0 before:blur-[8px] before:transition-opacity before:duration-500 before:translate-x-[calc(var(--hover-x)-50%)] before:rotate-[var(--hover-tilt)] after:pointer-events-none after:absolute after:inset-0 after:bg-[image:var(--grit-image)] after:bg-[length:180px_180px] after:bg-repeat after:content-[''] after:opacity-0 after:mix-blend-normal after:transition-opacity after:duration-500 hover:before:opacity-100 hover:before:duration-180 hover:after:opacity-[var(--grit-opacity)] hover:after:duration-180 max-[520px]:min-h-28 max-[520px]:p-4"
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
  { label: 'Currently At', value: 'Plain', accentClass: '[--detail-accent:88_135_50]' },
  { label: 'Based In', value: 'Berlin', accentClass: '[--detail-accent:8_151_154]' },
  {
    label: 'After Hours',
    value: 'Smart Home Chaos',
    accentClass: '[--detail-accent:219_126_39]',
  },
  { label: 'Source', value: 'Open', accentClass: '[--detail-accent:118_76_153]' },
] as const
function Home() {
  const pointerSweep = usePointerSweep()

  return (
    <main className="relative grid min-h-dvh grid-rows-[auto_1fr_auto] overflow-hidden bg-paper font-body text-ink">
      <LifeField />

      <SiteHeader />

      <div className="relative z-1 grid grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.9fr)] gap-px border-b border-rule max-[820px]:grid-cols-1">
        <section
          className="grid min-h-[72dvh] justify-end content-end overflow-hidden p-[clamp(1.5rem,4vw,4.5rem)] max-[820px]:min-h-[min(28rem,48svh)] max-[520px]:min-h-20 max-[520px]:p-5"
          aria-labelledby="home-title"
        >
          <div>
            <div
              className="mb-10 flex justify-self-end text-accent max-[520px]:mb-4"
              aria-hidden="true"
            >
              {eyebrowBars.map((barClass) => (
                <span
                  key={barClass}
                  className={`block h-[3.2rem] w-[2.2rem] border-2 border-r-0 border-paper max-[520px]:h-[1.85rem] max-[520px]:w-[1.35rem] ${barClass}`}
                />
              ))}
            </div>
            <h1
              id="home-title"
              className="m-0 max-w-[12ch] font-logo text-[clamp(3.2rem,12vw,12rem)] font-bold leading-[0.8] tracking-normal max-[520px]:text-[clamp(2.9rem,14vw,3.8rem)]"
            >
              .domino
            </h1>
          </div>
        </section>

        <aside
          className="grid grid-rows-[1fr_auto] border-l border-rule max-[820px]:border-l-0 max-[820px]:border-t"
          aria-label="Profile summary"
        >
          <section className="relative grid min-h-[28rem] content-end overflow-hidden bg-ink p-[clamp(1.25rem,3vw,3rem)] text-paper max-[820px]:min-h-[20rem] max-[520px]:min-h-[15rem] max-[520px]:p-5">
            <AsciiGlobe />
            <p className="relative m-0 max-w-[35rem] text-[clamp(1.25rem,2.1vw,2.3rem)] leading-[1.16] tracking-[-0.04em] max-[520px]:max-w-[18rem] max-[520px]:text-[1.04rem] max-[520px]:leading-[1.16]">
              I like building web tools, developer systems, and the occasional over-engineered side
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
                {...pointerSweep}
              >
                <strong className={detailLabelClass}>{detail.label}</strong>
                <span className={detailValueClass}>{detail.value}</span>
              </div>
            ))}
          </section>
        </aside>
      </div>

      <footer className="relative z-10 grid grid-cols-[auto_1fr] items-center border-b border-rule bg-paper text-[0.7rem] uppercase tracking-[0.16em] max-[820px]:grid-cols-1 max-[520px]:text-[0.7rem] max-[520px]:tracking-widest">
        <span
          className={`${homeBarCellClass} overflow-hidden text-ellipsis whitespace-nowrap max-[520px]:px-4 max-[520px]:py-4`}
        >
          Software Engineer · Open Source · Linux · Woodworking · Electronics
        </span>
      </footer>
    </main>
  )
}
