import { absoluteSiteUrl, isoDateToUtcDateTime, siteUrl } from './structured-data'

export const siteName = 'ndom91'
export const siteDescription =
  'Nico (ndom91), software engineer. I like building web tools, developer systems, and the occasional over-engineered side quest.'

/** Link-preview card size (1.91:1), used for the per-post cover crop. */
export const SOCIAL_IMAGE = { width: 1200, height: 630 } as const

export interface SocialImage {
  url: string
  width: number
  height: number
  alt: string
  type: string
}

// Stopgap until a 1200×630 public/og-default.png exists. Square images get a
// `summary` card; wide ones get `summary_large_image`.
export const defaultSocialImage: SocialImage = {
  url: '/web-app-manifest-512x512.png',
  width: 512,
  height: 512,
  alt: 'ndo.dev logo',
  type: 'image/png',
}

interface SocialMetaInput {
  title: string
  description: string
  /** Site-relative path, e.g. `/blog/doh`. */
  path: string
  image?: SocialImage
  type?: 'website' | 'article'
  publishedAt?: string
}

/**
 * Open Graph + Twitter card tags. Bluesky, Slack, Discord, iMessage and
 * LinkedIn all read the og:* set. TanStack dedupes meta by name/property with
 * the deepest route winning, so routes override the root defaults per key.
 */
export function socialMeta({
  title,
  description,
  path,
  image = defaultSocialImage,
  type = 'website',
  publishedAt,
}: SocialMetaInput) {
  const url = absoluteSiteUrl(path)
  const imageUrl = absoluteSiteUrl(image.url)
  const isWide = image.width / image.height >= 1.5

  return [
    { name: 'description', content: description },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: 'en_US' },
    { property: 'og:type', content: type },
    { property: 'og:url', content: url },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:type', content: image.type },
    { property: 'og:image:width', content: String(image.width) },
    { property: 'og:image:height', content: String(image.height) },
    { property: 'og:image:alt', content: image.alt },
    { name: 'twitter:card', content: isWide ? 'summary_large_image' : 'summary' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: imageUrl },
    { name: 'twitter:image:alt', content: image.alt },
    ...(type === 'article' && publishedAt
      ? [
          { property: 'article:published_time', content: isoDateToUtcDateTime(publishedAt) },
          { property: 'article:author', content: siteUrl },
        ]
      : []),
  ]
}

/** Canonical link for a leaf route. Links aren't deduped, so never set this on the root. */
export function canonicalLink(path: string) {
  return { rel: 'canonical', href: absoluteSiteUrl(path) }
}
