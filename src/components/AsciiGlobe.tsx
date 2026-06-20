import { useEffect, useRef, useState } from 'react'

type GlobePoint = {
  lat: number
  lon: number
  x: number
  y: number
  z: number
  seed: number
}

type DeviceOrientationEventConstructorWithPermission = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<PermissionState>
}

const CHARS = Array.from('  .,:;i!+><*#%@')
const ROWS = 70
const COLS = 136
const FRAME_INTERVAL = 1000 / 30

function createPoints() {
  const points: GlobePoint[] = []

  for (let lat = 0; lat < ROWS; lat += 1) {
    const v = lat / (ROWS - 1)
    const phi = v * Math.PI

    for (let lon = 0; lon < COLS; lon += 1) {
      const u = lon / COLS
      const theta = u * Math.PI * 2

      points.push({
        lat,
        lon,
        x: Math.sin(phi) * Math.cos(theta),
        y: Math.cos(phi),
        z: Math.sin(phi) * Math.sin(theta),
        seed: lon * 0.17 + lat * 0.31,
      })
    }
  }

  return points
}

const POINTS = createPoints()

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function AsciiGlobe() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tiltEnabled, setTiltEnabled] = useState(false)

  useEffect(() => {
    const DeviceOrientation = window.DeviceOrientationEvent as
      | DeviceOrientationEventConstructorWithPermission
      | undefined
    if (!rootRef.current) return
    if (!DeviceOrientation) return

    const needsPermission = typeof DeviceOrientation?.requestPermission === 'function'
    const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) return
    if (!isCoarsePointer) return

    if (!needsPermission) {
      setTiltEnabled(true)
      return
    }

    let cancelled = false

    // requestPermission exists: Chrome on Android resolves "granted" silently
    // with no gesture; iOS Safari requires transient activation and rejects
    // quietly (no prompt) when called without one. Calling it eagerly here
    // re-enables Android while leaving iOS pointer/ambient-only with no prompt.
    DeviceOrientation.requestPermission?.()
      .then((state) => {
        if (!cancelled && state === 'granted') setTiltEnabled(true)
      })
      .catch(() => {
        // iOS without a user gesture, or denied — keep pointer/ambient only.
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current

    if (!root || !canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const pointer = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 }
    const orientation = { x: 0, y: 0, tx: 0, ty: 0, vx: 0, vy: 0 }
    const scrollSpring = { x: 0, y: 0, vx: 0, vy: 0 }
    let animationTimer = 0
    let width = 1
    let height = 1
    let previousTime = 0
    let running = false
    let orientationBaseline: { beta: number; gamma: number } | null = null
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)

      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }

    const onPointerMove = (event: PointerEvent) => {
      const nextX = event.clientX / window.innerWidth - 0.5
      const nextY = event.clientY / window.innerHeight - 0.5

      pointer.vx += (nextX - pointer.tx) * 0.28
      pointer.vy += (nextY - pointer.ty) * 0.28
      pointer.tx = nextX
      pointer.ty = nextY
    }

    const onWheel = (event: WheelEvent) => {
      if (reduceMotion.matches) {
        return
      }

      scrollSpring.vx += Math.max(-80, Math.min(80, event.deltaY)) * 0.00035
      scrollSpring.vy += Math.max(-80, Math.min(80, event.deltaX)) * 0.00025
    }

    const onDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (reduceMotion.matches || event.beta === null || event.gamma === null) {
        return
      }

      orientationBaseline ??= { beta: event.beta, gamma: event.gamma }

      // Map device tilt to a spotlight position. Divisors set sensitivity
      // (smaller = a gentler tilt sweeps the light further); the clamp lets the
      // light travel to the globe edge like a tap in the screen corner.
      const nextX = clamp((event.gamma - orientationBaseline.gamma) / 22, -0.7, 0.7)
      const nextY = clamp((event.beta - orientationBaseline.beta) / 26, -0.7, 0.7)

      orientation.vx += (nextX - orientation.tx) * 0.12
      orientation.vy += (nextY - orientation.ty) * 0.12
      orientation.tx = nextX
      orientation.ty = nextY
    }

    const draw = (time: number) => {
      const delta = Math.min(40, time - previousTime || 16) / 16.6667
      const t = time * 0.001
      previousTime = time
      pointer.x += (pointer.tx - pointer.x) * 0.045
      pointer.y += (pointer.ty - pointer.y) * 0.045
      orientation.x += (orientation.tx - orientation.x) * 0.09
      orientation.y += (orientation.ty - orientation.y) * 0.09
      scrollSpring.vx += -scrollSpring.x * 0.018 * delta
      scrollSpring.vy += -scrollSpring.y * 0.018 * delta
      scrollSpring.vx *= 1 - Math.min(0.18, 0.06 * delta)
      scrollSpring.vy *= 1 - Math.min(0.18, 0.06 * delta)
      scrollSpring.x += scrollSpring.vx * delta
      scrollSpring.y += scrollSpring.vy * delta

      const rotY = 0.25 + (reduceMotion.matches ? 0 : t * 0.035) + scrollSpring.x
      const rotX = scrollSpring.y
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const centerX = width / 2
      const centerY = height / 2
      const scale = Math.min(width, height) * 0.594

      // Spotlight position: the mouse drives it on desktop, device tilt on
      // mobile. Tilting moves the lit region across the globe instead of
      // rotating the globe itself.
      const lightX = pointer.x - orientation.x
      const lightY = pointer.y + orientation.y

      context.clearRect(0, 0, width, height)
      const styles = getComputedStyle(root)
      const globeShade = styles.getPropertyValue('--globe-shade').trim()
      const globeText = styles.getPropertyValue('--globe-text').trim()
      const globeAccent = styles.getPropertyValue('--globe-accent').trim()

      context.fillStyle = globeShade || 'rgba(23, 20, 15, 0.2)'
      context.fillRect(0, 0, width, height)

      // Scale the glyph size with the globe so character density stays
      // consistent across breakpoints.
      const fontPx = Math.max(8.4, scale * 0.02)
      context.font = `400 ${fontPx.toFixed(2)}px IBM Plex Mono, monospace`
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      for (const point of POINTS) {
        const x1 = point.x * cosY - point.z * sinY
        const z1 = point.x * sinY + point.z * cosY
        const y1 = point.y * cosX - z1 * sinX
        const z2 = point.y * sinX + z1 * cosX
        const distance = Math.hypot(x1 - lightX * 1.05, y1 + lightY * 1.05)
        const influence = Math.max(0, 1 - distance / 0.86)
        const warp = 1 + influence * 0.08 + Math.sin(point.seed) * 0.006
        const perspective = 1.34 / (1.95 - z2 * 0.55)
        const sx = centerX + x1 * scale * perspective * warp
        const sy = centerY + y1 * scale * perspective * warp
        const depth = Math.max(0, Math.min(1, (z2 + 1) / 2))
        const meridian = point.lon % 13 === 0
        const latitude = point.lat % 9 === 0
        const orbitCue = meridian || latitude
        const highlightBand = Math.max(0, 1 - Math.abs(x1 - 0.28) / 0.08) * Math.max(0, z2)
        const shade = Math.max(0, Math.min(1, 0.18 + depth * 0.68 + influence * 0.18))
        const charIndex = Math.min(CHARS.length - 1, Math.floor(shade * CHARS.length))
        const char = orbitCue ? CHARS[Math.max(charIndex, CHARS.length - 5)] : CHARS[charIndex]
        const frontAlpha = 0.32 + depth * 0.54
        const backAlpha = 0.04 + depth * 0.08
        const alpha = (z2 >= 0 ? frontAlpha : backAlpha) + highlightBand * 0.18
        const accentInfluence = influence * Math.max(0, z2)
        const lime = accentInfluence > 0.22

        context.fillStyle = lime
          ? `rgb(${globeAccent || '134 169 0'} / ${0.25 + accentInfluence * 0.38 + depth * 0.18 + highlightBand * 0.24})`
          : `rgb(${globeText || '242 234 217'} / ${alpha})`
        context.fillText(char, sx, sy)
      }

      pointer.vx *= 0.86
      pointer.vy *= 0.86
      orientation.vx *= 0.86
      orientation.vy *= 0.86
    }

    const stop = () => {
      running = false
      window.clearTimeout(animationTimer)
    }

    const tick = () => {
      if (!running) return

      draw(performance.now())
      animationTimer = window.setTimeout(tick, FRAME_INTERVAL)
    }

    const start = () => {
      if (document.visibilityState === 'hidden') return

      if (reduceMotion.matches) {
        stop()
        draw(performance.now())
        return
      }

      if (running) return

      running = true
      previousTime = 0
      draw(performance.now())
      animationTimer = window.setTimeout(tick, FRAME_INTERVAL)
    }

    const syncRuntime = () => {
      if (document.visibilityState === 'hidden') {
        stop()
        return
      }

      start()
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('wheel', onWheel, { passive: true })
    document.addEventListener('visibilitychange', syncRuntime)
    reduceMotion.addEventListener('change', syncRuntime)

    if (tiltEnabled) {
      window.addEventListener('deviceorientation', onDeviceOrientation)
    }

    start()

    return () => {
      stop()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('deviceorientation', onDeviceOrientation)
      document.removeEventListener('visibilitychange', syncRuntime)
      reduceMotion.removeEventListener('change', syncRuntime)
      observer.disconnect()
    }
  }, [tiltEnabled])

  return (
    <div
      ref={rootRef}
      className="absolute top-[max(-19rem,-24vw)] right-[max(-18rem,-22vw)] aspect-square w-[clamp(32rem,58vw,56rem)] overflow-hidden rounded-full border border-[rgb(var(--globe-text)/0.18)] bg-[image:var(--globe-background)] opacity-[0.96] min-[821px]:max-[1150px]:top-[-10rem] min-[821px]:max-[1150px]:right-[-17rem] min-[821px]:max-[1150px]:w-[clamp(42rem,70vw,50rem)] max-[820px]:top-[-7rem] max-[820px]:right-[-8rem] max-[820px]:w-[27rem] max-[520px]:top-[-5.5rem] max-[520px]:right-[-6.25rem] max-[520px]:w-[18.5rem]"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 size-full" />
    </div>
  )
}
