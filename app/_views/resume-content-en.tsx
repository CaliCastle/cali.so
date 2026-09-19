import 'server-only'

import type { ResumeContentData } from '~/lib/resume/content'

function Emphasis({ children }: { children: string }) {
  // Only bold spans are supported. All other content stays escaped text;
  // private configuration can never execute MDX or inject HTML.
  return children.split(/(\*\*[^*]+\*\*)/g).map((part, index) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={index}>{part.slice(2, -2)}</strong>
      : part,
  )
}

function Bullets({ items }: { items: string[] }) {
  return <ul className="resume-bullets">{items.map((item, index) => <li key={index}><Emphasis>{item}</Emphasis></li>)}</ul>
}

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <h2 className="section-tag">
      <span className="section-tag-index" aria-hidden="true">{index}</span>
      <span className="section-tag-hatch" aria-hidden="true" />
      <span className="section-tag-label">{children}</span>
    </h2>
  )
}

export function EnglishResumeSections({ content }: { content: ResumeContentData }) {
  return (
    <div className="resume-master">
      <section className="resume-section">
        <SectionTitle index="01">Experience</SectionTitle>
        <ol className="resume-career">
          {content.experience.map((job) => (
            <li key={job.company} className="resume-job hairline-top">
              <header className="resume-job-heading">
                <div>
                  <h3>{job.company}</h3>
                  <p className="resume-job-role">{job.role}</p>
                </div>
                <p className="resume-date">{job.period}</p>
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

      {content.capabilities.length > 0 && (
        <section className="resume-section">
          <SectionTitle index="02">Capabilities & toolkit</SectionTitle>
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
          <SectionTitle index={content.capabilities.length > 0 ? '03' : '02'}>Education</SectionTitle>
          {content.education.map((education) => (
            <div key={education.institution} className="resume-education hairline-top">
              <h3>{education.institution}</h3>
              <p>{education.qualification}</p>
            </div>
          ))}
        </section>
      )}
    </div>
  )
}
