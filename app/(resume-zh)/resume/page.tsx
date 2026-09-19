import { ResumePage, type ResumePageProps } from '../../_views/resume-page'

export const instant = false

export default function Page(props: ResumePageProps) {
  return <ResumePage {...props} locale="zh" />
}
