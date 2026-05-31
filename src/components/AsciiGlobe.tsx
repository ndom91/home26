import { useEffect, useRef } from 'react'

type GlobePoint = {
  x: number
  y: number
  z: number
  seed: number
}

const CHARS = '  .,:;-=+*x%#@01{}[]<>/\\ndom'
const ROWS = 54
const COLS = 104

function createPoints() {
  const points: GlobePoint[] = []

  for (let lat = 0; lat < ROWS; lat += 1) {
    const v = lat / (ROWS - 1)
    const phi = v * Math.PI

    for (let lon = 0; lon < COLS; lon += 1) {
      const u = lon / COLS
      const theta = u * Math.PI * 2

      points.push({
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

export function AsciiGlobe() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
    let animationFrame = 0
    let width = 1
    let height = 1
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

    const draw = (time: number) => {
      const t = time * 0.001
      pointer.x += (pointer.tx - pointer.x) * 0.045
      pointer.y += (pointer.ty - pointer.y) * 0.045

      const rotY = (reduceMotion.matches ? 0.25 : t * 0.105) + pointer.x * 0.24 + pointer.vx * 0.08
      const rotX = pointer.y * -0.18 + pointer.vy * -0.05
      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const centerX = width / 2
      const centerY = height / 2
      const scale = Math.min(width, height) * 0.594

      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(23, 20, 15, 0.2)'
      context.fillRect(0, 0, width, height)
      context.font = '600 8.4px IBM Plex Mono, monospace'
      context.textAlign = 'center'
      context.textBaseline = 'middle'

      for (const point of POINTS) {
        const x1 = point.x * cosY - point.z * sinY
        const z1 = point.x * sinY + point.z * cosY
        const y1 = point.y * cosX - z1 * sinX
        const z2 = point.y * sinX + z1 * cosX
        const distance = Math.hypot(x1 - pointer.x * 1.05, y1 + pointer.y * 1.05)
        const influence = Math.max(0, 1 - distance / 0.86)
        const warp = 1 + influence * 0.08 + Math.sin(t * 1.2 + point.seed) * 0.006
        const perspective = 1.34 / (1.95 - z2 * 0.55)
        const sx = centerX + x1 * scale * perspective * warp
        const sy = centerY + y1 * scale * perspective * warp
        const depth = Math.max(0, Math.min(1, (z2 + 1) / 2))
        const shade = Math.max(0, Math.min(1, 0.18 + depth * 0.68 + influence * 0.18))
        const char = CHARS[Math.min(CHARS.length - 1, Math.floor(shade * CHARS.length))]
        const frontAlpha = 0.22 + depth * 0.46
        const backAlpha = 0.11 + depth * 0.12
        const alpha = z2 >= 0 ? frontAlpha : backAlpha
        const lime = influence > 0.22 || (z2 > 0.68 && y1 < -0.48)

        context.fillStyle = lime
          ? `rgba(215, 255, 47, ${0.25 + influence * 0.38 + depth * 0.18})`
          : `rgba(242, 234, 217, ${alpha})`
        context.fillText(char, sx, sy)
      }

      pointer.vx *= 0.86
      pointer.vy *= 0.86
      animationFrame = window.requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(root)
    window.addEventListener('pointermove', onPointerMove)
    animationFrame = window.requestAnimationFrame(draw)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('pointermove', onPointerMove)
      observer.disconnect()
    }
  }, [])

  return (
    <div ref={rootRef} className="ascii-globe" aria-hidden="true">
      <canvas ref={canvasRef} />
    </div>
  )
}
