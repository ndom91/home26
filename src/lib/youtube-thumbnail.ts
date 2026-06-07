/**
 * YouTube preview fallback. Cloudflare Browser Run persistently rate-limits
 * youtube.com per-host (429 code 2001) regardless of request rate, so youtube
 * pages can never be screenshotted. Instead we serve the video thumbnail —
 * no browser, no rate limit, and a nicer preview than youtube's consent page.
 */
const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtu.be',
])
// Path segments that precede a video id, e.g. /shorts/<id>, /embed/<id>.
const YOUTUBE_ID_PATH_PREFIXES = new Set(['shorts', 'embed', 'live', 'v'])

// Returns the youtube video id for a watch/youtu.be/shorts/embed URL, or null.
// Input is expected to be a normalized URL (hostname already lowercased).
function youtubeVideoId(normalizedUrl: string): string | null {
  let url: URL

  try {
    url = new URL(normalizedUrl)
  } catch {
    return null
  }

  const hostname = url.hostname.toLowerCase()

  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null
  }

  if (hostname === 'youtu.be') {
    return url.pathname.split('/').filter(Boolean)[0] ?? null
  }

  const watchId = url.searchParams.get('v')

  if (watchId) {
    return watchId
  }

  const segments = url.pathname.split('/').filter(Boolean)

  if (segments.length >= 2 && YOUTUBE_ID_PATH_PREFIXES.has(segments[0])) {
    return segments[1]
  }

  return null
}

export function youtubeThumbnailUrl(normalizedUrl: string): string | null {
  const videoId = youtubeVideoId(normalizedUrl)

  // Guard the id charset so it can only ever form an img.youtube.com path.
  if (!videoId || !/^[\w-]{6,20}$/.test(videoId)) {
    return null
  }

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export async function fetchYoutubeThumbnail(thumbnailUrl: string): Promise<ArrayBuffer | null> {
  try {
    const response = await fetch(thumbnailUrl)

    if (!response.ok) {
      return null
    }

    return await response.arrayBuffer()
  } catch {
    return null
  }
}
