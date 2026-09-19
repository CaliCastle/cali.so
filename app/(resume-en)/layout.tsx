import '../globals.css'
import '../_components/resume.css'
import '../_components/resume-en.css'

import { ResumeDocument, resumeMetadata } from '../_components/resume-document'

export const metadata = resumeMetadata

export default function EnglishResumeRootLayout({ children }: { children: React.ReactNode }) {
  return <ResumeDocument locale="en">{children}</ResumeDocument>
}
