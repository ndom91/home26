/**
 * Extract a lowercase `owner/repo` slug from a GitHub repo URL, or null.
 *
 * Lives in its own plain-`.ts` module (no JSX) so build-time node scripts like
 * `scripts/fetch-stars.ts` can import it without loading `projects.tsx`, which
 * node cannot parse (JSX).
 */
export function repoSlug(repoUrl?: string): string | null {
  if (!repoUrl) return null
  const match = repoUrl.match(/github\.com\/([^/]+\/[^/]+?)(?:\.git)?\/?$/i)
  return match ? match[1].toLowerCase() : null
}
