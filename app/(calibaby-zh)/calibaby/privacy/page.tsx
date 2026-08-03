import { CaliBabyPage } from '../../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('zh', 'privacy')

export default function ChineseCaliBabyPrivacyPage() {
  return <CaliBabyPage locale="zh" kind="privacy" />
}
