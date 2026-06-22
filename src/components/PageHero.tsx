import type { ReactNode } from 'react'

type PageHeroProps = {
  description: string
  eyebrow: ReactNode
  meta: ReactNode
  title: string
}

export function PageHero({ description, eyebrow, meta, title }: PageHeroProps) {
  return (
    <div
      className={`relative isolate overflow-hidden border-b px-6 py-12 sm:py-16 border-rule bg-[radial-gradient(circle_at_82%_0%,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_34%),linear-gradient(225deg,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent_48%)]`}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-(image:--grit-image) bg-size-[220px_220px] bg-repeat opacity-[0.5] dark:opacity-[0.20] mix-blend-overlay"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-7xl">
        {eyebrow}
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <h1 className="text-balance font-heading min-w-0 text-[clamp(7rem,15vw,13rem)] font-extrabold uppercase leading-35 tracking-[-0.375px] text-blog-text">
            {title}
          </h1>
          <div className={`border-l pl-4 lg:pb-3 border-rule`}>
            <p className={`text-pretty text-xs leading-6 text-muted`}>{description}</p>
            <p
              className={`mt-4 font-bold text-[0.66rem] tabular-nums uppercase tracking-[0.2em] text-muted`}
            >
              {meta}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
