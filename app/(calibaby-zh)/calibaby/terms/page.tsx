import { CaliBabyPage } from '../../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('zh', 'terms')

export default function ChineseCaliBabyTermsPage() {
  return <CaliBabyPage locale="zh" kind="terms" />
}
