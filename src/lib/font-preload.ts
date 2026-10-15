// Font preloads must be CORS-mode (crossOrigin) or the browser fetches the
// file twice: once for the preload and again for the @font-face.
export function fontPreload(href: string) {
  return { rel: 'preload', href, as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' } as const
}
