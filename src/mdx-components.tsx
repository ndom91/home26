import type { ComponentType, ReactNode } from 'react'
import { isValidElement, useState } from 'react'
import { Callout } from './components/mdx/callout'

type MDXComponent = ComponentType<Record<string, unknown>> | keyof React.JSX.IntrinsicElements
type MDXComponents = Record<string, MDXComponent>

function getNodeText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') {
    return ''
  }

  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'bigint') {
    return String(node)
  }

  if (Array.isArray(node)) {
    return node.map(getNodeText).join('')
  }

  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getNodeText(node.props.children)
  }

  return ''
}

function CodeBlock({ children, title }: { children?: ReactNode; title?: string }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const code = getNodeText(children).trimEnd()

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code)
      setCopyState('copied')
      window.setTimeout(() => setCopyState('idle'), 1800)
    } catch {
      setCopyState('failed')
      window.setTimeout(() => setCopyState('idle'), 1800)
    }
  }

  return (
    <figure className="group/code my-8 overflow-hidden rounded-2xl border border-blog-rule bg-blog-panel shadow-[0_18px_50px_color-mix(in_oklab,var(--color-blog-bg)_65%,transparent)]">
      <figcaption className="flex h-10 mt-0 items-center gap-3 border-b border-blog-rule bg-blog-panel/70 px-4">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-blog-muted/40" />
          <span className="size-2.5 rounded-full bg-blog-muted/30" />
          <span className="size-2.5 rounded-full bg-blog-muted/20" />
        </span>
        <span className="min-w-0 flex-1 truncate font-mono text-[10px] uppercase leading-none tracking-widest text-blog-muted">
          {title ?? 'Code'}
        </span>
        <button
          type="button"
          onClick={copyCode}
          disabled={!code}
          className="rounded-full border border-blog-rule px-3 py-1 font-mono text-[10px] uppercase leading-none tracking-widest text-blog-muted opacity-0 transition hover:cursor-pointer hover:border-blog-accent hover:text-blog-accent focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blog-accent/60 disabled:pointer-events-none disabled:opacity-30 group-hover/code:opacity-100 motion-reduce:transition-none"
        >
          {copyState === 'copied' ? 'Copied' : copyState === 'failed' ? 'Failed' : 'Copy'}
        </button>
      </figcaption>
      <div className="[&_pre]:m-0! [&_pre]:rounded-none! [&_pre]:border-0! [&_pre]:shadow-none! [&_figure]:my-0!">
        {children}
      </div>
    </figure>
  )
}

function CodeEditor(props: { children?: ReactNode; title?: string }) {
  return <CodeBlock {...props} />
}

function getScreenshotImage(url: string, image?: string): string {
  if (image?.startsWith('/') || image?.startsWith('http') || image?.startsWith('data:')) {
    return image
  }

  const screenshotUrl = new URL('https://api.microlink.io/')
  screenshotUrl.searchParams.set('url', url)
  screenshotUrl.searchParams.set('screenshot', 'true')
  screenshotUrl.searchParams.set('meta', 'false')
  screenshotUrl.searchParams.set('embed', 'screenshot.url')

  return screenshotUrl.toString()
}

function ScreenshotLink({
  children,
  text,
  url,
  image,
}: {
  children?: ReactNode
  text?: string
  url: string
  image?: string
}) {
  const label = children ?? text ?? url

  const imageSrc = getScreenshotImage(url, image)

  return (
    <span className="group/screenshot relative inline-block">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="decoration-dotted underline-offset-4"
      >
        {label}
      </a>
      <span
        aria-hidden="true"
        className="absolute bottom-full left-1/2 z-30 mb-3 hidden w-80 max-w-[min(20rem,calc(100vw-2rem))] -translate-x-1/2 overflow-hidden rounded-xl border border-blog-rule bg-blog-panel p-2 opacity-0 shadow-2xl shadow-black/35 transition before:absolute before:-bottom-3 before:left-0 before:h-3 before:w-full before:content-[''] group-hover/screenshot:block group-hover/screenshot:opacity-100 group-focus-within/screenshot:block group-focus-within/screenshot:opacity-100 motion-reduce:transition-none"
      >
        <img
          src={imageSrc}
          alt=""
          loading="lazy"
          decoding="async"
          className="m-0 aspect-video w-full rounded-lg border border-blog-rule object-cover"
        />
        <span className="mt-2 block truncate px-1 font-mono text-[10px] uppercase tracking-widest text-blog-muted">
          {url.replace(/^https?:\/\//, '')}
        </span>
      </span>
    </span>
  )
}

function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    Callout: Callout as unknown as MDXComponent,
    CodeBlock: CodeBlock as unknown as MDXComponent,
    CodeEditor: CodeEditor as unknown as MDXComponent,
    ScreenshotLink: ScreenshotLink as unknown as MDXComponent,
    ...components,
  }
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components)
}

export const mdxComponents = getMDXComponents({})
