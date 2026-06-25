import { TanStackDevtools } from '@tanstack/react-devtools'
import { createRootRoute, HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { personId, serializeJsonLd, siteLanguage, siteUrl, websiteId } from '../lib/structured-data'
import appCss from '../styles.css?url'

const websiteStructuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: 'ndom91',
      alternateName: ['ndo.dev', 'ndom91', '.domino'],
      description:
        "Nico's personal site and technical blog, a Berlin-based software engineer building web tools, developer systems, and open-source side projects.",
      inLanguage: siteLanguage,
      publisher: {
        '@id': personId,
      },
      image: {
        '@type': 'ImageObject',
        '@id': `${siteUrl}#website-image`,
        url: 'https://ndo.dev/web-app-manifest-512x512.png',
        caption: 'ndo.dev logo',
      },
    },
    {
      '@type': 'ProfilePage',
      '@id': `${siteUrl}#webpage`,
      url: siteUrl,
      isPartOf: {
        '@id': websiteId,
      },
      name: 'About Nico',
      inLanguage: siteLanguage,
      dateCreated: '2026-05-10T14:40:15.000Z',
      dateModified: '2026-06-15T17:58:06.000Z',
      mainEntity: {
        '@type': 'Person',
        '@id': personId,
        name: 'Nico',
        alternateName: ['ndom91', '.domino'],
        url: siteUrl,
        jobTitle: 'Software Engineer',
        sameAs: ['https://github.com/ndom91'],
      },
    },
  ],
} as const

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'color-scheme',
        content: 'light dark',
      },
      {
        title: 'ndom91',
      },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'icon', href: '/favicon-96x96.png', type: 'image/png', sizes: '96x96' },
      { rel: 'alternate icon', href: '/favicon.ico' },
      { rel: 'apple-touch-icon', href: '/apple-touch-icon.png', sizes: '180x180' },
      { rel: 'manifest', href: '/manifest.json' },
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      {
        rel: 'preload',
        href: '/manuka-bold.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'preload',
        href: '/PPNeueMontreal-Variable.woff2',
        as: 'font',
        type: 'font/woff2',
        crossOrigin: 'anonymous',
      },
      {
        rel: 'stylesheet',
        href: appCss,
      },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: serializeJsonLd(websiteStructuredData),
      },
    ],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `
{
  const theme = localStorage.getItem('theme');
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', theme);
  }
}
`,
          }}
        />
        {import.meta.env.PROD ? (
          <script
            src="https://stats.ndo.dev/api/script.js"
            data-site-id="1"
            defer
            fetchPriority="low"
          />
        ) : null}
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{
            position: 'bottom-right',
          }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}
