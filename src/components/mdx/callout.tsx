import type { ReactNode } from 'react'

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="font-mono my-6 border border-blog-rule bg-blog-hover px-5 py-4 text-blog-text">
      {children}
    </aside>
  )
}
