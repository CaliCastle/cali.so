import 'server-only'

import type { ResumeContentData } from '~/lib/resume/content'

function Emphasis({ children }: { children: string }) {
  // Only bold and italic spans are supported. All other content stays escaped text;
  // private configuration can never execute MDX or inject HTML.
  return children.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part.startsWith('*') && part.endsWith('*')
      ? <em key={index}>{part.slice(1, -1)}</em>
      : part,
  )
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="resume-bullets">{items.map((item, index) => <li key={index}><Emphasis>{item}</Emphasis></li>)}</ul>
}

function SectionTitle({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <h2 className="resume-section-title">
      <span className="resume-overline" aria-hidden="true">{String(index).padStart(2, '0')}</span>
      <span>{children}</span>
    </h2>
  )
}

export function EnglishResumeSections({ content }: { content: ResumeContentData }) {
  let sectionIndex = 0
  return (
    <div className="resume-master resume-master-en">
      <section className="resume-section">
        <SectionTitle index={++sectionIndex}>Experience</SectionTitle>
        <ol className="resume-career">
          {content.experience.map((job) => (
            <li key={job.company} className="resume-job">
              <header className="resume-job-heading">
                <div>
                  <h3>{job.company}</h3>
                  <p className="resume-job-role">{job.role}</p>
                </div>
                <div className="resume-periods">
                  {(Array.isArray(job.period) ? job.period : [job.period]).map((period) => (
                    <p key={period} className="resume-date">{period}</p>
                  ))}
                </div>
              </header>
              <Bullets items={job.bullets} />
              {Boolean(job.engagements?.length) && (
                <section className="resume-engagements" aria-label="Selected products and engagements">
                  <p className="resume-subsection-label">Selected products and engagements</p>
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

      {Boolean(content.openSource?.length) && (
        <section className="resume-section">
          <SectionTitle index={++sectionIndex}>Open source</SectionTitle>
          <div className="resume-section-body">
            {content.openSource?.map((project) => (
              <div key={project.name} className="resume-open-source">
                <header>
                  <h3>{project.name}</h3>
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
          <SectionTitle index={++sectionIndex}>Selected capabilities & toolkit</SectionTitle>
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
          <SectionTitle index={++sectionIndex}>Education</SectionTitle>
          <div className="resume-section-body">
            {content.education.map((education) => (
              <div key={education.institution} className="resume-education">
                <h3>{education.institution}</h3>
                <p>{education.qualification}</p>
                {education.notes?.map((note) => <p key={note}>{note}</p>)}
              </div>
            ))}
            {content.educationNote && <p className="resume-education-note">{content.educationNote}</p>}
          </div>
        </section>
      )}
    </div>
  )
}
