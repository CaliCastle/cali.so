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
import { prettifyNumber } from '~/lib/math'
import { redis } from '~/lib/redis'
import { getLatestBlogPosts } from '~/sanity/queries'

export async function BlogPosts({ limit = 5 }) {
  const posts = await getLatestBlogPosts(limit)
  const postIdKeys = posts.map(({ _id }) => kvKeys.postViews(_id))
  const views = await redis.mget<number[]>(postIdKeys.join(' '))

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
            className="group relative flex aspect-[240/135] w-full flex-col justify-end gap-16 rounded-3xl bg-white p-6 transition-shadow after:absolute after:inset-0 after:rounded-3xl after:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.7)_55%,#000_82.5%,#000)] after:opacity-100 after:ring-2 after:ring-zinc-200 after:transition-opacity hover:shadow-xl hover:after:opacity-70 dark:after:ring-zinc-800/70"
          >
            <Image
              src={mainImage.asset.url}
              alt=""
              className="rounded-[22px] object-cover"
              placeholder="blur"
              blurDataURL={mainImage.asset.lqip}
              fill
            />
            <span className="z-10 flex w-full flex-col gap-2">
              <h2 className="text-xl font-bold tracking-tight text-zinc-50">
                <Balancer>{title}</Balancer>
              </h2>
              <span className="flex items-center justify-between">
                <span className="inline-flex items-center space-x-3">
                  <span className="inline-flex items-center space-x-1 text-sm font-medium text-zinc-400">
                    <CalendarIcon />
                    <span>
                      {Intl.DateTimeFormat('zh').format(new Date(publishedAt))}
                    </span>
                  </span>

                  <span className="inline-flex items-center space-x-1 text-sm font-medium text-zinc-400">
                    <ScriptIcon />
                    <span>{categories.join(', ')}</span>
                  </span>
                </span>
                <span className="inline-flex items-center space-x-3 text-xs font-medium text-zinc-300/60">
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
