const footerLinks = [
  ['GH', 'https://github.com/ndom91'],
  ['BS', 'https://bsky.app/ndom91'],
  ['ML', 'mailto:home@ndo.dev'],
] as const

const footerVariants = {
  default: {
    border: 'border-rule',
    label: 'text-[0.62rem] uppercase tracking-[0.2em] text-muted',
    link: 'text-[0.62rem] uppercase tracking-[0.2em] text-muted transition-colors hover:text-accent',
  },
  blog: {
    border: 'border-blog-rule',
    label: 'font-mono text-[9px] uppercase tracking-widest text-blog-faint',
    link: 'font-mono text-[10px] uppercase tracking-widest text-blog-muted transition-colors hover:text-blog-accent',
  },
} as const

type SiteFooterProps = {
  variant?: keyof typeof footerVariants
}

export function SiteFooter({ variant = 'default' }: SiteFooterProps) {
  const classes = footerVariants[variant]

  return (
    <footer className={`grid grid-cols-[1fr_auto] border-t ${classes.border}`}>
      <div className={`border-r px-6 py-5 ${classes.border}`}>
        <p className={classes.label}>NDO.DEV</p>
      </div>
      <div className="flex items-center gap-5 px-6 py-5">
        {footerLinks.map(([label, href]) => (
          <a key={label} href={href} className={classes.link}>
            {label}
          </a>
        ))}
      </div>
    </footer>
  )
}
