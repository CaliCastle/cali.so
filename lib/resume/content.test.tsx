import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { EnglishResumeSections } from '~/app/_views/resume-content-en'
import { ResumeContent } from '~/app/_views/resume-content'
import { getEnglishResumeContent, parseResumeContent } from './content'
import { resumeContentFixture } from './testing'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

afterEach(() => vi.unstubAllEnvs())

describe('private English resume content', () => {
  it('loads the complete document from server configuration', () => {
    vi.stubEnv('RESUME_EN_CONTENT_BASE64', encode(resumeContentFixture))
    expect(getEnglishResumeContent()).toEqual(resumeContentFixture)
    expect(parseResumeContent(undefined)).toBeNull()
  })

  it('rejects invalid or oversized content without exposing private values', () => {
    for (const value of ['not base64', encode({ summary: 'sensitive fixture text' }), 'A'.repeat(60_001)]) {
      expect(() => parseResumeContent(value)).toThrow('Invalid private resume content configuration')
    }
  })

  it('renders achievements, shipped products, toolkit, and education with safe emphasis', () => {
    const content = structuredClone(resumeContentFixture)
    content.experience[0].bullets.push('<script>unsafe()</script> **Safe emphasis**')
    const html = renderToStaticMarkup(<EnglishResumeSections content={content} />)
    expect(html).toContain('<strong>Synthetic achievement</strong>')
    expect(html).toContain('Example internal product')
    expect(html).toContain('Example university')
    expect(html).not.toContain('<script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html.indexOf('Example internal product')).toBeLessThan(html.indexOf('Example capability'))
  })

  it('updates only English and leaves the Chinese résumé unchanged', () => {
    vi.stubEnv('RESUME_EN_CONTENT_BASE64', '')
    const previousChinese = renderToStaticMarkup(<ResumeContent locale="zh" />)
    vi.stubEnv('RESUME_EN_CONTENT_BASE64', encode(resumeContentFixture))
    expect(renderToStaticMarkup(<ResumeContent locale="zh" />)).toBe(previousChinese)
    expect(renderToStaticMarkup(<ResumeContent locale="en" />)).toContain(resumeContentFixture.summary)
  })
})
