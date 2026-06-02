import { createFileRoute } from '@tanstack/react-router'
import type { PointerEvent } from 'react'
import { AsciiGlobe } from '../components/AsciiGlobe'
import { SiteHeader } from '../components/SiteHeader'
import { TopographicField } from '../components/TopographicField'

export const Route = createFileRoute('/')({
  component: Home,
})

const homeBarCellClass = 'px-5 py-4'
const detailCardClass =
  "relative min-h-32 overflow-hidden border-r border-rule p-[1.15rem] [--hover-color-strength:1] [--hover-tilt:2.5deg] [--hover-x:50%] before:pointer-events-none before:absolute before:inset-y-[-30%] before:left-0 before:w-[min(32rem,160%)] before:bg-[linear-gradient(90deg,transparent,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_22%,rgb(var(--detail-accent)/calc(0.14*var(--hover-color-strength)))_50%,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_78%,transparent)] before:content-[''] before:opacity-0 before:blur-[8px] before:transition-opacity before:duration-500 before:translate-x-[calc(var(--hover-x)-50%)] before:rotate-[var(--hover-tilt)] after:pointer-events-none after:absolute after:inset-0 after:bg-[image:var(--grit-image)] after:bg-[length:180px_180px] after:bg-repeat after:content-[''] after:opacity-0 after:mix-blend-normal after:transition-opacity after:duration-500 hover:before:opacity-100 hover:before:duration-180 hover:after:opacity-[var(--grit-opacity)] hover:after:duration-180 max-[520px]:min-h-28 max-[520px]:p-4"
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
  { label: 'Currently', value: 'Plain', accentClass: '[--detail-accent:88_135_50]' },
  { label: 'Based In', value: 'Berlin', accentClass: '[--detail-accent:8_151_154]' },
  {
    label: 'After Hours',
    value: 'Smart Home Chaos',
    accentClass: '[--detail-accent:219_126_39]',
  },
  { label: 'Source', value: 'Open', accentClass: '[--detail-accent:118_76_153]' },
] as const
function Home() {
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
              className="m-0 max-w-[12ch] font-logo text-[clamp(3.2rem,12vw,12rem)] font-bold leading-[0.8] -tracking-widest max-[520px]:text-[clamp(2.9rem,14vw,3.8rem)]"
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

      <footer className="relative z-10 grid grid-cols-[auto_1fr] items-center border-b border-rule bg-paper text-[0.7rem] uppercase tracking-[0.16em] max-[820px]:grid-cols-1 max-[520px]:text-[0.62rem] max-[520px]:tracking-[0.18em]">
        <span
          className={`${homeBarCellClass} overflow-hidden text-ellipsis whitespace-nowrap max-[820px]:whitespace-normal max-[520px]:px-5 max-[520px]:py-4`}
        >
          Software Engineer · Open Source · Linux · Woodworking · Electronics
        </span>
      </footer>
    </main>
  )
}
