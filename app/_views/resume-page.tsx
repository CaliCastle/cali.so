import 'server-only'

import { ResumeUnlockForm } from '~/components/resume-controls'
import type { Locale } from '~/lib/locale-route'
import { resumeCredentials } from '~/lib/resume/access'
import { hasResumeAccess } from '~/lib/resume/server'

import { ResumeContent } from './resume-content'
import { ChineseResumeGate } from './resume-content-zh'

export type ResumePageProps = {
  searchParams: Promise<{ access?: string | string[] }>
}

const messages: Record<string, { zh: string; en: string }> = {
  incorrect: { zh: '口令不正确，请再试一次。', en: 'That passphrase isn’t right. Please try again.' },
  limited: { zh: '尝试次数过多，请在 15 分钟后重试。', en: 'Too many attempts. Please try again in 15 minutes.' },
  unavailable: { zh: '暂时无法访问，请稍后再试。', en: 'Access is temporarily unavailable. Please try again later.' },
}

export async function ResumePage({ locale, searchParams }: ResumePageProps & { locale: Locale }) {
  // Nothing from the résumé is rendered, serialized, or cached before this check.
  if (await hasResumeAccess()) return <ResumeContent locale={locale} />

  const { access } = await searchParams
  const error = typeof access === 'string' ? messages[access]?.[locale] : undefined
  if (locale === 'zh') return <ChineseResumeGate error={error} available={Boolean(resumeCredentials())} />

  return (
    <section className="resume-gate">
      <div className="resume-gate-body">
        <header className="resume-gate-heading">
          <h1>View my résumé</h1>
        </header>
        <ResumeUnlockForm locale={locale} error={error} available={Boolean(resumeCredentials())} />
      </div>
    </section>
  )
}
