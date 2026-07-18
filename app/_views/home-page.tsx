import Link from 'next/link'
import { Suspense } from 'react'

import { Bookshelf } from '~/components/bookshelf'
import { ExternalLabel } from '~/components/external-mark'
import { HalftonePortrait } from '~/components/halftone-portrait'
import { HomeIntroduction } from '~/components/home-introduction'
import { NavCards, PhotoNavCard } from '~/components/nav-cards'
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

function SectionTitle({ children, delay }: { children: React.ReactNode; delay: number }) {
  return (
    <h2
      className="enter text-sm font-medium text-muted-foreground"
      style={{ '--enter-delay': `${delay}ms` } as React.CSSProperties}
    >
      {children}
    </h2>
  )
}

export async function HomePageView({ locale }: { locale: Locale }) {
  const [social, github] = await Promise.all([getSocial(), getGitHub()])
  const posts = getAllPosts()
  const latest = posts.slice(0, 5)
  const center = (latest.length - 1) / 2

  return (
    <div className="mx-auto w-full max-w-[37.5rem] px-6">
      <div className="flex flex-col-reverse justify-between gap-10 sm:flex-row sm:items-start">
        <div className="enter max-w-[19rem]">
          <h1 className="text-base font-semibold tracking-tight text-foreground">Cali Castle</h1>
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
        photoCard={
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
        <SectionTitle delay={120}>
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
          <SectionTitle delay={200}>
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
          <SectionTitle delay={320}>
            <T zh="让我来劲的音乐" en="Music That Gets Me Going" />
          </SectionTitle>
          <div className="enter mt-5" style={{ '--enter-delay': '360ms' } as React.CSSProperties}>
            <VinylShelf />
          </div>
        </section>
      )}

      {books.length > 0 && (
        <section className="mt-16">
          <SectionTitle delay={380}>
            <T zh="启发我的书" en="Books That Inspire Me" />
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
