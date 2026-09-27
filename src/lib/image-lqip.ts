import sharp from 'sharp'

const lqipCache = new Map<string, Promise<string>>()

export function imageLqip(filePath: string) {
  const cached = lqipCache.get(filePath)

  if (cached) {
    return cached
  }

  const lqip = sharp(filePath)
    .rotate()
    .resize({ width: 48, withoutEnlargement: true })
    .webp({ quality: 35 })
    .toBuffer()
    .then((image) => `data:image/webp;base64,${image.toString('base64')}`)

  lqipCache.set(filePath, lqip)

  return lqip
}
