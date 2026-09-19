import 'server-only'

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

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <h2 className="section-tag">
      <span className="section-tag-index" aria-hidden="true">{String(index).padStart(2, '0')}</span>
      <span className="section-tag-hatch" aria-hidden="true" />
      <span className="section-tag-label">{children}</span>
    </h2>
  )
}

export function ChineseResumeSections({ content }: { content: ChineseResumeContentData }) {
  let sectionIndex = 0
  return (
    <div className="resume-master resume-master-zh">
      <section className="resume-section">
        <SectionTitle index={++sectionIndex}>工作经历</SectionTitle>
        <ol className="resume-career">
          {content.experience.map((job) => (
            <li key={job.company} className="resume-job hairline-top">
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
          <SectionTitle index={++sectionIndex}>开源项目</SectionTitle>
          {content.openSource.map((project) => (
            <div key={project.name} className="resume-open-source hairline-top">
              <header>
                <h3>{project.name}</h3>
                <p className="resume-job-role">{project.technology}</p>
              </header>
              <p className="resume-job-description">{project.description}</p>
            </div>
          ))}
        </section>
      )}

      {content.capabilities.length > 0 && (
        <section className="resume-section">
          <SectionTitle index={++sectionIndex}>核心能力与常用工具</SectionTitle>
          <dl className="resume-capabilities">
            {content.capabilities.map((capability) => (
              <div key={capability.label} className="hairline-top">
                <dt>{capability.label}</dt>
                <dd>{capability.description}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {content.education.length > 0 && (
        <section className="resume-section">
          <SectionTitle index={++sectionIndex}>教育背景</SectionTitle>
          {content.education.map((education) => (
            <div key={education.institution} className="resume-education hairline-top">
              <h3>{education.institution}</h3>
              <p>{education.qualification}</p>
              {education.notes.map((note) => <p key={note}>{note}</p>)}
            </div>
          ))}
          {content.educationNote && <p className="resume-education-note">{content.educationNote}</p>}
        </section>
      )}
    </div>
  )
}
