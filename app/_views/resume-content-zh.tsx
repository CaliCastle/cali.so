import 'server-only'

import { ResumePrintButton, ResumeUnlockForm } from '~/components/resume-controls'
import { experience } from '~/lib/personal'
import { projects } from '~/lib/projects'
import type { ChineseResumeContentData } from '~/lib/resume/content-zh'

function Emphasis({ children }: { children: string }) {
  return children.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  )
}

function Bullets({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <ul className="resume-bullets">
      {items.map((item, index) => <li key={index}><Emphasis>{item}</Emphasis></li>)}
    </ul>
  )
}

function SectionTitle({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title">
      <span className="resume-overline" lang="en" aria-hidden="true">{label}</span>
      <span>{children}</span>
    </h2>
  )
}

export function ChineseResumeSections({ content }: { content: ChineseResumeContentData }) {
  return (
    <div className="resume-master resume-master-zh">
      <section className="resume-section">
        <SectionTitle label="Experience">工作经历</SectionTitle>
        <ol className="resume-career">
          {content.experience.map((job) => (
            <li key={job.company} className="resume-job">
              <header className="resume-job-heading">
                <div>
                  <h3>{job.company}</h3>
                  <p className="resume-job-role">{job.role}</p>
                </div>
                <div className="resume-periods">
                  {job.periods.map((period) => <p key={period} className="resume-date">{period}</p>)}
                </div>
              </header>
              {job.description && <p className="resume-job-description">{job.description}</p>}
              <Bullets items={job.bullets} />
              {Boolean(job.engagements?.length) && (
                <section className="resume-engagements" aria-label="代表产品与项目">
                  <p className="resume-subsection-label">代表产品与项目</p>
                  {job.engagements?.map((engagement) => (
                    <section key={engagement.name} className="resume-engagement">
                      <header>
                        <h4>{engagement.name}</h4>
                        <p className="resume-job-role">{engagement.role}</p>
                        {engagement.note && <p className="resume-context-note">{engagement.note}</p>}
                      </header>
                      <Bullets items={engagement.bullets} />
                    </section>
                  ))}
                </section>
              )}
            </li>
          ))}
        </ol>
      </section>

      {content.openSource.length > 0 && (
        <section className="resume-section">
          <SectionTitle label="Open source">开源项目</SectionTitle>
          <div className="resume-section-body">
            {content.openSource.map((project) => (
              <div key={project.name} className="resume-open-source">
                <header>
                  <h3>{project.url ? <a href={project.url} rel="noreferrer">{project.name} ↗</a> : project.name}</h3>
                  <p className="resume-job-role">{project.technology}</p>
                </header>
                <p className="resume-job-description">{project.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {content.capabilities.length > 0 && (
        <section className="resume-section">
          <SectionTitle label="Capabilities">核心能力与常用工具</SectionTitle>
          <dl className="resume-capabilities">
            {content.capabilities.map((capability) => (
              <div key={capability.label}>
                <dt>{capability.label}</dt>
                <dd>{capability.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {content.education.length > 0 && (
        <section className="resume-section">
          <SectionTitle label="Education">教育背景</SectionTitle>
          <div className="resume-section-body">
            {content.education.map((education) => (
              <div key={education.institution} className="resume-education">
                <h3>{education.institution}</h3>
                <p>{education.qualification}</p>
                {education.notes.map((note) => <p key={note}>{note}</p>)}
              </div>
            ))}
            {content.educationNote && <p className="resume-education-note">{content.educationNote}</p>}
          </div>
        </section>
      )}
    </div>
  )
}

function ChineseResumeDraft() {
  const selectedProjects = projects.filter((project) =>
    ['Cali Baby', 'Zolplay Website', 'Raycast · Apple Developer Docs', 'PopMenu'].includes(project.nameEn),
  )
  return (
    <div className="resume-master resume-master-zh">
      <section className="resume-section">
        <SectionTitle label="Experience">经历</SectionTitle>
        <ol className="resume-career">
          {experience.map((job) => (
            <li key={job.company} className="resume-job">
              <header className="resume-job-heading">
                <div>
                  <h3>{job.url ? <a href={job.url} rel="noreferrer">{job.company} ↗</a> : job.company}</h3>
                  <p className="resume-job-role">{job.role}</p>
                </div>
                <p className="resume-date">{job.from} / {job.to ?? '至今'}</p>
              </header>
            </li>
          ))}
        </ol>
      </section>
      <section className="resume-section">
        <SectionTitle label="Selected work">代表作品</SectionTitle>
        <ul className="resume-section-body">
          {selectedProjects.map((project) => (
            <li key={project.nameEn} className="resume-open-source">
              <h3><a href={project.url} rel="noreferrer">{project.name} ↗</a></h3>
              <p className="resume-job-description">{project.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export function ChineseResumeContent({ content }: { content: ChineseResumeContentData | null }) {
  const name = content?.name ?? 'Cali Castle'
  const names = name.split(/\s*\|\s*/)
  return (
    <article className="resume-content">
      <header className="resume-hero">
        <p className="resume-document-label">个人简历<span lang="en">Curriculum vitae</span></p>
        <h1 className="resume-name" aria-label={name}>
          {names.map((part, index) => (
            <span key={index} className={index ? 'resume-name-alternate' : undefined}>{part}</span>
          ))}
        </h1>
        <p className="resume-role">{content?.title ?? '设计工程师 · 创始人 · 创意总监'}</p>
        <div className="resume-introduction">
          <p className="resume-intro">{content?.summary ?? '我是两个孩子的父亲、设计工程师，也是智能体编排者。我创立了佐玩 Zolplay，一家 AI 原生设计工作室，打造产品、品牌与数字体验。我喜欢把细节做到刚刚好。'}</p>
          <div className="resume-contact">
            <a href="mailto:hi@cali.so">hi@cali.so ↗</a>
            <a href="https://github.com/CaliCastle" rel="noreferrer">GitHub ↗</a>
            <a href="https://zolplay.com" rel="noreferrer">Zolplay ↗</a>
          </div>
        </div>
      </header>

      {content ? <ChineseResumeSections content={content} /> : <ChineseResumeDraft />}

      <footer className="resume-footer">
        <p>感谢你花时间了解我。</p>
        <div className="resume-actions">
          <ResumePrintButton locale="zh" />
        </div>
      </footer>
    </article>
  )
}

export function ChineseResumeGate({ error, available }: { error?: string; available: boolean }) {
  return (
    <section className="resume-gate">
      <div className="resume-gate-body">
        <header className="resume-gate-heading">
          <h1>查看我的简历</h1>
        </header>
        <ResumeUnlockForm locale="zh" error={error} available={available} />
      </div>
    </section>
  )
}
