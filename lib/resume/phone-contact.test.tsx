import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { ResumeContent } from '~/app/_views/resume-content'
import { parseResumeContent } from './content'
import { parseChineseResumeContent } from './content-zh'
import { resumeContentFixture } from './testing'
import { chineseResumeContentFixture } from './testing-zh'

const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64')

afterEach(() => vi.unstubAllEnvs())

for (const variant of [
  { locale: 'en', key: 'RESUME_EN_CONTENT_BASE64', fixture: resumeContentFixture, parse: parseResumeContent },
  { locale: 'zh', key: 'RESUME_ZH_CONTENT_BASE64', fixture: chineseResumeContentFixture, parse: parseChineseResumeContent },
] as const) {
  describe(`${variant.locale} private phone contact`, () => {
    it.each(['+12025550100', ' +1 202 555 0100 ', '+1-202-555-0100'])(
      'preserves display formatting and normalizes the call link for %s', (phone) => {
        const encoded = encode({ ...variant.fixture, phone })
        expect(variant.parse(encoded)?.phone).toBe(phone.trim())
        vi.stubEnv(variant.key, encoded)
        const html = renderToStaticMarkup(<ResumeContent locale={variant.locale} />)
        expect(html).toContain('href="tel:+12025550100"')
        expect(html).toContain(`<span>${phone.trim()}</span>`)
      },
    )

    it('keeps legacy documents without a phone contact working', () => {
      const encoded = encode(variant.fixture)
      expect(variant.parse(encoded)).toEqual(variant.fixture)
      vi.stubEnv(variant.key, encoded)
      const html = renderToStaticMarkup(<ResumeContent locale={variant.locale} />)
      expect(html).not.toContain('href="tel:')
      expect(html).toContain('href="mailto:hi@cali.so"')
    })

    it.each(['12025550100', 'javascript:alert(1)', '+12025550100?body=hello', '', '+1' + '2'.repeat(32)])(
      'rejects invalid phone configuration without exposing its value: %s', (phone) => {
        expect(() => variant.parse(encode({ ...variant.fixture, phone }))).toThrow(
          variant.locale === 'en'
            ? 'Invalid private resume content configuration'
            : 'Invalid private Chinese resume content configuration',
        )
      },
    )
  })
}
