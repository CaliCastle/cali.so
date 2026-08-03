import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

import { ThemeProvider } from '~/components/theme-provider'
import type { Locale } from '~/lib/locale-route'
import { PREPAINT_SCRIPT } from '~/lib/security/inline-scripts'
import { seo } from '~/lib/seo'
import { cn } from '~/lib/utils'

import { fontVariablesForLocale } from '../fonts'
import styles from '../_views/calibaby-pages.module.css'

export const caliBabyRootMetadata: Metadata = {
  metadataBase: seo.url,
  title: {
    default: 'Cali Baby',
    template: '%s',
  },
}

export function CaliBabyDocument({
  children,
  locale,
}: Readonly<{
  children: React.ReactNode
  locale: Locale
}>) {
  const english = locale === 'en'

  return (
    <html
      lang={english ? 'en' : 'zh-CN'}
      data-locale={locale}
      suppressHydrationWarning
      className={cn(
        'font-sans',
        fontVariablesForLocale(locale),
        styles.document,
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }} />
      </head>
      <body className={cn('antialiased', styles.documentBody)}>
        <ThemeProvider>{children}</ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
