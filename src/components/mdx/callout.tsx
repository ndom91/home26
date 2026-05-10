import type { ReactNode } from 'react'

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside className="my-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sky-950">
      {children}
    </aside>
  )
}
