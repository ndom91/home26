import { describe, expect, it } from 'vitest'
import { repoSlug } from './repo-slug'

describe('repoSlug', () => {
  it('extracts lowercase owner/repo slugs from GitHub URLs', () => {
    expect(repoSlug('https://github.com/Ndom91/Home26')).toBe('ndom91/home26')
    expect(repoSlug('https://github.com/ndom91/home26.git')).toBe('ndom91/home26')
  })

  it('returns null for missing or non-GitHub URLs', () => {
    expect(repoSlug()).toBeNull()
    expect(repoSlug('https://gitlab.com/ndom91/home26')).toBeNull()
  })
})
