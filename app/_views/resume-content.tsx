import 'server-only'

import { PixelCluster } from '~/components/pixel-cluster'
import { ResumePrintButton } from '~/components/resume-controls'
import { localize, localePath, type Locale } from '~/lib/locale-route'
import { experience } from '~/lib/personal'
import { projects } from '~/lib/projects'

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <h2 className="section-tag">
      <span className="section-tag-index" aria-hidden="true">{index}</span>
      <span className="section-tag-hatch" aria-hidden="true" />
      <span className="section-tag-label">{children}</span>
    </h2>
  )
}

// This first edition uses only facts already published in the site's registries.
// Keep future private copy in server-only modules; never put it in public/.
export function ResumeContent({ locale }: { locale: Locale }) {
  const selectedProjects = projects.filter((project) =>
    ['Cali Baby', 'Zolplay Website', 'Raycast · Apple Developer Docs', 'PopMenu'].includes(project.nameEn),
  )

  return (
    <article className="resume-content">
      <header>
        <div className="flex items-center justify-between gap-4">
          <p className="page-eyebrow">{localize(locale, '简历', 'Curriculum vitæ')}</p>
          <PixelCluster variant={5} />
        </div>
        <h1 className="resume-name">Cali Castle</h1>
        <p className="resume-role">{localize(locale, '设计工程师 · 创始人 · 创意总监', 'Design engineer · Founder · Creative director')}</p>
        <p className="resume-intro">{localize(locale,
          '我是两个孩子的父亲、设计工程师，也是智能体编排者。我创立了佐玩 Zolplay，一家 AI 原生设计工作室，打造产品、品牌与数字体验。我喜欢把细节做到刚刚好。',
          'I’m a father of two, a design engineer, and an agent orchestrator. I founded Zolplay, an AI-native design studio creating products, brands, and digital experiences. I love getting the details just right.')}</p>
        <div className="resume-contact">
          <a href="mailto:hi@cali.so">hi@cali.so ↗</a>
          <a href="https://github.com/CaliCastle" rel="noreferrer">GitHub ↗</a>
          <a href="https://zolplay.com" rel="noreferrer">Zolplay ↗</a>
        </div>
      </header>

      <section className="resume-section">
        <SectionTitle index="01">{localize(locale, '经历', 'Experience')}</SectionTitle>
        <ol className="resume-experience">
          {experience.map((job) => (
            <li key={job.company} className="resume-entry hairline-top">
              <p className="resume-date">{job.from} <span aria-hidden="true">/</span> {job.to ?? localize(locale, '至今', 'Present')}</p>
              <div>
                <h3>{job.url ? <a href={job.url} rel="noreferrer">{localize(locale, job.company, job.companyEn)} ↗</a> : localize(locale, job.company, job.companyEn)}</h3>
                <p className="text-muted-foreground">{localize(locale, job.role, job.roleEn ?? job.role)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="resume-section">
        <SectionTitle index="02">{localize(locale, '代表作品', 'Selected work')}</SectionTitle>
        <ul className="resume-projects">
          {selectedProjects.map((project) => (
            <li key={project.nameEn} className="resume-project hairline-top">
              <h3><a href={project.url.startsWith('/') ? localePath(locale, project.url) : project.url} rel="noreferrer">{localize(locale, project.name, project.nameEn)} ↗</a></h3>
              <p>{localize(locale, project.description, project.descriptionEn ?? project.description)}</p>
            </li>
          ))}
        </ul>
      </section>

      <footer className="resume-footer hairline-top">
        <p>{localize(locale, '感谢你花时间了解我。', 'Thanks for taking a closer look.')}</p>
        <div className="resume-actions">
          <ResumePrintButton locale={locale} />
          <form action="/api/resume/lock" method="post">
            <input type="hidden" name="locale" value={locale} />
            <button type="submit" className="resume-text-control">{localize(locale, '锁定简历', 'Lock résumé')} <span aria-hidden="true">↗</span></button>
          </form>
        </div>
      </footer>
    </article>
  )
}
