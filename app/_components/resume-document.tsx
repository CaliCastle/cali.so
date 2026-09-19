import type { Metadata } from 'next'

import { localePath, type Locale } from '~/lib/locale-route'
import { nonPublicRobots } from '~/lib/non-public-metadata'
import { rootMetadata, SiteDocument } from './site-document'

export const resumeMetadata: Metadata = {
  ...rootMetadata,
  title: 'Résumé',
  description: 'A private résumé, shared by invitation.',
  robots: { ...nonPublicRobots, noarchive: true, nosnippet: true },
  referrer: 'same-origin',
}

export function ResumeDocument({ children, locale }: { children: React.ReactNode; locale: Locale }) {
  return (
    <SiteDocument isPrivate locale={locale}>
      <div className="resume-page mx-auto w-full max-w-[37.5rem] px-6">
        <nav aria-label={locale === 'en' ? 'Page navigation' : '页面导航'} className="resume-nav">
          <a href={localePath(locale, '/')} className="resume-text-control">← cali.so</a>
          <a
            href={localePath(locale === 'en' ? 'zh' : 'en', '/resume')}
            hrefLang={locale === 'en' ? 'zh-CN' : 'en'}
            lang={locale === 'en' ? 'zh-CN' : 'en'}
            className="resume-text-control"
          >
            {locale === 'en' ? '中文' : 'English'}
          </a>
        </nav>
        {children}
      </div>
    </SiteDocument>
  )
}
