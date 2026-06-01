# home26

Personal portfolio and blog for [ndo.dev](https://ndo.dev/), built with TanStack Start and deployed to Cloudflare Workers.

## Stack

- TanStack Start and TanStack Router for the app and file-based routing.
- React 19 and Vite 8 for UI and builds.
- Tailwind CSS 4 for styling.
- Content Collections and MDX for bundled blog content.
- Shiki via `rehype-pretty-code` for build-time syntax highlighting.
- Cloudflare Vite plugin and Wrangler for Workers deployment.
- Biome for linting and formatting.

## Content

Blog posts live under `content/blog` as MDX. The content build generates typed post data before Vite builds the app.

Routes live in `src/routes`, with the public blog at `/blog` and posts at `/blog/$slug`.

## License

MIT
