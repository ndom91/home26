// Static, build-time project list for the /projects page.
//
// To add a screenshot: drop the file in `src/assets/projects/`, import it at the
// top of this file, and set it as the `image` field. Vite resolves the import to
// a hashed URL at build time — there is no runtime filesystem read.
//
//   import home26Shot from '../assets/projects/home26.png'
//   ...
//   { title: 'home26', image: home26Shot, ... }
//
// Star counts come from `stars.generated.ts`, refreshed with `pnpm stars` and
// committed (same pattern as the pre-rendered mermaid SVGs). They are merged in
// by `getProjects()`, so the page never hits the GitHub API at runtime.

import { stars } from './stars.generated.ts'

export type ProjectStatus = 'live' | 'wip' | 'archived'

export type Project = {
  title: string
  blurb: string
  repo?: string
  demo?: string
  docs?: string
  /** Imported asset URL. Omit for the compact, text-only card variant. */
  image?: string
  status: ProjectStatus
  tags: string[]
  /** Renders larger in the grid (spans extra columns). */
  featured?: boolean
  /** Filled in by `getProjects()` from the generated star map. */
  stars?: number
}

// TODO(ndom91): replace placeholder entries with real projects and add
// screenshots. `home26` is this site.
const projects: Project[] = [
  {
    title: 'open-plan-annotator',
    blurb:
      " A fully local agentic coding plugin that intercepts plan mode and opens an annotation UI in your browser. Mark up the plan, send structured feedback to the agent, and receive a revised version — iterate as many times as you need until you're ready to approve.",
    repo: 'https://github.com/ndom91/open-plan-annotator',
    status: 'live',
    tags: ['TypeScript', 'Agent Plugin'],
    featured: true,
  },
  {
    title: 'home26',
    blurb:
      'This site — a static portfolio and blog on TanStack Start, deployed to Cloudflare Workers.',
    repo: 'https://github.com/ndom91/home26',
    demo: 'https://ndo.dev',
    status: 'live',
    tags: ['TanStack', 'React', 'Cloudflare'],
  },
  {
    title: 'llama-dash',
    blurb:
      'llama-dash turns a self-hosted local inference box into an observable, policy-controlled AI gateway: one UI for model state, request history, API keys, routing rules, proxy metrics, and client setup.',
    repo: 'https://github.com/ndom91/llama-dash',
    status: 'live',
    tags: ['TanStack', 'Local LLM', 'Observability'],
  },
  {
    title: 'Auth.js (next-auth)',
    blurb:
      'Go-to Next.js authentication library supporting more social signin providers than you can shake a stick at, and your own database to store your users in. No longer involved after selling to better-auth.',
    repo: 'https://github.com/nextauthjs/next-auth',
    docs: 'https://authjs.dev',
    status: 'archived',
    tags: ['Next.js', 'Authentication'],
  },
  {
    title: 'ha-voice-rocm',
    blurb:
      "AMD (ROCm) oriented local voice LLM collection. This is an ever growing collection of various TTS and STT models each of which is also wrapped in the Open Home Foundation's Wyoming API to make it easy to consume the models in Homeassistant's voice assistant pipeline.",
    repo: 'https://github.com/ndom91/ha-voice-rocm',
    status: 'live',
    tags: ['Svelte', 'Component'],
  },
  {
    title: 'tmux-ai-window-name',
    blurb:
      "tmux plugin which leverages your local LLMs to automatically rename your windows based on what you're working on in each.",
    repo: 'https://github.com/ndom91/tmux-ai-window-name',
    status: 'live',
    tags: ['tmux', 'LLM'],
  },
  {
    title: 'react-timezone-select',
    blurb: 'An extremely usable and dynamic React timezone selector',
    repo: 'https://github.com/ndom91/react-timezone-select',
    demo: 'https://ndom91.github.io/react-timezone-select/',
    status: 'live',
    tags: ['React', 'Component'],
  },
  {
    title: 'svelte-infinite',
    blurb: 'Svelte 5 infinite loader and virtualized list component',
    repo: 'https://github.com/ndom91/svelte-infinite',
    demo: 'https://svelte-5-infinite.vercel.app',
    status: 'live',
    tags: ['Svelte', 'Component'],
  },
  {
    title: 'jellyfin-random-macos-screensaver',
    blurb:
      'Play a random Jellyfin TV Show or Movie as a MacOS screensaver. By default without audio, but with subtitles.',
    repo: 'https://github.com/ndom91/jellyfin-random-macos-screensaver',
    status: 'live',
    tags: ['Swift', 'Jellyfin'],
  },
]

/** Extract a lowercase `owner/repo` slug from a GitHub repo URL, or null. */
export function repoSlug(repoUrl?: string): string | null {
  if (!repoUrl) return null
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i)
  return match ? match[1].toLowerCase() : null
}

export function getProjects(): Project[] {
  return projects.map((project) => {
    const slug = repoSlug(project.repo)
    const starCount = slug ? stars[slug] : undefined
    return starCount === undefined ? project : { ...project, stars: starCount }
  })
}
