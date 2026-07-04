const footerLinks = [
  ['GH', 'https://github.com/ndom91'],
  ['BS', 'https://bsky.app/ndom91'],
  ['ML', 'mailto:home@ndo.dev'],
] as const

const footerVariants = {
  default: {
    surface: 'relative z-1 bg-paper',
    border: 'border-rule',
    label: 'text-[0.62rem] uppercase tracking-[0.2em] text-muted',
    link: 'inline-flex min-h-10 items-center text-[0.62rem] uppercase tracking-[0.2em] text-muted transition-[color,scale] hover:text-accent active:scale-[0.96] motion-reduce:transition-none',
  },
  blog: {
    surface: '',
    border: 'border-blog-rule',
    label: 'font-mono text-[9px] uppercase tracking-widest text-blog-faint',
    link: 'font-mono inline-flex items-center py-1 text-[10px] leading-none uppercase tracking-widest text-blog-muted transition-[color,scale] hover:text-blog-accent active:scale-[0.96] motion-reduce:transition-none',
  },
} as const

type SiteFooterProps = {
  variant?: keyof typeof footerVariants
}

export function SiteFooter({ variant = 'default' }: SiteFooterProps) {
  const classes = footerVariants[variant]

  return (
    <footer className={`grid grid-cols-[1fr_auto] border-t ${classes.surface} ${classes.border}`}>
      <div className={`flex items-center border-r px-6 py-5 ${classes.border}`}>
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
