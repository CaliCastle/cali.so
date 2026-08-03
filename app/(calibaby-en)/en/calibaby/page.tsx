import { CaliBabyPage } from '../../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('en', 'support')

export default function EnglishCaliBabySupportPage() {
  return <CaliBabyPage locale="en" kind="support" />
}
