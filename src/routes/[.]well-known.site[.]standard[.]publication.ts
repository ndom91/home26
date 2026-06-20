import { createFileRoute } from '@tanstack/react-router'
import { standardSitePublicationUri } from '../lib/standard-site.generated'

export const Route = createFileRoute('/.well-known/site.standard.publication')({
  server: {
    handlers: {
      GET: () => {
        if (!standardSitePublicationUri) {
          return new Response('Standard.site publication is not configured', { status: 500 })
        }

        return new Response(`${standardSitePublicationUri}\n`, {
          headers: {
            'Cache-Control': 'public, max-age=300',
            'Content-Type': 'text/plain; charset=utf-8',
          },
        })
      },
    },
  },
})
