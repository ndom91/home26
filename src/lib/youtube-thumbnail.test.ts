import { describe, expect, it } from 'vitest'
import { youtubeThumbnailUrl } from './youtube-thumbnail'

describe('youtubeThumbnailUrl', () => {
  it('builds thumbnail URLs for supported YouTube URL shapes', () => {
    expect(youtubeThumbnailUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    )
    expect(youtubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    )
    expect(youtubeThumbnailUrl('https://youtube.com/shorts/dQw4w9WgXcQ')).toBe(
      'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg'
    )
  })

  it('rejects non-YouTube URLs and unsafe video ids', () => {
    expect(youtubeThumbnailUrl('https://example.com/watch?v=dQw4w9WgXcQ')).toBeNull()
    expect(youtubeThumbnailUrl('https://youtube.com/watch?v=../../secret')).toBeNull()
    expect(youtubeThumbnailUrl('not a url')).toBeNull()
  })
})
