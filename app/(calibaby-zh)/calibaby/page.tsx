import { CaliBabyLandingPage } from '../../_views/calibaby-landing'
import { caliBabyLandingMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyLandingMetadata('zh')

export default function ChineseCaliBabyLandingPage() {
  return <CaliBabyLandingPage locale="zh" />
}
