import type { PointerEvent } from 'react'

// Pointer-driven accent sweep + tilt shared by the home detail cards
// (src/routes/index.tsx) and the project cards (src/components/ProjectCard.tsx).
//
// It drives CSS custom properties the consuming element's `before:` gradient
// reads: `--hover-x` (sweep position), `--hover-tilt` (sweep angle, follows
// pointer velocity), and `--hover-color-strength` (sweep intensity). A rAF loop
// eases the live values toward their targets for a trailing feel. Honors
// prefers-reduced-motion by skipping the animation entirely.
//
// Handlers are typed against HTMLElement so the returned object spreads onto any
// element (div, etc.) without per-call-site typing.

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

function setHoverPosition(el: HTMLElement, x: number) {
  el.style.setProperty('--hover-x', `${x}px`)
  el.style.setProperty('--hover-target-x', `${x}`)
  el.style.setProperty('--hover-tilt', '2deg')
  el.style.setProperty('--hover-target-tilt', '2')
  el.style.setProperty('--hover-color-strength', '1')
  el.style.setProperty('--hover-target-color-strength', '1')
  el.dataset.hoverLastX = String(x)
  el.dataset.hoverLastTime = String(performance.now())
  el.dataset.hoverVelocity = '0'
}

// EMA blend applied to the raw pointer velocity before it drives the tilt
// target. Lower = smoother/laggier angle response (eases direction flips through
// zero instead of snapping). The rAF loop below then eases the live tilt toward
// that already-smoothed target.
const VELOCITY_SMOOTHING = 0.08

function handlePointerEnter(event: PointerEvent<HTMLElement>) {
  if (prefersReducedMotion()) return
  const rect = event.currentTarget.getBoundingClientRect()
  setHoverPosition(event.currentTarget, event.clientX - rect.left)
}

function handlePointerMove(event: PointerEvent<HTMLElement>) {
  if (prefersReducedMotion()) return
  const el = event.currentTarget
  const rect = el.getBoundingClientRect()
  const targetX = event.clientX - rect.left
  const now = performance.now()

  if (!el.dataset.hoverLastX) {
    setHoverPosition(el, targetX)
    return
  }

  const lastX = Number.parseFloat(el.dataset.hoverLastX || `${targetX}`)
  const lastTime = Number.parseFloat(el.dataset.hoverLastTime || `${now}`)
  const elapsed = Math.max(now - lastTime, 1)
  const rawVelocity = (targetX - lastX) / elapsed
  const previousVelocity = Number.parseFloat(el.dataset.hoverVelocity || '0')
  const velocity = previousVelocity + (rawVelocity - previousVelocity) * VELOCITY_SMOOTHING
  el.dataset.hoverVelocity = String(velocity)
  const direction = velocity < 0 ? -1 : 1
  const movementStrength = Math.abs(velocity)
  const tilt = direction * Math.min(12, Math.max(2, movementStrength * 42))
  const colorStrength = Math.min(1.12, Math.max(0.82, 0.84 + movementStrength * 0.38))
  const currentX = Number.parseFloat(el.style.getPropertyValue('--hover-x')) || targetX

  el.style.setProperty('--hover-target-x', `${targetX}`)
  el.style.setProperty('--hover-target-tilt', `${tilt}`)
  el.style.setProperty('--hover-target-color-strength', `${colorStrength}`)
  el.dataset.hoverLastX = String(targetX)
  el.dataset.hoverLastTime = String(now)

  if (el.dataset.hoverFrame) return

  function followPointer() {
    const latestTargetX = Number.parseFloat(el.style.getPropertyValue('--hover-target-x'))
    const latestX = Number.parseFloat(el.style.getPropertyValue('--hover-x')) || currentX
    const latestTargetTilt = Number.parseFloat(el.style.getPropertyValue('--hover-target-tilt'))
    const latestTilt =
      Number.parseFloat(el.style.getPropertyValue('--hover-tilt')) || latestTargetTilt
    const latestTargetColorStrength = Number.parseFloat(
      el.style.getPropertyValue('--hover-target-color-strength')
    )
    const latestColorStrength =
      Number.parseFloat(el.style.getPropertyValue('--hover-color-strength')) ||
      latestTargetColorStrength
    const nextX = latestX + (latestTargetX - latestX) * 0.11
    const nextTilt = latestTilt + (latestTargetTilt - latestTilt) * 0.12
    const nextColorStrength =
      latestColorStrength + (latestTargetColorStrength - latestColorStrength) * 0.12

    el.style.setProperty('--hover-x', `${nextX}px`)
    el.style.setProperty('--hover-tilt', `${nextTilt}deg`)
    el.style.setProperty('--hover-color-strength', `${nextColorStrength}`)

    if (
      Math.abs(latestTargetX - nextX) < 0.5 &&
      Math.abs(latestTargetTilt - nextTilt) < 0.1 &&
      Math.abs(latestTargetColorStrength - nextColorStrength) < 0.01
    ) {
      delete el.dataset.hoverFrame
      return
    }

    el.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
  }

  el.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
}

function handlePointerLeave(event: PointerEvent<HTMLElement>) {
  const el = event.currentTarget

  if (el.dataset.hoverFrame) {
    cancelAnimationFrame(Number(el.dataset.hoverFrame))
    delete el.dataset.hoverFrame
  }

  delete el.dataset.hoverLastX
  delete el.dataset.hoverLastTime
  delete el.dataset.hoverVelocity
}

/** Returns pointer handlers to spread onto an element for the accent-sweep effect. */
export function usePointerSweep() {
  return {
    onPointerEnter: handlePointerEnter,
    onPointerMove: handlePointerMove,
    onPointerLeave: handlePointerLeave,
  }
}
