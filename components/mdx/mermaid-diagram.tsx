import { renderMermaidSVG } from 'beautiful-mermaid'

import { ScrollAreaX } from '~/components/ui/scroll-area'
import { localize, type Locale } from '~/lib/locale-route'

// The library inlines Google Fonts imports for its default typefaces; fonts
// are self-hosted here, so drop them and let .mermaid-figure css restore the
// site stacks.
const FONT_IMPORTS = /^\s*@import url\('https:\/\/fonts\.googleapis\.com[^']*'\);\n?/gm

export function MermaidDiagram({
  code,
  caption,
  locale = 'zh',
}: {
  code: string
  caption?: string
  locale?: Locale
}) {
  let svg: string
  try {
    // Colors are emitted as CSS variables on the svg element, so light/dark
    // both resolve at paint time from the same markup — no dual render.
    svg = renderMermaidSVG(code, {
      bg: 'var(--surface-1)',
      fg: 'var(--foreground)',
      muted: 'var(--muted-foreground)',
      accent: 'var(--signal)',
      transparent: true,
      padding: 24,
    })
  } catch (error) {
    throw new Error(
      `mermaid diagram failed to render: ${error instanceof Error ? error.message : String(error)}\n${code}`,
    )
  }

  const sheet = (
    <div className="mermaid-frame">
      <ScrollAreaX>
        <div
          className="mermaid-sheet"
          role="img"
          // role="img" needs a name even without a caption; the generic
          // fallback beats AT reading the svg's positioned text fragments
          aria-label={caption ?? localize(locale, '图表', 'Diagram')}
          // trusted-input boundary: diagram source is repo-committed MDX
          // rendered at build time, never user-supplied — revisit with a
          // sanitizer before ever feeding this component runtime input
          dangerouslySetInnerHTML={{ __html: svg.replace(FONT_IMPORTS, '') }}
        />
      </ScrollAreaX>
    </div>
  )
  if (!caption) return <figure className="mermaid-figure">{sheet}</figure>
  return (
    <figure className="post-figure mermaid-figure">
      {sheet}
      <figcaption className="post-figcaption">{caption}</figcaption>
    </figure>
  )
}
