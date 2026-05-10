import type { ReactNode } from 'react'

export function Callout({ children }: { children: ReactNode }) {
  return (
    <aside
      className="font-mono my-6 border px-5 py-4 text-[#ede8df]"
      style={{ borderColor: '#242220', background: '#111009' }}
    >
      {children}
    </aside>
  )
}
