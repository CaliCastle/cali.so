import Image from 'next/image'
import Link from 'next/link'

import { ExternalLabel } from '~/components/external-mark'
import { GhostSchematic } from '~/components/ghost-schematic'
import { ProjectsBlueprintStage } from '~/components/hidden-list-stage'
import { PixelCluster } from '~/components/pixel-cluster'
import { T } from '~/lib/i18n'
import { localePath, type Locale } from '~/lib/locale-route'
import { publicPageMetadata } from '~/lib/public-page-metadata'
import { projects } from '~/lib/projects'

export function ProjectsPageView({ locale }: { locale: Locale }) {
  const center = (projects.length - 1) / 2

  return (
    <div className="relative mx-auto w-full max-w-[37.5rem] px-6">
      <GhostSchematic className="top-4 right-6 hidden w-56 sm:block" />
      <div className="flex items-start justify-between gap-4">
        <header className="max-w-[34rem]">
          <h1 className="page-eyebrow enter">
            <T zh="项目" en="Projects" />
          </h1>
          <p
            className="page-introduction enter mt-4 text-balance"
            style={{ '--enter-delay': '70ms' } as React.CSSProperties}
          >
            <T
              zh={publicPageMetadata.projects.zh.description}
              en={publicPageMetadata.projects.en.description}
            />
          </p>
        </header>
        <PixelCluster variant={3} className="enter shrink-0" />
      </div>

      <ProjectsBlueprintStage className="mt-10">
        <ul className="focus-list flex flex-col">
          {projects.map((project, index) => (
            <li
              key={project.name}
              className="enter-swing"
              style={
                {
                  '--enter-delay': `${120 + Math.abs(index - center) * 50}ms`,
                } as React.CSSProperties
              }
            >
              <Link
                href={
                  project.url.startsWith('/')
                    ? localePath(locale, project.url)
                    : project.url
                }
                target={project.url.startsWith('/') ? undefined : '_blank'}
                rel={project.url.startsWith('/') ? undefined : 'noreferrer'}
                className="project-row hairline-top group"
                data-list-stage-row
                data-list-stage-id={project.name}
              >
                <span className="project-icon-frame" aria-hidden="true" data-list-stage-anchor>
                  <Image
                    src={project.icon}
                    alt=""
                    width={36}
                    height={36}
                    className="project-icon"
                  />
                </span>
                <span className="project-identity">
                  <span className="project-name font-medium">
                    {project.url.startsWith('/') ? (
                      <T zh={project.name} en={project.nameEn} />
                    ) : (
                      <ExternalLabel>
                        <T zh={project.name} en={project.nameEn} />
                      </ExternalLabel>
                    )}
                  </span>
                  <span className="project-domain text-muted-foreground">{project.domain}</span>
                </span>
                <span className="project-description text-muted-foreground">
                  <T zh={project.description} en={project.descriptionEn ?? project.description} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </ProjectsBlueprintStage>
    </div>
  )
}
