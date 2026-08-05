import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

const { caliBabyFontVariablesForLocale } = vi.hoisted(() => ({
  caliBabyFontVariablesForLocale: vi.fn((locale: 'zh' | 'en') =>
    locale === 'zh' ? 'open-runde-font cjk-font' : 'open-runde-font',
  ),
}))

vi.mock('@vercel/analytics/next', () => ({
  Analytics: () => <span data-vercel-analytics="" />,
}))

vi.mock('~/components/theme-provider', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock('~/lib/security/inline-scripts', () => ({
  PREPAINT_SCRIPT: '',
}))

vi.mock('./fonts', () => ({
  caliBabyFontVariablesForLocale,
}))

import { CaliBabyDocument } from './_components/calibaby-document'

describe('CaliBabyDocument typography', () => {
  it('uses Open Runde without inheriting the Geist utility class', () => {
    const chinese = renderToStaticMarkup(
      <CaliBabyDocument locale="zh">
        <p>中文页面</p>
      </CaliBabyDocument>,
    )
    const english = renderToStaticMarkup(
      <CaliBabyDocument locale="en">
        <p>English page</p>
      </CaliBabyDocument>,
    )

    expect(chinese).toContain('open-runde-font')
    expect(english).toContain('open-runde-font')
    expect(chinese).toContain('cjk-font')
    expect(english).not.toContain('cjk-font')
    expect(chinese).not.toMatch(/class="[^"]*\bfont-sans\b/)
    expect(english).not.toMatch(/class="[^"]*\bfont-sans\b/)
    expect(caliBabyFontVariablesForLocale).toHaveBeenCalledWith('zh')
    expect(caliBabyFontVariablesForLocale).toHaveBeenCalledWith('en')
  })
})
