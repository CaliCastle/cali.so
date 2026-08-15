import { ProjectsPageView } from '../../../_views/projects-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata.projects.en

export const metadata = localeMetadata({
  locale: 'en',
  path: '/projects',
  ...copy,
})

export default function EnglishProjectsPage() {
  return <ProjectsPageView locale="en" />
}
