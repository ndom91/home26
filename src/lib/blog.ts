import { allPosts } from 'content-collections'

export type BlogPost = (typeof allPosts)[number]

export type PostListItem = Omit<BlogPost, 'Component'>

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

// Glyph advance widths (in em) for Manuka Bold, extracted from the font's
// hmtx table (unitsPerEm 1000). Titles render uppercase font-extrabold, which
// resolves to the Bold file, so only caps/digits/punctuation matter.
const MANUKA_800_ADVANCES: Record<string, number> = {
  A: 0.324,
  B: 0.331,
  C: 0.321,
  D: 0.334,
  E: 0.265,
  F: 0.263,
  G: 0.324,
  H: 0.347,
  I: 0.164,
  J: 0.325,
  K: 0.334,
  L: 0.253,
  M: 0.427,
  N: 0.339,
  O: 0.331,
  P: 0.33,
  Q: 0.331,
  R: 0.335,
  S: 0.31,
  T: 0.297,
  U: 0.327,
  V: 0.319,
  W: 0.436,
  X: 0.324,
  Y: 0.312,
  Z: 0.271,
  '0': 0.331,
  '1': 0.204,
  '2': 0.312,
  '3': 0.32,
  '4': 0.339,
  '5': 0.32,
  '6': 0.33,
  '7': 0.308,
  '8': 0.326,
  '9': 0.33,
  '-': 0.2,
  "'": 0.144,
  '’': 0.157,
  '&': 0.338,
  '.': 0.157,
  ',': 0.157,
  ':': 0.157,
  '!': 0.159,
  '?': 0.319,
  '/': 0.253,
  '(': 0.234,
  ')': 0.234,
}

// Hero titles render at tracking-normal (Manuka is condensed by nature);
// letter-spacing applies after every glyph.
const HEADING_TRACKING_EM = 0
const FALLBACK_ADVANCE_EM = 0.4

// Em width of the widest word in a title, used to cap the hero font-size so
// no word ever breaks mid-word: font-size = min(clamp(...), 100cqi / em).
export function longestWordEm(title: string): number {
  const words = title.toUpperCase().split(/\s+/).filter(Boolean)
  const widths = words.map((word) =>
    [...word].reduce(
      (sum, char) => sum + (MANUKA_800_ADVANCES[char] ?? FALLBACK_ADVANCE_EM) + HEADING_TRACKING_EM,
      0
    )
  )
  // 1% safety margin against metric/rendering drift
  return Math.ceil(Math.max(...widths) * 1.01 * 100) / 100
}
