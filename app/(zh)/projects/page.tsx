import { ProjectsPageView } from '../../_views/projects-page'
import { localeMetadata } from '~/lib/locale-metadata'
import { publicPageMetadata } from '~/lib/public-page-metadata'

const copy = publicPageMetadata.projects.zh

export const metadata = localeMetadata({
  locale: 'zh',
  path: '/projects',
  ...copy,
})

export default function ChineseProjectsPage() {
  return <ProjectsPageView locale="zh" />
}
