import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fontVariablesForLocale } = vi.hoisted(() => ({
  fontVariablesForLocale: vi.fn((locale: 'zh' | 'en') =>
    locale === 'zh' ? 'latin-font cjk-font' : 'latin-font',
  ),
}))

vi.mock('react', async (importOriginal) => {
  const react = await importOriginal<typeof import('react')>()

  return {
    ...react,
    ViewTransition: ({ children }: { children: React.ReactNode }) => children,
  }
})

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <span data-vercel-analytics="" />,
}))

vi.mock('~/components/ambient-background', () => ({
  AmbientBackground: () => null,
}))
vi.mock('~/components/dock', () => ({
  Dock: () => <span data-public-dock="" />,
  DockFallback: () => <span data-public-dock-fallback="" />,
}))
vi.mock('~/components/locale-restorer', () => ({
  LocaleRestorer: () => null,
}))
vi.mock('~/components/locale-suggestion', () => ({
  LocaleSuggestion: ({ locale }: { locale: 'zh' | 'en' }) => (
    <span data-locale-suggestion={locale} />
  ),
}))
vi.mock('~/components/preview-card-timing', () => ({
  PreviewCardTimingProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-public-preview-cards="">{children}</div>
  ),
}))
vi.mock('~/components/site-footer', () => ({
  SiteFooter: () => <span data-public-footer="" />,
}))
vi.mock('~/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
vi.mock('~/lib/security/inline-scripts', () => ({
  PREPAINT_SCRIPT: '',
}))
vi.mock('~/lib/social-live', () => ({
  getGitHub: vi.fn().mockResolvedValue({}),
  getSocial: vi.fn().mockResolvedValue({}),
}))
vi.mock('~/components/route-motion-controller', () => ({
  RouteMotionController: () => <span data-public-route-motion="" />,
  RouteViewTransition: ({ children }: { children: React.ReactNode }) => (
    <div data-public-route-transition="">{children}</div>
  ),
}))
vi.mock('./fonts', () => ({
  fontVariablesForLocale,
}))

import { SiteDocument } from './_components/site-document'
import { getGitHub, getSocial } from '~/lib/social-live'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SiteDocument analytics', () => {
  it('keeps private documents outside public analytics and social reads', async () => {
    const html = renderToStaticMarkup(await SiteDocument({ children: <p>Private document</p>, isPrivate: true, locale: 'en' }))
    expect(html).toContain('Private document')
    expect(html).not.toContain('data-vercel-analytics')
    expect(html).not.toContain('data-public-dock')
    expect(html).not.toContain('data-public-footer')
    expect(getSocial).not.toHaveBeenCalled()
    expect(getGitHub).not.toHaveBeenCalled()
  })

  it('activates the CJK font only for Chinese documents', async () => {
    const chinese = renderToStaticMarkup(
      await SiteDocument({ children: <p>中文页面</p>, locale: 'zh' }),
    )
    const english = renderToStaticMarkup(
      await SiteDocument({ children: <p>English page</p>, locale: 'en' }),
    )

    expect(chinese).toContain('cjk-font')
    expect(english).not.toContain('cjk-font')
    expect(fontVariablesForLocale).toHaveBeenCalledWith('zh')
    expect(fontVariablesForLocale).toHaveBeenCalledWith('en')
  })

  it('collects page views across the public route families', async () => {
    for (const locale of ['zh', 'en'] as const) {
      const html = renderToStaticMarkup(
        await SiteDocument({
          children: <p>Public page</p>,
          locale,
        }),
      )

      expect(html).toContain('data-vercel-analytics')
      expect(html).toContain('data-public-dock')
      expect(html).toContain('data-public-footer')
      expect(html).toContain('data-public-route-transition')
      expect(html).toContain('data-public-preview-cards')
      expect(html).toContain(`data-locale-suggestion="${locale}"`)
    }
  })

  it('keeps owner-admin routes outside public chrome and social reads', async () => {
    const html = renderToStaticMarkup(
      await SiteDocument({
        children: <p>Owner admin</p>,
        isAdmin: true,
        locale: 'zh',
      }),
    )

    expect(html).not.toContain('data-vercel-analytics')
    expect(html).not.toContain('data-public-dock')
    expect(html).not.toContain('data-public-footer')
    expect(html).not.toContain('data-public-route-motion')
    expect(html).not.toContain('data-public-route-transition')
    expect(html).not.toContain('data-public-preview-cards')
    expect(html).not.toContain('data-locale-suggestion')
    expect(html).toContain('Owner admin')
    // The admin shares the warm working-paper palette (July 2026 decision)
    // while staying outside analytics and social reads.
    expect(html).toContain('public-site')
    expect(getSocial).not.toHaveBeenCalled()
    expect(getGitHub).not.toHaveBeenCalled()
  })
})
