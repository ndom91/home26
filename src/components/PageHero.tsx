import type { ReactNode } from 'react'

const heroVariants = {
  default: {
    background:
      'border-rule bg-[radial-gradient(circle_at_82%_0%,color-mix(in_oklab,var(--color-accent)_22%,transparent),transparent_34%),linear-gradient(225deg,color-mix(in_oklab,var(--color-accent)_12%,transparent),transparent_48%)]',
    divider: 'border-rule',
    description: 'text-muted',
    panelPadding: 'lg:pb-3',
    meta: 'text-[0.66rem] uppercase tracking-[0.2em] text-muted',
  },
  blog: {
    background:
      'border-blog-rule bg-[radial-gradient(circle_at_18%_0%,color-mix(in_oklab,var(--color-blog-accent)_22%,transparent),transparent_34%),linear-gradient(135deg,color-mix(in_oklab,var(--color-blog-accent)_12%,transparent),transparent_48%)]',
    divider: 'border-blog-rule',
    description: 'text-blog-description',
    panelPadding: 'lg:pb-4',
    meta: 'font-mono text-[10px] uppercase tracking-widest text-blog-muted',
  },
} as const

type PageHeroProps = {
  description: string
  eyebrow: ReactNode
  meta: ReactNode
  title: string
  variant?: keyof typeof heroVariants
}

export function PageHero({
  description,
  eyebrow,
  meta,
  title,
  variant = 'default',
}: PageHeroProps) {
  const classes = heroVariants[variant]

  return (
    <div
      className={`relative isolate overflow-hidden border-b px-6 py-12 sm:py-16 ${classes.background}`}
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
          <div className={`border-l pl-4 ${classes.panelPadding} ${classes.divider}`}>
            <p className={`font-reading text-sm leading-6 ${classes.description}`}>{description}</p>
            <p className={`mt-4 ${classes.meta}`}>{meta}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
