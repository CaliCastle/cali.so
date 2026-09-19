import type { Metadata } from 'next'

import { localePath, type Locale } from '~/lib/locale-route'
import { nonPublicRobots } from '~/lib/non-public-metadata'
import { cjkFontVariableForLocale } from '../fonts'
import { rootMetadata } from './site-document'

export const resumeMetadata: Metadata = {
  ...rootMetadata,
  title: 'Résumé',
  description: 'A private résumé, shared by invitation.',
  robots: { ...nonPublicRobots, noarchive: true, nosnippet: true },
  referrer: 'same-origin',
}

export function ResumeDocument({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <html lang={locale === 'en' ? 'en' : 'zh-CN'} className={['resume-swiss', cjkFontVariableForLocale(locale)].filter(Boolean).join(' ')}>
      <body>
        <div className="resume-page">
          <nav aria-label={locale === 'en' ? 'Page navigation' : '页面导航'} className="resume-nav">
            <a href={localePath(locale, '/')} className="resume-text-control">← cali.so</a>
            <a
              href={localePath(locale === 'en' ? 'zh' : 'en', '/resume')}
              hrefLang={locale === 'en' ? 'zh-CN' : 'en'}
              lang={locale === 'en' ? 'zh-CN' : 'en'}
              className="resume-text-control"
            >
              {locale === 'en' ? '中文' : 'English ↗'}
            </a>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
