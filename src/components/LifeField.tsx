import { useEffect, useRef } from 'react'

const CELL_SIZE = 8
const FRAME_INTERVAL = 620
const WARMUP_GENERATIONS = 3
const GLIDER = [
  [1, 0],
  [2, 1],
  [0, 2],
  [1, 2],
  [2, 2],
] as const
const TOAD = [
  [1, 1],
  [2, 1],
  [3, 1],
  [0, 2],
  [1, 2],
  [2, 2],
] as const
const BEACON = [
  [0, 0],
  [1, 0],
  [0, 1],
  [3, 2],
  [2, 3],
  [3, 3],
] as const

type Pattern = readonly (readonly [number, number])[]

function createRandom(seed: number) {
  let value = seed

  return () => {
    value |= 0
    value = (value + 0x6d2b79f5) | 0

    let t = Math.imul(value ^ (value >>> 15), 1 | value)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function setCell(grid: Uint8Array, cols: number, rows: number, x: number, y: number) {
  if (x < 0 || y < 0 || x >= cols || y >= rows) return

  grid[y * cols + x] = 1
}

function stampPattern(
  grid: Uint8Array,
  cols: number,
  rows: number,
  pattern: Pattern,
  x: number,
  y: number
) {
  for (const [offsetX, offsetY] of pattern) {
    setCell(grid, cols, rows, x + offsetX, y + offsetY)
  }
}

function seedGrid(grid: Uint8Array, cols: number, rows: number, seed: number) {
  grid.fill(0)

  const random = createRandom(seed ^ (cols * 73856093) ^ (rows * 19349663))
  const activeCols = Math.max(1, Math.floor(cols * 0.68))

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < activeCols; x += 1) {
      const drift = Math.sin(x * 0.23 + y * 0.17) + Math.cos(x * 0.11 - y * 0.19)
      const edgeFade = 1 - Math.max(0, x / activeCols - 0.78) * 2.8
      const threshold = Math.max(0, 0.12 + Math.max(0, drift) * 0.028) * edgeFade

      if (random() < threshold) {
        setCell(grid, cols, rows, x, y)
      }
    }
  }

  const patternAnchors = [
    [0.08, 0.14, GLIDER],
    [0.22, 0.24, TOAD],
    [0.42, 0.2, BEACON],
    [0.54, 0.38, GLIDER],
    [0.14, 0.56, BEACON],
    [0.34, 0.7, TOAD],
    [0.58, 0.82, GLIDER],
  ] as const

  for (const [x, y, pattern] of patternAnchors) {
    stampPattern(grid, cols, rows, pattern, Math.floor(activeCols * x), Math.floor(rows * y))
  }
}

function stepGrid(grid: Uint8Array, next: Uint8Array, cols: number, rows: number) {
  for (let y = 0; y < rows; y += 1) {
    const above = ((y + rows - 1) % rows) * cols
    const current = y * cols
    const below = ((y + 1) % rows) * cols

    for (let x = 0; x < cols; x += 1) {
      const left = (x + cols - 1) % cols
      const right = (x + 1) % cols
      const index = current + x
      const neighbors =
        grid[above + left] +
        grid[above + x] +
        grid[above + right] +
        grid[current + left] +
        grid[current + right] +
        grid[below + left] +
        grid[below + x] +
        grid[below + right]

      next[index] = neighbors === 3 || (grid[index] === 1 && neighbors === 2) ? 1 : 0
    }
  }
}

