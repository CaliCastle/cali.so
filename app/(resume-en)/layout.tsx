import '../_components/resume.css'

import { ResumeDocument, resumeMetadata } from '../_components/resume-document'

export const metadata = resumeMetadata

export default function EnglishResumeRootLayout({ children }: { children: React.ReactNode }) {
  return <ResumeDocument locale="en">{children}</ResumeDocument>
}
