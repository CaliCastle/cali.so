import { CaliBabyPage } from '../../../../_views/calibaby-pages'
import { caliBabyPageMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyPageMetadata('en', 'privacy')

export default function EnglishCaliBabyPrivacyPage() {
  return <CaliBabyPage locale="en" kind="privacy" />
}
