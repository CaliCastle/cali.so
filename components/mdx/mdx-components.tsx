import type { MDXComponents } from 'mdx/types'

import { CodeBlockPre } from './code-block'
import { MermaidDiagram } from './mermaid-diagram'
import { PhotoStack, PhotoStackCaption, PhotoStackFrames } from './photo-stack'
import { TimeAllocationChart } from './time-allocation-chart'
import { Tweet } from './tweet'
import { ExternalLink } from '~/components/external-link'
import { ZoomImage } from '~/components/zoom-image'
import { faviconUrl, getLinkPreview } from '~/lib/link-previews'
import { tiltFromSlug } from '~/lib/polaroid'
import { localePath, type Locale } from '~/lib/locale-route'

// Post images arrive as ./file.png#WxH (dimensions encoded by the content
// pipeline); rewrite to the content route and unpack the dimensions.
function PostImage({ slug, src, alt, title }: { slug: string; src: string; alt?: string; title?: string }) {
  const match = src.match(/^\.\/([A-Za-z0-9_.-]+)#(\d+)x(\d+)$/)
  if (!match) throw new Error(`post image needs ./file#WxH format, got: ${src}`)
  const [, file, width, height] = match
  // deterministic scatter in [-1°, +1°] per file; hover straightens
  const tilt = tiltFromSlug(file) / 2
  const img = (
    <ZoomImage
      src={`/content/blog/${slug}/${file}`}
      alt={alt ?? ''}
      width={+width}
      height={+height}
      sizes="(max-width: 704px) 100vw, 656px"
      style={{ '--img-tilt': `${tilt.toFixed(2)}deg` } as React.CSSProperties}
    />
  )
  if (!title) return img
  // Markdown images render inside <p>, where <figure> is invalid HTML —
  // block-level spans carry the same styling.
  return (
    <span className="post-figure block">
      {img}
      <span className="post-figcaption block">{title}</span>
    </span>
  )
}

export function mdxComponents(slug: string, locale: Locale = 'zh'): MDXComponents {
  return {
    pre: (props) => <CodeBlockPre {...props} />,
    MermaidDiagram: (props: { code: string; caption?: string }) => (
      <MermaidDiagram {...props} locale={locale} />
    ),
    PhotoStack,
    PhotoStackCaption,
    PhotoStackFrames,
    TimeAllocationChart: () => <TimeAllocationChart locale={locale} />,
    Tweet: ({ id }: { id: string }) => <Tweet slug={slug} id={id} />,
    img: (props) => (
      <PostImage slug={slug} src={props.src as string} alt={props.alt} title={props.title} />
    ),
    a: (props) => {
      const href = typeof props.href === 'string' ? props.href : ''
      const favicon = /^https?:/.test(href) ? faviconUrl(href) : null
      if (!favicon) {
        const localizedHref = href.startsWith('/') ? localePath(locale, href) : href
        return (
          <a {...props} href={localizedHref}>
            {props.children}
          </a>
        )
      }
      return (
        <ExternalLink href={href} favicon={favicon} preview={getLinkPreview(href)}>
          {props.children}
        </ExternalLink>
      )
    },
  }
}
