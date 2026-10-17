import { BookOpen, ExternalLink, type LucideIcon, Star } from 'lucide-react'
import type { Project, ProjectStatus } from '../lib/projects'
import { usePointerSweep } from '../lib/use-pointer-sweep'
import { GitHub } from './GitHubLogo'
import { ProgressiveImage } from './ProgressiveImage'

const cardFlairClass =
  'group relative z-0 flex h-full flex-col bg-paper [--detail-accent:var(--globe-accent)] [--hover-color-strength:1] [--hover-tilt:2.5deg] [--hover-x:50%] hover:z-20 focus-within:z-20'

const cardFlairOverlayClass =
  'pointer-sweep pointer-events-none absolute inset-0 z-0 overflow-hidden [--sweep-inset:-30%] [--sweep-width:min(42rem,190%)] [--sweep-mid:0.12] [--sweep-peak:0.16]'

const statusStyles: Record<ProjectStatus, { dot: string; label: string }> = {
  live: { dot: 'bg-emerald-500', label: 'Live' },
  wip: { dot: 'bg-amber-500', label: 'WIP' },
  archived: { dot: 'bg-[rgb(var(--globe-accent))] opacity-50', label: 'Archived' },
}

const iconLinkClass =
  'grid size-10 place-items-center border border-rule transition-[border-color,color,scale] hover:border-accent hover:text-accent active:scale-[0.96] motion-reduce:transition-none'

export function ProjectCard({ project }: { project: Project }) {
  const status = statusStyles[project.status]
  const titleHref = project.demo ?? project.repo
  const pointerSweep = usePointerSweep()

  const iconLinks: { href: string; label: string; Icon: LucideIcon | typeof GitHub }[] = []
  if (project.repo)
    iconLinks.push({ href: project.repo, label: `${project.title} repository`, Icon: GitHub })
  if (project.demo)
    iconLinks.push({ href: project.demo, label: `${project.title} live demo`, Icon: ExternalLink })
  if (project.docs)
    iconLinks.push({ href: project.docs, label: `${project.title} documentation`, Icon: BookOpen })

  return (
    <div className={cardFlairClass} {...pointerSweep}>
      <div aria-hidden="true" className={cardFlairOverlayClass} />
      {project.image ? (
        <div className="relative z-1 overflow-hidden border-b border-rule">
          <ProgressiveImage
            src={project.image}
            alt=""
            className="image-outline aspect-16/10 w-full object-cover transition-transform duration-400 ease-smooth-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      <div className="relative z-1 flex flex-1 flex-col p-[1.15rem] max-[520px]:p-4">
        <div className="mb-3 flex items-center gap-2 text-[0.66rem] uppercase tracking-[0.18em] text-muted">
          <span className={`size-2 rounded-full ${status.dot}`} aria-hidden="true" />
          <span>{status.label}</span>
        </div>

        <h2 className="text-balance font-heading text-[clamp(2.25rem,10vw,3rem)] font-bold uppercase tracking-wide leading-[0.92]">
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

        <p className="mt-3 text-pretty font-reading text-[0.92rem] leading-6 text-muted">
          {project.blurb}
        </p>

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
          {iconLinks.map(({ href, label, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              className={iconLinkClass}
            >
              <Icon className="size-4" strokeWidth={2} aria-hidden="true" />
            </a>
          ))}
          {project.stars !== undefined ? (
            <a
              href={project.repo}
              target="_blank"
              rel="noreferrer"
              aria-label={`${project.title} GitHub stars: ${project.stars}`}
              className="ml-auto flex min-h-10 items-center gap-1.5 text-[0.72rem] tabular-nums text-muted transition-[color,scale] hover:text-accent active:scale-[0.96] motion-reduce:transition-none"
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
