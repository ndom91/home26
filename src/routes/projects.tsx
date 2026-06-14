import { createFileRoute } from '@tanstack/react-router'
import { LinkScreenshotProvider } from '../components/mdx/link-screenshot-context'
import { ProjectCard } from '../components/ProjectCard'
import { SiteHeader } from '../components/SiteHeader'
import { linkScreenshotUrls } from '../lib/link-screenshots.generated'
import { getProjects } from '../lib/projects'

export const Route = createFileRoute('/projects')({
  head: () => ({
    meta: [{ title: 'Projects — ndom91' }],
  }),
  component: Projects,
})

const eyebrowBars = [
  'bg-accent-100',
  'bg-accent-300',
  'bg-accent-500',
  'bg-accent-700',
  'bg-accent-900',
]

function Projects() {
  // Computed in-component (not via loader): blurbs may be React elements, which
  // are not serializable as loader data. The list is static, bundled build-time
  // data, so it is identical on server render and client hydration.
  const projects = getProjects()

  return (
    <div className="flex min-h-dvh flex-col bg-paper font-body text-ink">
      <SiteHeader />

      <div className="border-b border-rule px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex text-accent mb-4" aria-hidden="true">
            {eyebrowBars.map((barClass) => (
              <span
                key={barClass}
                className={`block h-9 w-7 border-2 border-r-0 border-paper max-[520px]:h-6 max-[520px]:w-4 ${barClass}`}
              />
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
            <h1 className="text-balance font-heading min-w-0 text-[clamp(4rem,15vw,13rem)] font-extrabold uppercase leading-35 tracking-[-0.375px] text-blog-text">
              BUILD
            </h1>
            <div className="border-l border-rule pl-4 lg:pb-3">
              <p className="font-reading text-sm leading-6 text-muted">
                Some experiments survived contact with production. These are those — the tools, side
                quests, and libraries that earned a spot.
              </p>
              <p className="mt-4 text-[0.66rem] uppercase tracking-[0.2em] text-muted">
                {projects.length} {projects.length === 1 ? 'project' : 'projects'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 px-6 py-8 sm:py-10">
        {projects.length === 0 ? (
          <div className="mx-auto max-w-7xl py-10">
            <p className="text-xs uppercase tracking-[0.18em] text-muted">No projects yet</p>
          </div>
        ) : (
          <LinkScreenshotProvider urls={linkScreenshotUrls}>
            <div className="mx-auto grid max-w-7xl auto-rows-fr grid-cols-1 gap-px border border-rule bg-rule sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <div
                  key={project.title}
                  className={project.featured ? 'sm:col-span-2 xl:col-span-2' : ''}
                >
                  <ProjectCard project={project} />
                </div>
              ))}
            </div>
          </LinkScreenshotProvider>
        )}
      </div>

      <footer className="grid grid-cols-[1fr_auto] border-t border-rule">
        <div className="border-r border-rule px-6 py-5">
          <p className="text-[0.62rem] uppercase tracking-[0.2em] text-muted">NDO.DEV</p>
        </div>
        <div className="flex items-center gap-5 px-6 py-5">
          {(
            [
              ['GH', 'https://github.com/ndom91'],
              ['BS', 'https://bsky.app/ndom91'],
              ['ML', 'mailto:home@ndo.dev'],
            ] as const
          ).map(([label, href]) => (
            <a
              key={label}
              href={href}
              className="text-[0.62rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent"
            >
              {label}
            </a>
          ))}
        </div>
      </footer>
    </div>
  )
}
