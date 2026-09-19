import { ResumePage, type ResumePageProps } from '../../../_views/resume-page'

// Direct-entry private documents wait for authorization before rendering;
// the native passphrase form also works with JavaScript disabled.
export const instant = false

export default function Page(props: ResumePageProps) {
  return <ResumePage {...props} locale="en" />
}
