export const LINK_SCREENSHOT_ENDPOINT = '/api/link-screenshot'

const PRIVATE_IPV4_RANGES = [
  /^0\./,
  /^10\./,
  /^127\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^224\./,
  /^255\./,
]

function isIpv4Address(hostname: string) {
  const parts = hostname.split('.')

  return (
    parts.length === 4 &&
    parts.every((part) => {
      if (!/^\d+$/.test(part)) {
        return false
      }

      const value = Number(part)

      return value >= 0 && value <= 255
    })
  )
}

function isPrivateIpv4Address(hostname: string) {
  if (!isIpv4Address(hostname)) {
    return false
  }

  if (/^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./.test(hostname)) {
    return true
  }

  return PRIVATE_IPV4_RANGES.some((range) => range.test(hostname))
}

export function normalizeLinkScreenshotTarget(value: string) {
  try {
    const url = new URL(value)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    if (url.username || url.password) {
      return null
    }

    const hostname = url.hostname.toLowerCase()

    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname.includes(':') ||
      isPrivateIpv4Address(hostname)
    ) {
      return null
    }

    url.hash = ''
    url.hostname = hostname

    return url.toString()
  } catch {
    return null
  }
}

export function buildLinkScreenshotUrl(normalizedUrl: string, signature: string) {
  const params = new URLSearchParams({ url: normalizedUrl, sig: signature })

  return `${LINK_SCREENSHOT_ENDPOINT}?${params.toString()}`
}
