import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
// Experimental React channel export — available because next.config.ts sets
// experimental.viewTransition (see docs/design-language.md, page transitions)
import { Suspense } from 'react'

import { AmbientBackground } from '~/components/ambient-background'
import { Dock, DockFallback } from '~/components/dock'
import { LocaleRestorer } from '~/components/locale-restorer'
import {
  RouteMotionController,
  RouteViewTransition,
} from '~/components/route-motion-controller'
import { SiteFooter } from '~/components/site-footer'
import { ThemeProvider } from '~/components/theme-provider'
import { getGitHub, getSocial } from '~/lib/social-live'
import { PREPAINT_SCRIPT } from '~/lib/security/inline-scripts'
import { seo } from '~/lib/seo'
import type { Locale } from '~/lib/locale-route'
import { cn } from '~/lib/utils'

import { fontVariables } from '../fonts'

export const rootMetadata: Metadata = {
  metadataBase: seo.url,
  title: {
    default: 'Cali Castle',
    template: '%s | Cali Castle',
  },
}

export async function SiteDocument({
  children,
  isAdmin = false,
  locale,
  restoreLocale = false,
}: Readonly<{
  children: React.ReactNode
  isAdmin?: boolean
  locale: Locale
  restoreLocale?: boolean
}>) {
  const english = locale === 'en'

  if (isAdmin) {
    // The owner admin shares the public warm paper, ambient layer, and
    // column geometry, but stays outside public analytics, social reads,
    // and route view transitions — its chrome is the owner dock rendered
    // by the protected admin layout.
    return (
      <html
        lang={english ? 'en' : 'zh-CN'}
        data-locale={english ? 'en' : undefined}
        suppressHydrationWarning
        className={cn('font-sans', fontVariables, 'public-site')}
      >
        <head>
          <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
        </head>
        <body className="antialiased">
          <ThemeProvider>
            {restoreLocale && <LocaleRestorer />}
            <AmbientBackground />
            <div className="flex min-h-screen flex-col pb-20">
              <main className="flex-1 pt-14">{children}</main>
            </div>
          </ThemeProvider>
        </body>
      </html>
    )
  }

  // Live-but-cached social numbers (ISR via the fetch data cache) keep the
  // shared public chrome fresh without making any page request-bound.
  const [social, github] = await Promise.all([getSocial(), getGitHub()])

  return (
    <html
      lang={english ? 'en' : 'zh-CN'}
      data-locale={english ? 'en' : undefined}
      data-route-motion="none"
      suppressHydrationWarning
      className={cn('font-sans', fontVariables, 'public-site')}
    >
      <head>
        {/* Pre-paint handles the visited flag and theme. Locale restoration
            is intentionally limited to /admin; public URLs are explicit. */}
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <RouteMotionController />
          {restoreLocale && <LocaleRestorer />}
          <AmbientBackground />
          <div className="flex min-h-screen flex-col pb-20">
            <main className="flex-1 pt-14">
              {/* The non-none default isolates route content while keeping the
                  CSS-named list → loading shell → article groups active. */}
              <RouteViewTransition>{children}</RouteViewTransition>
            </main>
            <SiteFooter social={social} github={github} locale={locale} />
          </div>
          <Suspense fallback={<DockFallback locale={locale} />}>
            <Dock />
          </Suspense>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
