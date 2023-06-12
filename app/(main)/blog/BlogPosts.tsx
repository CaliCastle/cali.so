import Image from 'next/image'
import Link from 'next/link'

import {
  CalendarIcon,
  CursorClickIcon,
  HourglassIcon,
  ScriptIcon,
} from '~/assets'
import { kvKeys } from '~/config/kv'
import { env } from '~/env.mjs'
import { prettifyNumber } from '~/lib/math'
import { redis } from '~/lib/redis'
import { getLatestBlogPosts } from '~/sanity/queries'

export async function BlogPosts({ limit = 5 }) {
  const posts = await getLatestBlogPosts({ limit, forDisplay: true })
  const postIdKeys = posts.map(({ _id }) => kvKeys.postViews(_id))

  let views: number[] = []
  if (env.VERCEL_ENV === 'development') {
    views = posts.map(() => Math.floor(Math.random() * 1000))
  } else {
    views = await redis.mget<number[]>(...postIdKeys)
  }

  return (
    <>
      {posts.map(
        (
          { slug, title, mainImage, publishedAt, categories, readingTime },
          idx
        ) => (
          <Link
            key={idx}
            href={`/blog/${slug}`}
            prefetch={false}
            className="group relative w-full rounded-3xl bg-transparent ring-2 ring-zinc-800/10 dark:ring-zinc-200/10"
            style={
              {
                '--post-image-fg': mainImage.asset.dominant?.foreground,
                '--post-image-bg': mainImage.asset.dominant?.background,
              } as React.CSSProperties
            }
          >
            <div className="relative aspect-[240/135] w-full">
              <Image
                src={mainImage.asset.url}
                alt=""
                className="rounded-t-3xl object-cover"
                placeholder="blur"
                blurDataURL={mainImage.asset.lqip}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
              />
            </div>
            <span className="relative z-10 flex w-full flex-col gap-2 p-4 after:pointer-events-none after:absolute after:inset-0 after:select-none after:rounded-b-3xl after:bg-[--post-image-bg] after:from-transparent after:to-[--post-image-bg] after:backdrop-blur-lg after:transition-opacity md:p-5">
              <h2 className="z-20 text-base font-bold tracking-tight text-[--post-image-fg] md:text-xl">
                {title}
              </h2>

              <span className="relative z-20 flex items-center justify-between">
                <span className="inline-flex items-center space-x-3">
                  <span className="inline-flex items-center space-x-1 text-[12px] font-medium text-[--post-image-fg] opacity-50 transition-opacity group-hover:opacity-100 md:text-sm">
                    <CalendarIcon />
                    <span>
                      {Intl.DateTimeFormat('zh').format(new Date(publishedAt))}
                    </span>
                  </span>

                  <span className="inline-flex items-center space-x-1 text-[12px] font-medium text-[--post-image-fg] opacity-50 transition-opacity group-hover:opacity-100 md:text-sm">
                    <ScriptIcon />
                    <span>{categories.join(', ')}</span>
                  </span>
                </span>
                <span className="inline-flex items-center space-x-3 text-[12px] font-medium text-[--post-image-fg] opacity-50 transition-opacity group-hover:opacity-100 md:text-xs">
                  <span className="inline-flex items-center space-x-1">
                    <CursorClickIcon />
                    <span>{prettifyNumber(views[idx] ?? 0, true)}</span>
                  </span>

                  <span className="inline-flex items-center space-x-1">
                    <HourglassIcon />
                    <span>{readingTime.toFixed(0)}分钟阅读</span>
                  </span>
                </span>
              </span>
            </span>
          </Link>
        )
      )}
    </>
  )
}