export function LifeField() {
  const rootRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const root = rootRef.current
    const canvas = canvasRef.current

    if (!root || !canvas) return

    const context = canvas.getContext('2d')

    if (!context) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const seed = window.crypto.getRandomValues(new Uint32Array(1))[0]
    let animationFrame = 0
    let cols = 1
    let rows = 1
    let width = 1
    let height = 1
    let lastStep = 0
    let running = false
    let grid = new Uint8Array(1)
    let next = new Uint8Array(1)
    let heat = new Float32Array(1)

    const draw = () => {
      const styles = getComputedStyle(root)
      const ink = styles.getPropertyValue('--ink').trim() || '#1b1318'
      const accent = styles.getPropertyValue('--accent').trim() || '#853957'
      const rule = styles.getPropertyValue('--rule').trim() || '#cdb9c4'

      context.clearRect(0, 0, width, height)
      context.fillStyle = rule
      context.globalAlpha = 0.1

      for (let y = 0; y < rows; y += 2) {
        for (let x = 0; x < cols; x += 2) {
          context.fillRect(x * CELL_SIZE + CELL_SIZE * 0.48, y * CELL_SIZE + CELL_SIZE * 0.48, 1, 1)
        }
      }

      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const index = y * cols + x
          const glow = heat[index]

          if (glow <= 0.05) continue

          const alive = grid[index] === 1
          const size = Math.max(1.4, CELL_SIZE * (alive ? 0.3 : 0.22) * glow)
          const inset = (CELL_SIZE - size) / 2

          const accentCell = alive && (x * 7 + y * 13) % 9 < 3

          context.fillStyle = accentCell ? accent : ink
          context.globalAlpha = alive
            ? accentCell
              ? 0.16 + glow * 0.16
              : 0.11 + glow * 0.1
            : glow * 0.048
          context.fillRect(x * CELL_SIZE + inset, y * CELL_SIZE + inset, size, size)
        }
      }

      context.globalAlpha = 1
    }

    const step = () => {
      stepGrid(grid, next, cols, rows)

      const previous = grid
      grid = next
      next = previous

      for (let index = 0; index < heat.length; index += 1) {
        heat[index] = grid[index] === 1 ? Math.min(1, heat[index] + 0.42) : heat[index] * 0.76
      }
    }

    const tick = (time: number) => {
      if (!running) return

      if (time - lastStep >= FRAME_INTERVAL) {
        step()
        draw()
        lastStep = time
      }

      animationFrame = window.requestAnimationFrame(tick)
    }

    const stop = () => {
      running = false
      window.cancelAnimationFrame(animationFrame)
    }

    const start = () => {
      if (running || reduceMotion.matches || document.visibilityState === 'hidden') {
        return
      }

      running = true
      lastStep = 0
      animationFrame = window.requestAnimationFrame(tick)
    }

    const syncRuntime = () => {
      if (reduceMotion.matches || document.visibilityState === 'hidden') {
        stop()
        draw()
        return
      }

      start()
    }

    const resize = () => {
      const rect = root.getBoundingClientRect()
      const ratio = Math.min(window.devicePixelRatio || 1, 2)

      width = Math.max(1, Math.floor(rect.width))
      height = Math.max(1, Math.floor(rect.height))
      cols = Math.max(1, Math.ceil(width / CELL_SIZE))
      rows = Math.max(1, Math.ceil(height / CELL_SIZE))
      canvas.width = Math.floor(width * ratio)
      canvas.height = Math.floor(height * ratio)
      context.setTransform(ratio, 0, 0, ratio, 0, 0)

      grid = new Uint8Array(cols * rows)
      next = new Uint8Array(cols * rows)
      heat = new Float32Array(cols * rows)
      seedGrid(grid, cols, rows, seed)

      for (let generation = 0; generation < WARMUP_GENERATIONS; generation += 1) {
        stepGrid(grid, next, cols, rows)

        const previous = grid
        grid = next
        next = previous
      }

      for (let index = 0; index < grid.length; index += 1) {
        heat[index] = grid[index]
      }

      draw()
    }

    const observer = new ResizeObserver(resize)
    const themeObserver = new MutationObserver(draw)

    resize()
    syncRuntime()
    observer.observe(root)
    themeObserver.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })
    document.addEventListener('visibilitychange', syncRuntime)
    reduceMotion.addEventListener('change', syncRuntime)

    return () => {
      stop()
      observer.disconnect()
      themeObserver.disconnect()
      document.removeEventListener('visibilitychange', syncRuntime)
      reduceMotion.removeEventListener('change', syncRuntime)
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 z-0 size-full [mask-image:linear-gradient(90deg,#000_0_62%,transparent_82%)] [-webkit-mask-image:linear-gradient(90deg,#000_0_62%,transparent_82%)]"
      aria-hidden="true"
    >
      <canvas className="absolute inset-0 size-full" ref={canvasRef} />
    </div>
  )
}
