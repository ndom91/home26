import { useEffect, useRef, useState } from 'react'

const actionClassName =
  'inline-flex items-baseline gap-2 py-1 text-left text-blog-muted transition-colors hover:text-blog-accent focus-visible:outline-2 focus-visible:outline-blog-accent motion-reduce:transition-none'

export function PostShare({
  title,
  url,
  className,
}: {
  title: string
  url: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const encodedUrl = encodeURIComponent(url)
  const links = [
    { label: 'X.com', href: `https://x.com/intent/post?url=${encodedUrl}` },
    {
      label: 'Bluesky',
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${title}\n${url}`)}`,
    },
    {
      label: 'LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    { label: 'Email', href: `mailto:?subject=${encodeURIComponent(title)}&body=${encodedUrl}` },
  ]

  useEffect(() => () => clearTimeout(resetTimer.current), [])

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      clearTimeout(resetTimer.current)
      setCopyError(false)
      setCopied(true)
      resetTimer.current = setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopyError(true)
    }
  }

  return (
    <section aria-label="Share this post" className={`shrink-0 font-mono ${className ?? ''}`}>
      <h2 className="mb-2 text-xs uppercase tracking-[0.28em] text-blog-muted">Share</h2>
      <ul className="text-sm leading-5">
        {links.map(({ label, href }) => (
          <li key={label}>
            <a
              href={href}
              target={label === 'Email' ? undefined : '_blank'}
              rel={label === 'Email' ? undefined : 'noopener noreferrer'}
              className={actionClassName}
            >
              <span aria-hidden="true" className="text-blog-faint">
                └
              </span>
              {label}
            </a>
          </li>
        ))}
        <li>
          <button type="button" onClick={copyUrl} className={actionClassName}>
            <span aria-hidden="true" className="text-blog-faint">
              └
            </span>
            {copied ? 'Copied ✓' : 'Copy URL'}
          </button>
        </li>
      </ul>
      <p role="status" className={copyError ? 'mt-2 text-sm text-blog-muted' : 'sr-only'}>
        {copyError ? 'Could not copy. Please try again.' : copied ? 'Copied to clipboard.' : ''}
      </p>
    </section>
  )
}
