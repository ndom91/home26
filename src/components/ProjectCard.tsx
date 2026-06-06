import { BookOpen, ExternalLink, Github, Star } from 'lucide-react'
import type { PointerEvent } from 'react'
import type { Project, ProjectStatus } from '../lib/projects'

// Brutalist flair lifted from the home detail cards (src/routes/index.tsx):
// an accent light-sweep (`before:`) whose angle/strength follow the pointer, and
// a grit texture overlay (`after:`) that fades in on hover. Theming vars
// (`--grit-image`, `--grit-opacity`, `--globe-accent`) come from src/styles.css.
const cardFlairClass =
  "group relative flex h-full flex-col overflow-hidden bg-paper [--detail-accent:var(--globe-accent)] [--hover-color-strength:1] [--hover-tilt:2.5deg] [--hover-x:50%] before:pointer-events-none before:absolute before:inset-y-[-30%] before:left-0 before:w-[min(32rem,160%)] before:bg-[linear-gradient(90deg,transparent,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_22%,rgb(var(--detail-accent)/calc(0.16*var(--hover-color-strength)))_50%,rgb(var(--detail-accent)/calc(0.034*var(--hover-color-strength)))_78%,transparent)] before:content-[''] before:opacity-0 before:blur-[8px] before:transition-opacity before:duration-500 before:translate-x-[calc(var(--hover-x)-50%)] before:rotate-[var(--hover-tilt)] after:pointer-events-none after:absolute after:inset-0 after:bg-[image:var(--grit-image)] after:bg-[length:180px_180px] after:bg-repeat after:content-[''] after:opacity-0 after:transition-opacity after:duration-500 hover:before:opacity-100 hover:before:duration-180 hover:after:opacity-[var(--grit-opacity)] hover:after:duration-180"

