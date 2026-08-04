import { CaliBabyLandingPage } from '../../../_views/calibaby-landing'
import { caliBabyLandingMetadata } from '~/lib/calibaby-public-content'

export const metadata = caliBabyLandingMetadata('en')

export default function EnglishCaliBabyLandingPage() {
  return <CaliBabyLandingPage locale="en" />
}
