import { useEffect, useRef, useState } from 'react'
import { globeOrb } from './orbkit/globe-orb'
import { ShaderOrb } from './orbkit/orbkit-core'

type OrbColors = { ink: string; paper: string }

// Favour the key light over the plasma and add mid-tones so the dither reads
// as a shaded sphere instead of a flat pattern.
const ORB_PARAMS = {
  radius: 0.98,
  levels: 5,
  light: 1.5,
  plasma: 0.5,
  rim: 0.12,
  scale: 1.1,
  contrast: 1.25,
  spin: 0.12,
}

// orbkit's demo is 140 cells across 280px. `cells` counts cells per canvas
// width, so scale it with our much larger orb to keep the same 2px dots.
const CELL_PX = 2

function mixHex(rgb: number[], target: number, amount: number) {
  return `#${rgb
    .map((c) =>
      Math.round(c + (target - c) * amount)
        .toString(16)
        .padStart(2, '0')
    )
    .join('')}`
}

// The shader takes hex colours, but the theme lives in CSS vars. Both tones
// derive from --globe-accent (an "r g b" triplet), so the orb carries its own
// light and shadow side on either panel colour.
function readColors(element: HTMLElement): OrbColors | null {
  const accent = getComputedStyle(element)
    .getPropertyValue('--globe-accent')
    .trim()
    .split(/\s+/)
    .map(Number)
  if (accent.length !== 3 || accent.some(Number.isNaN)) return null
  return { ink: mixHex(accent, 0, 0.82), paper: mixHex(accent, 255, 0.45) }
}

export function OrbGlobe() {
  const rootRef = useRef<HTMLDivElement>(null)
  const [colors, setColors] = useState<OrbColors | null>(null)
  const [cells, setCells] = useState<number | null>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const sync = () => setColors(readColors(root))
    sync()

    // Theme flips via html[data-theme] or the OS colour scheme.
    const observer = new MutationObserver(sync)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    const scheme = window.matchMedia('(prefers-color-scheme: dark)')
    scheme.addEventListener('change', sync)

    const resizeObserver = new ResizeObserver(([entry]) => {
      setCells(Math.round(entry.contentRect.width / CELL_PX))
    })
    resizeObserver.observe(root)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      scheme.removeEventListener('change', sync)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="absolute top-[max(-19rem,-24vw)] right-[max(-18rem,-22vw)] aspect-square w-[clamp(32rem,58vw,56rem)] overflow-hidden rounded-full bg-[image:var(--globe-background)] opacity-[0.96] min-[821px]:max-[1150px]:top-[-10rem] min-[821px]:max-[1150px]:right-[-17rem] min-[821px]:max-[1150px]:w-[clamp(42rem,70vw,50rem)] max-[820px]:top-[-7rem] max-[820px]:right-[-8rem] max-[820px]:w-[27rem] max-[520px]:top-[-5.5rem] max-[520px]:right-[-6.25rem] max-[520px]:w-[18.5rem]"
      aria-hidden="true"
    >
      {colors && cells ? (
        <ShaderOrb
          variant={globeOrb}
          className="absolute inset-0 size-full"
          params={{ ...ORB_PARAMS, cells }}
          colors={colors}
        />
      ) : null}
    </div>
  )
}
