import { useEffect, useRef } from 'react'

type Domino = {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  spin: number
  size: number
  seed: number
  topValue: number
  bottomValue: number
}

const DOMINO_COUNT = 88
const MOTION_SCALE = 0.22

function randomFromSeed(seed: number) {
  const value = Math.sin(seed) * 10000

  return value - Math.floor(value)
}

export function DominoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current

    if (!canvas) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    const pointer = { x: -1000, y: -1000 }
    const dominoes: Domino[] = Array.from({ length: DOMINO_COUNT }, (_, index) => ({
      x: randomFromSeed(index * 41.13 + 17.7),
      y: randomFromSeed(index * 83.91 + 3.4),
      vx: (((index * 37) % 100) - 50) * 0.000001,
      vy: (((index * 61) % 100) - 50) * 0.000001,
      angle: randomFromSeed(index * 29.17 + 9.2) * Math.PI * 2,
      spin: (index % 2 === 0 ? 1 : -1) * (0.00001 + (index % 5) * 0.000002),
      size: 0.49 + randomFromSeed(index * 2.37 + 5.1) * 0.4,
      seed: index * 10.91,
      topValue: Math.floor(randomFromSeed(index * 7.13 + 2.8) * 6),
      bottomValue: Math.floor(randomFromSeed(index * 11.73 + 6.2) * 6),
    }))
    let animationFrame = 0
    let width = 0
    let height = 0
    let pixelRatio = 1

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      width = rect.width
      height = rect.height
      canvas.width = Math.max(1, Math.floor(width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(height * pixelRatio))
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const drawPips = (value: number, tileWidth: number, tileHeight: number, yOffset: number) => {
      const xOffset = tileWidth * 0.22
      const yUnit = tileHeight * 0.12
      const positions: Record<number, Array<[number, number]>> = {
        0: [],
        1: [[0, 0]],
        2: [
          [-xOffset, -yUnit],
          [xOffset, yUnit],
        ],
        3: [
          [-xOffset, -yUnit],
          [0, 0],
          [xOffset, yUnit],
        ],
        4: [
          [-xOffset, -yUnit],
          [xOffset, -yUnit],
          [-xOffset, yUnit],
          [xOffset, yUnit],
        ],
        5: [
          [-xOffset, -yUnit],
          [xOffset, -yUnit],
          [0, 0],
          [-xOffset, yUnit],
          [xOffset, yUnit],
        ],
        6: [
          [-xOffset, -yUnit],
          [xOffset, -yUnit],
          [-xOffset, 0],
          [xOffset, 0],
          [-xOffset, yUnit],
          [xOffset, yUnit],
        ],
      }

      for (const [x, y] of positions[value]) {
        context.beginPath()
        context.arc(x, y + yOffset, Math.max(1, tileWidth * 0.09), 0, Math.PI * 2)
        context.fill()
      }
    }

    const drawDomino = (domino: Domino, time: number, delta: number) => {
      const x = domino.x * width
      const y = domino.y * height
      const dx = pointer.x - x
      const dy = pointer.y - y
      const distance = Math.hypot(dx, dy)
      const influence = Math.max(0, 1 - distance / 180)
      const tileWidth = 16 * domino.size
      const tileHeight = 42 * domino.size
      const seconds = time * 0.001
      const driftX = Math.cos(seconds * 0.045 + domino.seed) * 0.00000032 * delta
      const driftY = Math.sin(seconds * 0.038 + domino.seed * 1.7) * 0.00000032 * delta

      domino.vx += driftX + (dx / Math.max(distance, 1)) * influence * -0.000003 * delta
      domino.vy += driftY + (dy / Math.max(distance, 1)) * influence * -0.000003 * delta
      domino.vx *= 0.996
      domino.vy *= 0.996
      domino.x = (domino.x + domino.vx * MOTION_SCALE + 1) % 1
      domino.y = (domino.y + domino.vy * MOTION_SCALE + 1) % 1
      domino.angle += (domino.spin + influence * 0.00012) * delta * MOTION_SCALE

      context.save()
      context.translate(x, y)
      context.rotate(domino.angle)
      context.strokeStyle = influence > 0 ? 'rgba(200, 255, 0, 0.5)' : 'rgba(237, 232, 223, 0.1)'
      context.fillStyle = 'rgba(13, 12, 10, 0.1)'
      context.lineWidth = 1
      context.beginPath()
      context.roundRect(-tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight, 2)
      context.fill()
      context.stroke()
      context.beginPath()
      context.moveTo(-tileWidth / 2 + 3, 0)
      context.lineTo(tileWidth / 2 - 3, 0)
      context.stroke()

      context.fillStyle = influence > 0 ? 'rgba(200, 255, 0, 0.75)' : 'rgba(237, 232, 223, 0.05)'
      drawPips(domino.topValue, tileWidth, tileHeight, -tileHeight * 0.25)
      drawPips(domino.bottomValue, tileWidth, tileHeight, tileHeight * 0.25)

      context.restore()
    }

    let previousTime = 0

    const draw = (time: number) => {
      const delta = Math.min(32, time - previousTime || 16)

      previousTime = time
      context.clearRect(0, 0, width, height)
      context.fillStyle = 'rgba(13, 12, 10, 0.12)'
      context.fillRect(0, 0, width, height)

      for (const domino of dominoes) {
        drawDomino(domino, time, delta)
      }

      animationFrame = window.requestAnimationFrame(draw)
    }

    const onPointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect()
      pointer.x = event.clientX - rect.left
      pointer.y = event.clientY - rect.top
    }

    const onPointerLeave = () => {
      pointer.x = -1000
      pointer.y = -1000
    }

    resize()
    animationFrame = window.requestAnimationFrame(draw)
    window.addEventListener('resize', resize)
    const pointerTarget = canvas.parentElement ?? canvas

    pointerTarget.addEventListener('pointermove', onPointerMove)
    pointerTarget.addEventListener('pointerleave', onPointerLeave)

    return () => {
      window.cancelAnimationFrame(animationFrame)
      window.removeEventListener('resize', resize)
      pointerTarget.removeEventListener('pointermove', onPointerMove)
      pointerTarget.removeEventListener('pointerleave', onPointerLeave)
    }
  }, [])

  return <canvas ref={canvasRef} className="domino-canvas" />
}
