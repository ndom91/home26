import { describe, expect, it } from 'vitest'
import { buildLinkScreenshotUrl, normalizeLinkScreenshotTarget } from './link-screenshot'
import { collectBlogLinkTargets, collectProjectLinkTargets } from './link-screenshot-targets'

describe('normalizeLinkScreenshotTarget', () => {
  it('normalizes public http URLs and strips hash fragments', () => {
    expect(normalizeLinkScreenshotTarget('HTTPS://Example.COM/path?x=1#section')).toBe(
      'https://example.com/path?x=1'
    )
  })

  it('rejects unsupported, credentialed, local, and private URLs', () => {
    expect(normalizeLinkScreenshotTarget('mailto:home@ndo.dev')).toBeNull()
    expect(normalizeLinkScreenshotTarget('https://user:pass@example.com')).toBeNull()
    expect(normalizeLinkScreenshotTarget('https://localhost:3000')).toBeNull()
    expect(normalizeLinkScreenshotTarget('https://192.168.1.10')).toBeNull()
    expect(normalizeLinkScreenshotTarget('https://100.64.0.1')).toBeNull()
    expect(normalizeLinkScreenshotTarget('not a url')).toBeNull()
  })
})

describe('buildLinkScreenshotUrl', () => {
  it('encodes the target URL and signature as query params', () => {
    expect(buildLinkScreenshotUrl('https://example.com/a path', 'sig+value')).toBe(
      '/api/link-screenshot?url=https%3A%2F%2Fexample.com%2Fa+path&sig=sig%2Bvalue'
    )
  })
})

describe('collectBlogLinkTargets', () => {
  it('collects unique public links outside code fences', () => {
    const content = `
Visit https://Example.com/page#hash and https://example.com/page.

\`\`\`ts
const ignored = 'https://ignored.example'
\`\`\`
`

    expect(collectBlogLinkTargets(content)).toEqual(['https://example.com/page'])
  })
})

describe('collectProjectLinkTargets', () => {
  it('collects ScreenshotLink url attributes from JSX source', () => {
    const source = `
      <ScreenshotLink url="https://example.com/a#one">Example</ScreenshotLink>
      <ScreenshotLink url={'https://example.com/b'}>Example</ScreenshotLink>
      <ScreenshotLink url={"https://localhost:3000"}>Local</ScreenshotLink>
    `

    expect(collectProjectLinkTargets(source)).toEqual([
      'https://example.com/a',
      'https://example.com/b',
    ])
  })
})
