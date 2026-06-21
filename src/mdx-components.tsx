import type { AnchorHTMLAttributes, ComponentType, ImgHTMLAttributes } from 'react'
import { createContext, useContext } from 'react'
import Zoom from 'react-medium-image-zoom'
import { CodeFigure } from './components/mdx/code-block'
import { MermaidFigure } from './components/mdx/mermaid'
import { ScreenshotLink } from './components/mdx/screenshot-link'
import { normalizeLinkScreenshotTarget } from './lib/link-screenshot'

type MDXComponent = ComponentType<Record<string, unknown>> | keyof React.JSX.IntrinsicElements
type MDXComponents = Record<string, MDXComponent>

const ImageZoomDisabledContext = createContext(false)

function getMDXComponents(components: MDXComponents): MDXComponents {
  return {
    a: MdxAnchor as unknown as MDXComponent,
    figure: CodeFigure as unknown as MDXComponent,
    img: MdxImage as unknown as MDXComponent,
    MermaidFigure: MermaidFigure as unknown as MDXComponent,
    ScreenshotLink: ScreenshotLink as unknown as MDXComponent,
    ...components,
  }
}

function MdxImage({ alt = '', className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const isZoomDisabled = useContext(ImageZoomDisabledContext)
  const imageClassName = ['mdx-zoom-image', className].filter(Boolean).join(' ')

  if (isZoomDisabled) {
    return <img alt={alt} className={imageClassName} {...props} />
  }

  return (
    <Zoom
      a11yNameButtonUnzoom="Close expanded image"
      a11yNameButtonZoom="Expand image"
      classDialog="mdx-image-zoom-dialog"
      wrapElement="span"
      zoomMargin={24}
    >
      <img alt={alt} className={imageClassName} {...props} />
    </Zoom>
  )
}

function MdxAnchor({ children, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href && normalizeLinkScreenshotTarget(href)) {
    return (
      <ScreenshotLink url={href}>
        <ImageZoomDisabledContext.Provider value={true}>
          {children}
        </ImageZoomDisabledContext.Provider>
      </ScreenshotLink>
    )
  }

  return (
    <a href={href} {...props}>
      <ImageZoomDisabledContext.Provider value={true}>{children}</ImageZoomDisabledContext.Provider>
    </a>
  )
}

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return getMDXComponents(components)
}

export const mdxComponents = getMDXComponents({})
