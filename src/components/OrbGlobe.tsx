import { useEffect, useRef, useState } from 'react'
import { globeOrb } from './orbkit/globe-orb'
import { ShaderOrb } from './orbkit/orbkit-core'

type OrbColors = { ink: string; paper: string }

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>
}

// Favour the key light over the plasma and add mid-tones so the dither reads
// as a shaded sphere instead of a flat pattern.
const ORB_PARAMS = {
  radius: 0.98,
  levels: 3,
  light: 1.25,
  plasma: 0.65,
  rim: 0.5,
  scale: 1.1,
  contrast: 1.25,
  spin: 0.12,
}

// orbkit's demo is 140 cells across 280px. `cells` counts cells per canvas
// width, so scale it with our much larger orb to keep the same 2px dots.
const CELL_PX = 2

// How far the pointer or tilt can swing the key light. 1 moves it roughly a
// quarter turn around the orb.
const POINTER_REACH = 2.2
const TILT_REACH = 1.6

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

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
  const [measured, setMeasured] = useState(false)
  const [tiltEnabled, setTiltEnabled] = useState(false)

  // orbkit reads `params` from a ref every frame and springs each value toward
  // its target, so mutating this one object steers the orb smoothly without
  // re-rendering React on every pointer or resize event.
  const paramsRef = useRef({ ...ORB_PARAMS, cells: 140, lightX: 0, lightY: 0 })

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
      paramsRef.current.cells = Math.round(entry.contentRect.width / CELL_PX)
      setMeasured(true)
    })
    resizeObserver.observe(root)

    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
      scheme.removeEventListener('change', sync)
    }
  }, [])

  useEffect(() => {
    const DeviceOrientation = window.DeviceOrientationEvent as
      | DeviceOrientationEventConstructorWithPermission
      | undefined
    if (!DeviceOrientation) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(pointer: coarse)').matches) return

    if (typeof DeviceOrientation.requestPermission !== 'function') {
      setTiltEnabled(true)
      return
    }

    let cancelled = false

    // requestPermission exists: Chrome on Android resolves "granted" silently
    // with no gesture; iOS Safari requires transient activation and rejects
    // quietly (no prompt) when called without one. Calling it eagerly here
    // enables Android while leaving iOS with the ambient light only.
    DeviceOrientation.requestPermission()
      .then((state) => {
        if (!cancelled && state === 'granted') setTiltEnabled(true)
      })
      .catch(() => {
        // iOS without a user gesture, or denied: keep the ambient light only.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const params = paramsRef.current
    let orientationBaseline: { beta: number; gamma: number } | null = null

    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotion.matches) return
      // Light follows the pointer: right of centre lights the right side,
      // above centre lights the top (GL y is up, screen y is down).
      params.lightX = (event.clientX / window.innerWidth - 0.5) * POINTER_REACH
      params.lightY = (0.5 - event.clientY / window.innerHeight) * POINTER_REACH
    }

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (reduceMotion.matches || event.beta === null || event.gamma === null) return

      // Tilt is relative to how the phone was held when the page loaded.
      orientationBaseline ??= { beta: event.beta, gamma: event.gamma }
      const x = clamp((event.gamma - orientationBaseline.gamma) / 22, -0.7, 0.7)
      const y = clamp((event.beta - orientationBaseline.beta) / 26, -0.7, 0.7)
      params.lightX = x * TILT_REACH
      params.lightY = -y * TILT_REACH
    }

    window.addEventListener('pointermove', onPointerMove)
    if (tiltEnabled) window.addEventListener('deviceorientation', onDeviceOrientation)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('deviceorientation', onDeviceOrientation)
    }
  }, [tiltEnabled])

  return (
    <div
      ref={rootRef}
      className="absolute top-[max(-19rem,-24vw)] right-[max(-18rem,-22vw)] aspect-square w-[clamp(32rem,58vw,56rem)] overflow-hidden rounded-full bg-[image:var(--globe-background)] opacity-[0.96] min-[821px]:max-[1150px]:top-[-10rem] min-[821px]:max-[1150px]:right-[-17rem] min-[821px]:max-[1150px]:w-[clamp(42rem,70vw,50rem)] max-[820px]:top-[-7rem] max-[820px]:right-[-8rem] max-[820px]:w-[27rem] max-[520px]:top-[-5.5rem] max-[520px]:right-[-6.25rem] max-[520px]:w-[18.5rem]"
      aria-hidden="true"
    >
      {colors && measured ? (
        <ShaderOrb
          variant={globeOrb}
          className="absolute inset-0 size-full"
          params={paramsRef.current}
          colors={colors}
          // Content is quantized to 2px cells, so a 1x backing store loses no
          // detail and keeps the layered surface noise cheap on retina.
          maxDpr={1}
        />
      ) : null}
    </div>
  )
}
