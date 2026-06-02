import { createContext, type ReactNode, useContext } from 'react'
import { normalizeLinkScreenshotTarget } from '../../lib/link-screenshot'

type LinkScreenshotUrls = Record<string, string>

const LinkScreenshotContext = createContext<LinkScreenshotUrls>({})

export function LinkScreenshotProvider({
  children,
  urls,
}: {
  children: ReactNode
  urls: LinkScreenshotUrls
}) {
  return <LinkScreenshotContext.Provider value={urls}>{children}</LinkScreenshotContext.Provider>
}

export function useLinkScreenshotUrl(url: string) {
  const urls = useContext(LinkScreenshotContext)
  const normalizedUrl = normalizeLinkScreenshotTarget(url)

  return normalizedUrl ? urls[normalizedUrl] : undefined
}
