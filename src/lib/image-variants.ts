import sharp from 'sharp'
import { SOCIAL_IMAGE } from './social-meta'

// Responsive WebP widths for build-time image variants (vite-imagetools).
// 1600 covers the widest render (42rem prose / half-width covers) at 2x.
const VARIANT_WIDTHS = [640, 1024, 1600]

const RASTER_IMAGE = /\.(jpe?g|png|webp|avif|tiff?)$/i

export function isRasterImage(path: string) {
  return RASTER_IMAGE.test(path)
}

export function variantQuery(width: number) {
  return `?w=${width}&format=webp`
}

export function srcsetQuery(widths: number[]) {
  return `?w=${widths.join(';')}&format=webp&as=srcset`
}

// JPEG because LinkedIn and some Slack/iMessage unfurlers still choke on WebP.
export function socialImageQuery() {
  return `?w=${SOCIAL_IMAGE.width}&h=${SOCIAL_IMAGE.height}&fit=cover&allowUpscale=true&format=jpg&quality=82`
}

const metadataCache = new Map<
  string,
  Promise<{ width: number; height: number; widths: number[] }>
>()

/** Intrinsic size plus the variant widths that do not upscale the original. */
export function imageVariants(filePath: string) {
  let cached = metadataCache.get(filePath)
  if (!cached) {
    cached = sharp(filePath)
      .metadata()
      .then(({ width, height }) => {
        const largest = Math.min(width, VARIANT_WIDTHS.at(-1) ?? width)
        const smaller = VARIANT_WIDTHS.filter((w) => w < largest)
        return { width, height, widths: [...smaller, largest] }
      })
    metadataCache.set(filePath, cached)
  }
  return cached
}
