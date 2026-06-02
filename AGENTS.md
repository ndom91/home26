# AGENTS.md

## Project Overview

This is the source for a personal portfolio and blog site for `ndo.dev`.

The app is built with TanStack Start, React, Vite, Tailwind CSS, MDX, and Content Collections. It deploys to Cloudflare Workers via the Cloudflare Vite plugin and Wrangler.

The site should stay static, lean, and fast. Blog content lives in this repository as MDX and is processed at build time; do not add runtime filesystem reads for blog content.

## Core Stack

- TanStack Start for the app/runtime framework.
- TanStack Router for file-based routing in `src/routes`.
- React 19 for UI.
- Vite 8 for build tooling.
- Tailwind CSS 4 for styling.
- Content Collections for typed build-time blog content.
- MDX for blog posts that can render React components.
- Valibot for content frontmatter validation.
- Shiki via `rehype-pretty-code` for build-time code block highlighting.
- Cloudflare Vite plugin and Wrangler for Workers deployment.
- Biome for formatting and linting.

## Important Paths

- `src/routes/` contains TanStack Router file routes.
- `src/routes/__root.tsx` defines the root HTML shell, global head links, and theme bootstrap script.
- `src/router.tsx` creates the TanStack Router instance.
- `content-collections.ts` defines the blog content schema, slug derivation, cover image imports, and MDX component imports.
- `src/lib/blog.ts` exposes sorted and filtered generated Content Collections posts.
- `content/blog/**/index.mdx` and `content/blog/*.mdx` contain blog posts.
- `src/components/mdx/` contains React components intended for MDX usage.
- `src/mdx-components.tsx` provides the MDX component mapping.
- `vite.config.ts` wires together Cloudflare, Content Collections, Tailwind, MDX, TanStack Start, React, and MDX rehype/remark plugins.
- `wrangler.jsonc` configures the Cloudflare Worker entrypoint and compatibility settings.
- `README.md` is intentionally concise and project-facing; keep operational details here in `AGENTS.md` if they are mainly for coding agents.

## Blog Content Model

Blog posts are MDX files under `content/blog`.

Each post should include frontmatter matching the schema in `content-collections.ts`:

```mdx
---
title: Post Title
description: Short summary used on index pages and metadata.
publishedAt: 2026-05-10
tags:
  - example
draft: false
cover:
  imageFile: ./cover.png
atprotoUri: at://did:plc:example/app.bsky.feed.post/example
---

# Post Body
```

Notes:

- `description`, `tags`, `draft`, `cover`, and `atprotoUri` are optional.
- `publishedAt` is preferred; legacy `date` is still accepted by the transform.
- If `description` is omitted, it is derived from the first suitable content paragraph.
- Slugs are derived from the file path. For example, `content/blog/macbook/index.mdx` becomes `/blog/macbook`; `content/blog/hello-mdx.mdx` becomes `/blog/hello-mdx`.
- Draft posts are filtered out by `getPublishedPosts()` and `getPublishedPost()`.
- Cover images are imported at build time through the `#content/*` import alias.

## MDX Pipeline

MDX is configured in `vite.config.ts` with:

- `remark-frontmatter` and `remark-mdx-frontmatter` for frontmatter handling.
- `remark-gfm` for GitHub-flavored Markdown.
- `rehype-slug` for heading IDs.
- `rehype-autolink-headings` for heading anchor links.
- `rehype-pretty-code` for Shiki-based code highlighting.
- `rehype-mdx-import-media` for media imports in MDX.

Content Collections generates typed post data before Vite builds. Posts are build-time bundled, not runtime filesystem-backed.

## Cloudflare Deployment

Deployment targets Cloudflare Workers, not Cloudflare Pages.

`wrangler.jsonc` currently configures:

- Worker name: `home26`.
- Entrypoint: `@tanstack/react-start/server-entry`.
- Compatibility flag: `nodejs_compat`.
- Observability enabled.

The Cloudflare project is linked to the GitHub repository for builds on changes. `pnpm deploy` remains the local manual deployment path.

TanStack Start prerendering is enabled in `vite.config.ts`. This is expected for the current static portfolio/blog shape: prerender emits initial static HTML, then React hydrates client-side interactions. Re-check prerendering if adding user-specific routes, per-request server data, or browser API access during render/loaders.

## Link Screenshot Previews

External MDX links can render screenshot previews through `/api/link-screenshot`, a TanStack Start server route backed by Cloudflare Browser Run and the `home26-link-screenshots` R2 bucket.

Notes:

- `LINK_SCREENSHOT_SIGNING_KEY` must be set in the build environment to generate signed screenshot URLs during Content Collections builds.
- The same `LINK_SCREENSHOT_SIGNING_KEY` must be configured as a Cloudflare Worker secret at runtime so `/api/link-screenshot` can validate signatures.
- Browser Run Quick Actions require compatibility date `2026-03-24` or newer; this project uses `2026-05-14`, the newest date supported by the currently pinned Wrangler/workerd version.
- Do not commit `remote: true` on the Browser Run or R2 bindings. It can keep local production builds open after prerendering. For local endpoint testing against real Cloudflare resources, use `wrangler dev --remote` instead.

## Commands

Use pnpm.

```sh
pnpm dev
pnpm typecheck
pnpm lint
pnpm build
pnpm preview
pnpm deploy
pnpm cf-typegen
```

Before considering code changes complete, run at least:

```sh
pnpm typecheck
pnpm lint
pnpm build
```

Never run the dev server yourself; ask the user to start it if browser testing needs a live server.

## Dependency Policy

Dependencies in `package.json` are pinned to exact versions. Do not use `latest`, caret ranges, or tilde ranges when adding or updating packages.

Use `--save-exact` when installing new packages:

```sh
pnpm add package-name --save-exact
pnpm add -D package-name --save-exact
```

## Generated And Ignored Files

- `src/routeTree.gen.ts` is generated by TanStack Router and is required for typechecking.
- `.content-collections/generated` is generated by Content Collections and required for local typechecking/builds.
- `dist/` is build output and should stay ignored.
- `.wrangler/` is local Cloudflare/Wrangler output and should stay ignored.
- `node_modules/` should stay ignored.

## Coding Notes

- Keep changes small and direct.
- Prefer build-time work over runtime work for blog content.
- Avoid adding client-side JavaScript for static content unless it is clearly needed.
- Browser-only APIs such as `window`, `document`, `localStorage`, `navigator`, and `ResizeObserver` must stay inside effects, event handlers, or explicit client-only scripts; do not run them during render or route loaders.
- Keep MDX components reusable and colocated under `src/components/mdx` when they are intended for posts.
- Use Cloudflare secrets for private runtime values; do not commit `.env` files or secrets.
- If adding Cloudflare bindings, update `wrangler.jsonc` and run `pnpm cf-typegen`.
