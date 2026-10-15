import { createFileRoute, Outlet } from '@tanstack/react-router'
import { fontPreload } from '../lib/font-preload'

export const Route = createFileRoute('/blog')({
  head: () => ({
    links: [fontPreload('/PPNeueMontreal-Variable.woff2')],
  }),
  component: () => <Outlet />,
})
