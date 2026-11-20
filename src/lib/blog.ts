import { allPosts } from 'content-collections'

export type BlogPost = (typeof allPosts)[number]

export type PostListItem = BlogPost

function getAllPosts() {
  return [...allPosts].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}

export function getPublishedPosts() {
  return getAllPosts().filter((post) => !post.draft)
}

export function getPublishedPost(slug: string) {
  return getPublishedPosts().find((post) => post.slug === slug)
}

// Compact read-time label for list cards, e.g. "4 min" (floors at 1).
export function readTimeLabel(seconds: number): string {
  return `${Math.max(1, Math.round(seconds / 60))} min`
}

// Glyph advance widths (in em) for Clash Display at wght 700, extracted from
// the variable font's hmtx table (unitsPerEm 1000). Titles render uppercase
// font-extrabold, which clamps to the font's 700 maximum, so only
// caps/digits/punctuation matter.
const HEADING_ADVANCES: Record<string, number> = {
  A: 0.828,
  B: 0.714,
  C: 0.77,
  D: 0.761,
  E: 0.648,
  F: 0.648,
  G: 0.797,
  H: 0.748,
  I: 0.248,
  J: 0.664,
  K: 0.731,
  L: 0.625,
  M: 0.952,
  N: 0.736,
  O: 0.786,
  P: 0.67,
  Q: 0.786,
  R: 0.709,
  S: 0.684,
  T: 0.691,
  U: 0.736,
  V: 0.788,
  W: 1.123,
  X: 0.8,
  Y: 0.766,
  Z: 0.697,
  '0': 0.733,
  '1': 0.407,
  '2': 0.66,
  '3': 0.688,
  '4': 0.721,
  '5': 0.725,
  '6': 0.718,
  '7': 0.611,
  '8': 0.694,
  '9': 0.718,
  '-': 0.481,
  "'": 0.235,
  '’': 0.304,
  '&': 0.773,
  '.': 0.304,
  ',': 0.304,
  ':': 0.304,
  '!': 0.352,
  '?': 0.652,
  '/': 0.514,
  '(': 0.349,
  ')': 0.393,
}

// Letter-spacing applies after every glyph; keep in sync with the hero
// title's tracking class.
const HEADING_TRACKING_EM = -0.01
const FALLBACK_ADVANCE_EM = 0.75

// Em width of the widest word in a title, used to cap the hero font-size so
// no word ever breaks mid-word: font-size = min(clamp(...), 100cqi / em).
export function longestWordEm(title: string): number {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean)
  const widths = words.map((word) =>
    [...word].reduce(
      (sum, char) => sum + (HEADING_ADVANCES[char] ?? FALLBACK_ADVANCE_EM) + HEADING_TRACKING_EM,
      0
    )
  )
  // 1% safety margin against metric/rendering drift
  return Math.ceil(Math.max(...widths) * 1.01 * 100) / 100
}
