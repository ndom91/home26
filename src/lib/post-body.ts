import type { MDXContent } from 'mdx/types'
import { lazy } from 'react'

// Each post body is its own chunk, so list pages and Home never download
// post content. Keys match Content Collections' `_meta.filePath`.
const postModules = import.meta.glob<{ default: MDXContent }>('/content/blog/**/*.mdx')

const bodies = new Map<string, MDXContent>()

function loader(filePath: string) {
  const load = postModules[`/content/blog/${filePath}`]
  if (!load) throw new Error(`No MDX module for post: ${filePath}`)
  return load
}

// Called from the route loader (prerender and client navigation) so the body
// renders synchronously. Only first-load hydration skips the loader, and the
// lazy fallback below keeps the server HTML in place until the chunk arrives.
export async function preloadPostBody(filePath: string) {
  if (!bodies.has(filePath)) bodies.set(filePath, (await loader(filePath)()).default)
}

export function getPostBody(filePath: string): MDXContent {
  let body = bodies.get(filePath)
  if (!body) {
    body = lazy(loader(filePath)) as unknown as MDXContent
    bodies.set(filePath, body)
  }
  return body
}
