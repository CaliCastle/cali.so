import '../_components/resume-zh.css'

import { resumeMetadata } from '../_components/resume-document'
import { cjkFontVariableForLocale } from '../fonts'

export const metadata = resumeMetadata

export default function ResumeRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" className={`resume-swiss ${cjkFontVariableForLocale('zh')}`}>
      <body>
        <div className="resume-page">
          <nav aria-label="页面导航" className="resume-nav">
            <a href="/" className="resume-text-control">← cali.so</a>
            <a href="/en/resume" hrefLang="en" lang="en" className="resume-text-control">English ↗</a>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}
