import 'server-only'

import { ResumePrintButton } from '~/components/resume-controls'
import { localize, localePath, type Locale } from '~/lib/locale-route'
import { experience } from '~/lib/personal'
import { projects } from '~/lib/projects'
import { getEnglishResumeContent } from '~/lib/resume/content'
import { getChineseResumeContent } from '~/lib/resume/content-zh'

import { EnglishResumeSections } from './resume-content-en'
import { ChineseResumeContent } from './resume-content-zh'

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title">
      <span className="resume-overline" aria-hidden="true">{index}</span>
      <span>{children}</span>
    </h2>
  )
}

// The default draft uses published facts. Detailed localized copy is loaded
// from server configuration only after ResumePage verifies access.
export function ResumeContent({ locale }: { locale: Locale }) {
  if (locale === 'zh') return <ChineseResumeContent content={getChineseResumeContent()} />

  const englishContent = locale === 'en' ? getEnglishResumeContent() : null
  const localizedContent = englishContent
  const name = localizedContent?.name ?? 'Cali Castle'
  const names = name.split(/\s*\|\s*/)
  const selectedProjects = projects.filter((project) =>
    ['Cali Baby', 'Zolplay Website', 'Raycast · Apple Developer Docs', 'PopMenu'].includes(project.nameEn),
  )

  return (
    <article className="resume-content">
      <header className="resume-hero">
        <p className="resume-document-label">Curriculum vitae</p>
        <h1 className="resume-name" aria-label={name}>
          {names.map((part, index) => (
            <span key={index} className={index ? 'resume-name-alternate' : undefined}>{part}</span>
          ))}
        </h1>
        <p className="resume-role">{localizedContent?.title ?? localize(locale, '设计工程师 · 创始人 · 创意总监', 'Design engineer · Founder · Creative director')}</p>
        <div className="resume-introduction">
          <p className="resume-intro">{localizedContent?.summary ?? localize(locale,
            '我是两个孩子的父亲、设计工程师，也是智能体编排者。我创立了佐玩 Zolplay，一家 AI 原生设计工作室，打造产品、品牌与数字体验。我喜欢把细节做到刚刚好。',
            'I’m a father of two, a design engineer, and an agent orchestrator. I founded Zolplay, an AI-native design studio creating products, brands, and digital experiences. I love getting the details just right.')}</p>
          <div className="resume-contact">
            <a href="mailto:hi@cali.so">hi@cali.so ↗</a>
            {localizedContent?.phone && <a href={`tel:${localizedContent.phone.replace(/[ -]/g, '')}`}>{localizedContent.phone}</a>}
            <a href="https://github.com/CaliCastle" rel="noreferrer">GitHub ↗</a>
            <a href="https://zolplay.com" rel="noreferrer">Zolplay ↗</a>
          </div>
        </div>
      </header>

      {englishContent ? (
        <EnglishResumeSections content={englishContent} />
      ) : (
        <div className="resume-master resume-master-en">
          <section className="resume-section">
            <SectionTitle index="01">{localize(locale, '经历', 'Experience')}</SectionTitle>
            <ol className="resume-career">
              {experience.map((job) => (
                <li key={job.company} className="resume-job">
                  <header className="resume-job-heading">
                    <div>
                      <h3>{job.url ? <a href={job.url} rel="noreferrer">{localize(locale, job.company, job.companyEn)} ↗</a> : localize(locale, job.company, job.companyEn)}</h3>
                      <p className="resume-job-role">{localize(locale, job.role, job.roleEn ?? job.role)}</p>
                    </div>
                    <p className="resume-date">{job.from} <span aria-hidden="true">/</span> {job.to ?? localize(locale, '至今', 'Present')}</p>
                  </header>
                </li>
              ))}
            </ol>
          </section>

          <section className="resume-section">
            <SectionTitle index="02">{localize(locale, '代表作品', 'Selected work')}</SectionTitle>
            <ul className="resume-section-body">
              {selectedProjects.map((project) => (
                <li key={project.nameEn} className="resume-open-source">
                  <h3><a href={project.url.startsWith('/') ? localePath(locale, project.url) : project.url} rel="noreferrer">{localize(locale, project.name, project.nameEn)} ↗</a></h3>
                  <p className="resume-job-description">{localize(locale, project.description, project.descriptionEn ?? project.description)}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <footer className="resume-footer">
        <p>{localize(locale, '感谢你花时间了解我。', 'Thanks for taking a closer look.')}</p>
        <div className="resume-actions">
          <ResumePrintButton locale={locale} />
        </div>
      </footer>
    </article>
  )
}
