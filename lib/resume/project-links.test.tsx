import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { EnglishResumeSections } from '~/app/_views/resume-content-en'
import { ChineseResumeSections } from '~/app/_views/resume-content-zh'
import { parseResumeContent } from './content'
import { parseChineseResumeContent } from './content-zh'
import { resumeContentFixture } from './testing'
import { chineseResumeContentFixture } from './testing-zh'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')
const projectUrl = 'https://github.com/example/project'

for (const variant of [
  {
    locale: 'en',
    clientsLabel: 'Selected clients:',
    fixture: resumeContentFixture,
    parse: parseResumeContent,
    render: (encoded: string) => renderToStaticMarkup(<EnglishResumeSections content={parseResumeContent(encoded)!} />),
  },
  {
    locale: 'zh',
    clientsLabel: '代表客户：',
    fixture: chineseResumeContentFixture,
    parse: parseChineseResumeContent,
    render: (encoded: string) => renderToStaticMarkup(<ChineseResumeSections content={parseChineseResumeContent(encoded)!} />),
  },
]) {
  describe(`${variant.locale} résumé selected clients`, () => {
    it('preserves client names and renders them as escaped text with a localized label', () => {
      const content = structuredClone(variant.fixture)
      content.experience[0].selectedClients = ['Example & Co.', '<Example studio>']
      const encoded = encode(content)
      expect(variant.parse(encoded)?.experience[0].selectedClients).toEqual(content.experience[0].selectedClients)
      const html = variant.render(encoded)
      expect(html).toContain(`<strong>${variant.clientsLabel}</strong>`)
      expect(html).toContain('Example &amp; Co. · &lt;Example studio&gt;')
      expect(html).not.toContain('<Example studio>')
    })

    it.each([undefined, []])('omits the client line when the list is %j', (selectedClients) => {
      const content = structuredClone(variant.fixture)
      content.experience[0].selectedClients = selectedClients
      const html = variant.render(encode(content))
      expect(html).not.toContain('resume-clients')
      expect(html).not.toContain(variant.clientsLabel)
    })
  })

  describe(`${variant.locale} résumé project links`, () => {
    it('links HTTPS projects without forwarding the private page URL', () => {
      const content = structuredClone(variant.fixture)
      content.openSource![0].url = projectUrl
      const encoded = encode(content)
      expect(variant.parse(encoded)?.openSource?.[0].url).toBe(projectUrl)
      expect(variant.render(encoded)).toContain(`<a href="${projectUrl}" rel="noreferrer">`)
    })

    it('keeps existing projects without URLs as plain text', () => {
      const html = variant.render(encode(variant.fixture))
      expect(html).toContain(variant.fixture.openSource![0].name)
      expect(html).not.toContain('<a ')
    })

    it.each(['javascript:alert(1)', 'data:text/html,unsafe', 'http://example.com', '/relative'])('rejects an unsafe project URL: %s', (url) => {
      const content = structuredClone(variant.fixture)
      content.openSource![0].url = url
      expect(() => variant.parse(encode(content))).toThrow(/Invalid private .*resume content configuration/)
    })
  })
}
