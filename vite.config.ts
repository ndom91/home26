import { cloudflare } from '@cloudflare/vite-plugin'
import contentCollections from '@content-collections/vite'
import mdx from '@mdx-js/rollup'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeCallouts from 'rehype-callouts'
import rehypeMdxImportMedia from 'rehype-mdx-import-media'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import { defineConfig } from 'vite'
import { mermaidPlugin } from './src/lib/mermaid-vite'
import { rehypeImageCaptions } from './src/lib/rehype-image-captions'
import { remarkMermaid } from './src/lib/remark-mermaid'

function useFilenameAsCodeTitle(meta: string) {
  if (/\btitle=/.test(meta)) {
    return meta
  }

  return meta.replace(
    /\bfilename=(?:"([^"]*)"|'([^']*)'|(\S+))/,
    (_match, doubleQuoted?: string, singleQuoted?: string, unquoted?: string) =>
      `title="${doubleQuoted ?? singleQuoted ?? unquoted ?? ''}"`
  )
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    mermaidPlugin(),
    devtools(),
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    contentCollections({ environment: 'ssr' }),
    tailwindcss(),
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm, remarkMermaid],
        rehypePlugins: [
          [rehypeCallouts, { theme: 'vitepress' }],
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'prepend',
              properties: {
                className: ['heading-anchor'],
                ariaLabel: 'Permalink to this heading',
              },
              content: { type: 'text', value: '#' },
            },
          ],
          [
            rehypePrettyCode,
            {
              theme: {
                light: 'github-light',
                dark: 'github-dark',
              },
              filterMetaString: useFilenameAsCodeTitle,
            },
          ],
          rehypeImageCaptions,
          rehypeMdxImportMedia,
        ],
      }),
    },
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
      },
      sitemap: {
        enabled: true,
        host: 'https://ndo.dev',
      },
    }),
    viteReact(),
  ],
})

export default config
