import { CaliBabyPage } from '../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('zh', 'support')

export default function ChineseCaliBabySupportPage() {
  return <CaliBabyPage locale="zh" kind="support" />
}