const statusStyles: Record<ProjectStatus, { dot: string; label: string }> = {
  live: { dot: 'bg-emerald-500', label: 'Live' },
  wip: { dot: 'bg-amber-500', label: 'WIP' },
  archived: { dot: 'bg-[rgb(var(--globe-accent))] opacity-50', label: 'Archived' },
}

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export function ProjectCard({ project }: { project: Project }) {
  const status = statusStyles[project.status]
  const titleHref = project.demo ?? project.repo

  function setHoverPosition(card: HTMLDivElement, x: number) {
    card.style.setProperty('--hover-x', `${x}px`)
    card.style.setProperty('--hover-target-x', `${x}`)
    card.style.setProperty('--hover-tilt', '2deg')
    card.style.setProperty('--hover-target-tilt', '2')
    card.style.setProperty('--hover-color-strength', '1')
    card.style.setProperty('--hover-target-color-strength', '1')
    card.dataset.hoverLastX = String(x)
    card.dataset.hoverLastTime = String(performance.now())
  }

  function handlePointerEnter(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion()) return
    const rect = event.currentTarget.getBoundingClientRect()
    setHoverPosition(event.currentTarget, event.clientX - rect.left)
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion()) return
    const card = event.currentTarget
    const rect = card.getBoundingClientRect()
    const targetX = event.clientX - rect.left
    const now = performance.now()

    if (!card.dataset.hoverLastX) {
      setHoverPosition(card, targetX)
      return
    }

    const lastX = Number.parseFloat(card.dataset.hoverLastX || `${targetX}`)
    const lastTime = Number.parseFloat(card.dataset.hoverLastTime || `${now}`)
    const elapsed = Math.max(now - lastTime, 1)
    const velocity = (targetX - lastX) / elapsed
    const direction = velocity < 0 ? -1 : 1
    const movementStrength = Math.abs(velocity)
    const tilt = direction * Math.min(8, Math.max(2, movementStrength * 32))
    const colorStrength = Math.min(1.12, Math.max(0.82, 0.84 + movementStrength * 0.38))
    const currentX = Number.parseFloat(card.style.getPropertyValue('--hover-x')) || targetX

    card.style.setProperty('--hover-target-x', `${targetX}`)
    card.style.setProperty('--hover-target-tilt', `${tilt}`)
    card.style.setProperty('--hover-target-color-strength', `${colorStrength}`)
    card.dataset.hoverLastX = String(targetX)
    card.dataset.hoverLastTime = String(now)

    if (card.dataset.hoverFrame) return

    function followPointer() {
      const latestTargetX = Number.parseFloat(card.style.getPropertyValue('--hover-target-x'))
      const latestX = Number.parseFloat(card.style.getPropertyValue('--hover-x')) || currentX
      const latestTargetTilt = Number.parseFloat(card.style.getPropertyValue('--hover-target-tilt'))
      const latestTilt =
        Number.parseFloat(card.style.getPropertyValue('--hover-tilt')) || latestTargetTilt
      const latestTargetColorStrength = Number.parseFloat(
        card.style.getPropertyValue('--hover-target-color-strength')
      )
      const latestColorStrength =
        Number.parseFloat(card.style.getPropertyValue('--hover-color-strength')) ||
        latestTargetColorStrength
      const nextX = latestX + (latestTargetX - latestX) * 0.11
      const nextTilt = latestTilt + (latestTargetTilt - latestTilt) * 0.18
      const nextColorStrength =
        latestColorStrength + (latestTargetColorStrength - latestColorStrength) * 0.12

      card.style.setProperty('--hover-x', `${nextX}px`)
      card.style.setProperty('--hover-tilt', `${nextTilt}deg`)
      card.style.setProperty('--hover-color-strength', `${nextColorStrength}`)

      if (
        Math.abs(latestTargetX - nextX) < 0.5 &&
        Math.abs(latestTargetTilt - nextTilt) < 0.1 &&
        Math.abs(latestTargetColorStrength - nextColorStrength) < 0.01
      ) {
        delete card.dataset.hoverFrame
        return
      }

      card.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
    }

    card.dataset.hoverFrame = String(requestAnimationFrame(followPointer))
  }

  function handlePointerLeave(event: PointerEvent<HTMLDivElement>) {
    const card = event.currentTarget

    if (card.dataset.hoverFrame) {
      cancelAnimationFrame(Number(card.dataset.hoverFrame))
      delete card.dataset.hoverFrame
    }

    delete card.dataset.hoverLastX
    delete card.dataset.hoverLastTime
  }

  return (
    <div
      className={cardFlairClass}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {project.image ? (
        <div className="relative z-[1] overflow-hidden border-b border-rule">
          <img
            src={project.image}
            alt=""
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <div className="relative z-[1] flex flex-1 flex-col p-[1.15rem] max-[520px]:p-4">
        <div className="mb-3 flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-muted">
          <span className={`size-2 rounded-full ${status.dot}`} aria-hidden="true" />
          <span>{status.label}</span>
        </div>

        <h2 className="font-logo text-[clamp(1.5rem,2.4vw,2.1rem)] font-bold uppercase leading-[0.92] -tracking-wider">
          {titleHref ? (
            <a
              href={titleHref}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-accent"
            >
              {project.title}
            </a>
          ) : (
            project.title
          )}
        </h2>

        <p className="mt-3 text-[0.92rem] leading-6 text-muted">{project.blurb}</p>

        {project.tags.length > 0 ? (
          <div className="mt-4 mb-5 flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="border border-rule px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.16em] text-muted transition-colors group-hover:border-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <div className="mt-auto flex items-center gap-3 border-t border-rule pt-3 text-ink">
          {project.repo ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} repository`}
              className="grid size-8 place-items-center border border-rule transition-colors hover:border-accent hover:text-accent"
            >
              <Github className="size-4" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : null}
          {project.demo ? (
            <a
              href={project.demo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} live demo`}
              className="grid size-8 place-items-center border border-rule transition-colors hover:border-accent hover:text-accent"
            >
              <ExternalLink className="size-4" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : null}
          {project.docs ? (
            <a
              href={project.docs}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} documentation`}
              className="grid size-8 place-items-center border border-rule transition-colors hover:border-accent hover:text-accent"
            >
              <BookOpen className="size-4" strokeWidth={2} aria-hidden="true" />
            </a>
          ) : null}
          {project.stars !== undefined ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} GitHub stars: ${project.stars}`}
              className="ml-auto flex items-center gap-1.5 text-[0.72rem] tabular-nums text-muted transition-colors hover:text-accent"
            >
              <Star className="size-3.5" strokeWidth={2} aria-hidden="true" />
              {project.stars.toLocaleString('en-US')}
            </a>
          ) : null}
        </div>
      </div>
    </div>
  )
}
