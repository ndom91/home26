import { allPosts } from 'content-collections'

export type BlogPost = (typeof allPosts)[number]

function getAllPosts() {
  return [...allPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPublishedPosts() {
  return getAllPosts().filter((post) => !post.draft)
}

export function getPublishedPost(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug)
}

// Glyph advance widths (in em) for Syne ExtraBold, extracted from the font's
// hmtx table. Titles render uppercase, so only caps/digits/punctuation matter.
const SYNE_800_ADVANCES: Record<string, number> = {
  A: 1.16,
  B: 1.14,
  C: 1.316,
  D: 1.302,
  E: 1.14,
  F: 1.128,
  G: 1.34,
  H: 1.28,
  I: 0.42,
  J: 1.004,
  K: 1.215,
  L: 0.943,
  M: 1.58,
  N: 1.3,
  O: 1.33,
  P: 1.177,
  Q: 1.33,
  R: 1.232,
  S: 1.056,
  T: 1.1,
  U: 1.289,
  V: 1.16,
  W: 1.882,
  X: 1.14,
  Y: 1.07,
  Z: 1.2,
  '0': 1.066,
  '1': 0.529,
  '2': 1.003,
  '3': 1.055,
  '4': 1.094,
  '5': 1.015,
  '6': 1.133,
  '7': 1.153,
  '8': 1.081,
  '9': 1.158,
  '-': 0.59,
  "'": 0.3,
  '’': 0.303,
  '&': 1.22,
  '.': 0.354,
  ',': 0.303,
  ':': 0.354,
  '!': 0.394,
  '?': 0.864,
  '/': 0.622,
  '(': 0.405,
  ')': 0.405,
}

// Hero titles use tracking-[-0.08em]; letter-spacing applies after every glyph.
const HEADING_TRACKING_EM = -0.08
const FALLBACK_ADVANCE_EM = 1.4

// Em width of the widest word in a title, used to cap the hero font-size so
// no word ever breaks mid-word: font-size = min(clamp(...), 100cqi / em).
export function longestWordEm(title: string): number {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean)
  const widths = words.map((word) =>
    [...word].reduce(
      (sum, char) => sum + (SYNE_800_ADVANCES[char] ?? FALLBACK_ADVANCE_EM) + HEADING_TRACKING_EM,
      0
    )
  )
  // 1% safety margin against metric/rendering drift
  return Math.ceil(Math.max(...widths) * 1.01 * 100) / 100
}
