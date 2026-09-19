import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { ResumeContent } from '~/app/_views/resume-content'
import { ChineseResumeSections } from '~/app/_views/resume-content-zh'
import { getChineseResumeContent, parseChineseResumeContent } from './content-zh'
import { resumeContentFixture } from './testing'
import { chineseResumeContentFixture } from './testing-zh'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

beforeEach(() => {
  vi.stubEnv('RESUME_EN_CONTENT_BASE64', '')
  vi.stubEnv('RESUME_ZH_CONTENT_BASE64', '')
})
afterEach(() => vi.unstubAllEnvs())

describe('private Chinese resume content', () => {
  it('loads the complete document and retains the public draft when unconfigured', () => {
    expect(parseChineseResumeContent(undefined)).toBeNull()
    expect(parseChineseResumeContent(' ')).toBeNull()
    expect(renderToStaticMarkup(<ResumeContent locale="zh" />)).toContain('代表作品')
    vi.stubEnv('RESUME_ZH_CONTENT_BASE64', encode(chineseResumeContentFixture))
    expect(getChineseResumeContent()).toEqual(chineseResumeContentFixture)
    expect(renderToStaticMarkup(<ResumeContent locale="zh" />)).toContain(chineseResumeContentFixture.summary)
  })

  it('rejects malformed or oversized content without exposing private values', () => {
    const invalidRole = structuredClone(chineseResumeContentFixture)
    invalidRole.experience[0].bullets = []
    for (const value of [
      'not base64',
      Buffer.from('private malformed JSON').toString('base64'),
      encode({ summary: 'sensitive fixture text' }),
      encode(invalidRole),
      'A'.repeat(60_001),
    ]) {
      try {
        parseChineseResumeContent(value)
        expect.fail('Expected invalid content to be rejected')
      } catch (error) {
        expect((error as Error).message).toBe('Invalid private Chinese resume content configuration')
      }
    }
  })

  it('preserves dates, paragraph roles, project order, open source, and education notes', () => {
    const html = renderToStaticMarkup(<ChineseResumeSections content={chineseResumeContentFixture} />)
    for (const text of [
      ...chineseResumeContentFixture.experience[0].periods,
      chineseResumeContentFixture.experience[1].description!,
      chineseResumeContentFixture.openSource[0].description,
      chineseResumeContentFixture.education[0].notes[0],
      chineseResumeContentFixture.educationNote!,
    ]) expect(html).toContain(text)
    const sections = ['工作经历', '示例产品', '开源项目', '核心能力与常用工具', '教育背景']
    for (let i = 1; i < sections.length; i++) {
      expect(html.indexOf(sections[i - 1])).toBeLessThan(html.indexOf(sections[i]))
    }
    expect(html).not.toContain('<ul class="resume-bullets"></ul>')
  })

  it('supports emphasis without interpreting HTML or executable content', () => {
    const content = structuredClone(chineseResumeContentFixture)
    content.experience[0].bullets.push('<script>unsafe()</script> **安全强调**')
    const html = renderToStaticMarkup(<ChineseResumeSections content={content} />)
    expect(html).toContain('<strong>安全强调</strong>')
    expect(html).toContain('&lt;script&gt;unsafe()&lt;/script&gt;')
    expect(html).not.toContain('<script>')
  })

  it.each(['', encode(resumeContentFixture)])('leaves English unchanged with Chinese content or a Chinese configuration error', (english) => {
    vi.stubEnv('RESUME_EN_CONTENT_BASE64', english)
    const previousEnglish = renderToStaticMarkup(<ResumeContent locale="en" />)
    for (const chinese of [encode(chineseResumeContentFixture), 'invalid']) {
      vi.stubEnv('RESUME_ZH_CONTENT_BASE64', chinese)
      expect(renderToStaticMarkup(<ResumeContent locale="en" />)).toBe(previousEnglish)
    }
  })

  it('does not depend on English configuration to render Chinese', () => {
    vi.stubEnv('RESUME_ZH_CONTENT_BASE64', encode(chineseResumeContentFixture))
    vi.stubEnv('RESUME_EN_CONTENT_BASE64', 'invalid')
    expect(renderToStaticMarkup(<ResumeContent locale="zh" />)).toContain(chineseResumeContentFixture.summary)
  })
})
