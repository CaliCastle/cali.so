import Link from 'next/link'
import { Suspense } from 'react'

import { Bookshelf } from '~/components/bookshelf'
import { ExternalLabel } from '~/components/external-mark'
import { HalftonePortrait } from '~/components/halftone-portrait'
import { HomeIntroduction } from '~/components/home-introduction'
import { NavCards, PhotoNavCard } from '~/components/nav-cards'
import { PixelCluster } from '~/components/pixel-cluster'
import { PostRow } from '~/components/post-row'
import { PortraitHiddenStage } from '~/components/portrait-hidden-stage'
import { VinylShelf } from '~/components/vinyl-shelf'
import { getAllPosts } from '~/lib/content'
import { T } from '~/lib/i18n'
import { localePath, type Locale } from '~/lib/locale-route'
import { books, experience, records } from '~/lib/personal'
import { projects } from '~/lib/projects'
import { getGitHub, getSocial } from '~/lib/social-live'
import { getHomepagePhotoPreview } from '~/lib/media/photo-selection/repository'
import { getPublishedPhotoSelection } from '~/lib/media/photo-selection/server'

function SectionTitle({
  index,
  children,
  delay,
}: {
  index: string
  children: React.ReactNode
  delay: number
}) {
  return (
    <h2
      className="section-tag enter"
      style={{ '--enter-delay': `${delay}ms` } as React.CSSProperties}
    >
      <span className="section-tag-index" aria-hidden>
        {index}
      </span>
      <span className="section-tag-hatch" aria-hidden />
      <span className="section-tag-label">{children}</span>
    </h2>
  )
}

export async function HomePageView({ locale }: { locale: Locale }) {
  const [social, github] = await Promise.all([getSocial(), getGitHub()])
  const posts = getAllPosts()
  const latest = posts.slice(0, 5)
  const center = (latest.length - 1) / 2

  // section tags number in render order; conditional shelves never leave gaps
  let sectionCount = 0
  const nextSectionIndex = () => String(++sectionCount).padStart(2, '0')

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <div className="flex flex-col-reverse justify-between gap-10 sm:flex-row sm:items-start">
        <div className="enter max-w-[19rem]">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold tracking-tight text-foreground">Cali Castle</h1>
            <PixelCluster variant={2} className="shrink-0" />
          </div>
          <div className="mt-4">
            <HomeIntroduction social={social.x} github={github} />
          </div>
        </div>
        <div className="w-[9.35rem] shrink-0 sm:w-60">
          <PortraitHiddenStage
            label={
              locale === 'en'
                ? "Cali's halftone portrait. Reveal the hidden topographic field"
                : 'Cali 的半调网点肖像。显现隐藏的等高线场'
            }
          >
            <HalftonePortrait
              srcLight="/images/headshot.jpg"
              srcDark="/images/portrait-square.jpg"
              alt="Cali 的半调网点肖像"
              altEn="Cali's halftone portrait"
            />
          </PortraitHiddenStage>
        </div>
      </div>

      <NavCards
        postCount={posts.length}
        projectCount={projects.length}
        locale={locale}
        photoCard={process.env.PUBLIC_CONTENT_ONLY === 'true' ? null :
          <Suspense
            fallback={
              <PhotoNavCard
                photoPreview={null}
                locale={locale}
                pending
              />
            }
          >
            <PublishedPhotoNavCard locale={locale} />
          </Suspense>
        }
      />

      <section className="mt-16">
        <SectionTitle index={nextSectionIndex()} delay={120}>
          <T zh="经历" en="Experience" />
        </SectionTitle>
        <ul className="mt-4 flex flex-col">
          {experience.map((job, i) => (
            <li
              key={job.company}
              className="enter-swing hairline-top"
              style={{ '--enter-delay': `${150 + i * 40}ms` } as React.CSSProperties}
            >
              <div className="experience-row text-sm">
                <div className="experience-details">
                  {job.url ? (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noreferrer"
                      className="experience-company font-medium transition-colors duration-150 ease-[ease] hover:text-foreground"
                    >
                      <ExternalLabel>
                        <T zh={job.company} en={job.companyEn} />
                      </ExternalLabel>
                    </a>
                  ) : (
                    <span className="experience-company font-medium">
                      <T zh={job.company} en={job.companyEn} />
                    </span>
                  )}
                  <span className="experience-role text-muted-foreground">
                    <T zh={job.role} en={job.roleEn ?? job.role} />
                  </span>
                </div>
                <span className="experience-date text-muted-foreground tabular-nums">
                  {job.from}—{job.to ?? <T zh="现在" en="now" />}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <div className="flex items-center justify-between gap-4">
          <SectionTitle index={nextSectionIndex()} delay={200}>
            <T zh="写作" en="Writing" />
          </SectionTitle>
          <Link
            href={localePath(locale, '/blog')}
            className="enter relative shrink-0 text-sm text-muted-foreground transition-colors duration-150 ease-[ease] after:absolute after:-inset-x-2 after:-inset-y-3 after:content-[''] hover:text-foreground focus-visible:rounded-sm focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4"
            style={{ '--enter-delay': '200ms' } as React.CSSProperties}
          >
            <T zh="查看全部" en="View all" />
          </Link>
        </div>
        <ul className="focus-list mt-4 flex flex-col">
          {latest.map((post, index) => (
            <li
              key={post.slug}
              className="enter-swing"
              style={
                { '--enter-delay': `${240 + Math.abs(index - center) * 50}ms` } as React.CSSProperties
              }
            >
              <PostRow post={post} headingLevel="h3" dateStyle="short" locale={locale} />
            </li>
          ))}
        </ul>
      </section>

      {records.length > 0 && (
        <section className="mt-16">
          <SectionTitle index={nextSectionIndex()} delay={320}>
            <T zh="循环播放中" en="On rotation" />
          </SectionTitle>
          <div className="enter mt-5" style={{ '--enter-delay': '360ms' } as React.CSSProperties}>
            <VinylShelf />
          </div>
        </section>
      )}

      {books.length > 0 && (
        <section className="mt-16">
          <SectionTitle index={nextSectionIndex()} delay={380}>
            <T zh="珍藏书架" en="Books I Love" />
          </SectionTitle>
          <div className="enter mt-5" style={{ '--enter-delay': '420ms' } as React.CSSProperties}>
            <Bookshelf />
          </div>
        </section>
      )}
    </div>
  )
}

async function PublishedPhotoNavCard({ locale }: { locale: Locale }) {
  const photoSelection = await getPublishedPhotoSelection()
  return (
    <PhotoNavCard
      photoPreview={getHomepagePhotoPreview(photoSelection)}
      locale={locale}
    />
  )
}
