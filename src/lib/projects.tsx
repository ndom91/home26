import type { ReactNode } from 'react'
import { ScreenshotLink } from '../components/mdx/screenshot-link'
import { repoSlug } from './repo-slug.ts'
import { stars } from './stars.generated.ts'

export { repoSlug }

export type ProjectStatus = 'live' | 'wip' | 'archived'

export type Project = {
  title: string
  blurb: ReactNode
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

const projects: Project[] = [
  {
    title: 'open-plan-annotator',
    blurb:
      "A fully local agentic coding plugin that intercepts plan mode and opens an annotation UI in your browser. Mark up the plan, send structured feedback to the agent, and receive a revised version — iterate as many times as you need until you're ready to approve.",
    repo: 'https://github.com/ndom91/open-plan-annotator',
    status: 'live',
    tags: ['TypeScript', 'Agent Plugin'],
    featured: true,
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
    title: 'Auth.js / next-auth',
    blurb: (
      <>
        Go-to Next.js authentication library supporting more social signin providers than you can
        shake a stick at, and your own database to store your users in. Inactive after transfering
        the project to <ScreenshotLink url="https://better-auth.com">better-auth</ScreenshotLink>.
      </>
    ),

    repo: 'https://github.com/nextauthjs/next-auth',
    docs: 'https://authjs.dev',
    status: 'archived',
    tags: ['Next.js', 'Authentication'],
  },
  {
    title: 'ha-voice-rocm',
    blurb:
      "AMD (ROCm) oriented local voice LLM collection. This is an ever growing collection of various TTS and STT models each of which is also wrapped in the Open Home Foundation's Wyoming API to make it easy to consume the models in Home Assistant's voice assistant pipeline.",
    repo: 'https://github.com/ndom91/ha-voice-rocm',
    status: 'live',
    featured: true,
    tags: ['Python', 'Home Assistant'],
  },
  {
    title: 'tmux-ai-window-name',
    blurb:
      "tmux plugin which leverages a local LLM to automatically rename your tmux windows based on what you're working on in them. Never get lost jumping around tmux again.",
    repo: 'https://github.com/ndom91/tmux-ai-window-name',
    status: 'live',
    tags: ['tmux', 'LLM'],
  },
  {
    title: 'frame-web',
    blurb:
      'Frontend for a custom digital frame project I built for my grandparents. The device consists of a custom wooden picture frame, display, Raspberry Pi, and some power electronics. The web app allows family members to login and manage the various deployed frames and their media.',
    repo: 'https://github.com/ndom91/frame-web',
    status: 'archived',
    tags: ['Frame', 'Next.js'],
  },
  {
    title: 'frame-go',
    blurb:
      'Golang client for a custom digital frame project I built for my grandparents. The device consists of a custom wooden picture frame, display, Raspberry Pi, and some power electronics. Syncs media from a bucket destined for the current device.',
    repo: 'https://github.com/ndom91/frame-go',
    status: 'archived',
    tags: ['Frame', 'Go'],
  },
  {
    title: 'jellyfin-random-macos-screensaver',
    blurb:
      'Play a random Jellyfin TV show or movie as a MacOS screensaver. Configurable to play with or without audio, with or without subtitles, and will begin playing at a random point in the media anywhere between 2% and 30% of the way through.',
    repo: 'https://github.com/ndom91/jellyfin-random-macos-screensaver',
    status: 'live',
    featured: true,
    tags: ['Swift', 'Jellyfin'],
  },
  {
    title: 'briefkasten',
    blurb:
      'Self-hosted bookmarking and RSS reader application. Originally written in React, v2 was a complete rewrite with SvelteKit.',
    repo: 'https://github.com/ndom91/briefkasten',
    status: 'archived',
    tags: ['Svelte'],
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
    title: 'pebble-plain',
    blurb:
      'Plain support application for the new era of Pebble smart watches. Specifically the Pebble Time 2 and Round 2.',
    repo: 'https://github.com/ndom91/pebble-plain',
    status: 'live',
    tags: ['Pebble', 'Smartwatch'],
  },
]

export function getProjects(): Project[] {
  return projects.map((project) => {
    const slug = repoSlug(project.repo)
    const starCount = slug ? stars[slug] : undefined
    return starCount === undefined ? project : { ...project, stars: starCount }
  })
}
