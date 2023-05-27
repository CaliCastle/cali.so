import Image from 'next/image'
import Link from 'next/link'
import Balancer from 'react-wrap-balancer'

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
  const posts = await getLatestBlogPosts(limit)
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
            className="group relative flex aspect-[240/135] w-full flex-col justify-end gap-16 rounded-3xl bg-white p-4 transition-shadow after:absolute after:inset-0 after:rounded-3xl after:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.7)_55%,#000_82.5%,#000)] after:opacity-100 after:ring-2 after:ring-zinc-200 after:transition-opacity hover:shadow-xl hover:after:opacity-70 dark:after:ring-zinc-800/70 md:p-6"
          >
            <Image
              src={mainImage.asset.url}
              alt=""
              className="rounded-[22px] object-cover"
              placeholder="blur"
              blurDataURL={mainImage.asset.lqip}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw"
            />
            <span className="z-10 flex w-full flex-col gap-2">
              <h2 className="text-base font-bold tracking-tight text-zinc-50 md:text-xl">
                <Balancer>{title}</Balancer>
              </h2>
              <span className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-3">
                  <span className="inline-flex items-center space-x-1 text-[12px] font-medium text-zinc-400 md:text-sm">
                    <CalendarIcon />
                    <span>
                      {Intl.DateTimeFormat('zh').format(new Date(publishedAt))}
                    </span>
                  </span>

                  <span className="inline-flex items-center space-x-1 text-[12px] font-medium text-zinc-400 md:text-sm">
                    <ScriptIcon />
                    <span>{categories.join(', ')}</span>
                  </span>
                </span>
                <span className="inline-flex items-center space-x-3 text-[12px] font-medium text-zinc-300/60 md:text-xs">
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
