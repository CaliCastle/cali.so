import '../globals.css'
import '../_components/resume.css'
import '../_components/resume-zh.css'

import { ResumeDocument, resumeMetadata } from '../_components/resume-document'

export const metadata = resumeMetadata

export default function ResumeRootLayout({ children }: { children: React.ReactNode }) {
  return <ResumeDocument locale="zh">{children}</ResumeDocument>
}
