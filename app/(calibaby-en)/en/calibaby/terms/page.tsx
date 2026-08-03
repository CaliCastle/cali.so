import { CaliBabyPage } from '../../../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('en', 'terms')

export default function EnglishCaliBabyTermsPage() {
  return <CaliBabyPage locale="en" kind="terms" />
}
