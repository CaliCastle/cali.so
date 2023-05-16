import Image from 'next/image'
import Balancer from 'react-wrap-balancer'

import {
  CalendarIcon,
  CursorClickIcon,
  HourglassIcon,
  ScriptIcon,
} from '~/assets'

const fakePosts = [
  {
    title: '陈皓：以磊落之心，点亮科技之光',
    publishedAt: '2023-05-15',
    readingTime: 15,
    mainImage:
      'https://cdn.sanity.io/images/i81ys0da/production/a6b97145fdb5e4887ae18609b608980b5428957d-1200x630.jpg',
    category: '随笔',
  },
]
export function BlogPosts() {
  return (
    <>
      {fakePosts.map(({ title, mainImage, publishedAt, category }, idx) => (
        <div
          key={idx}
          className="group relative flex aspect-[240/135] w-full flex-col justify-end gap-16 rounded-3xl bg-white p-6 transition-shadow after:absolute after:inset-0 after:rounded-3xl after:bg-[linear-gradient(180deg,transparent,rgba(0,0,0,.7)_55%,#000_82.5%,#000)] after:opacity-100 after:ring-2 after:ring-zinc-200 after:transition-opacity hover:shadow-xl hover:after:opacity-70 dark:after:ring-zinc-800/70"
        >
          <Image
            src={mainImage}
            alt=""
            className="rounded-[22px] object-cover"
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
                  <span>{category}</span>
                </span>
              </span>
              <span className="inline-flex items-center space-x-3 text-xs font-medium text-zinc-300/60">
                <span className="inline-flex items-center space-x-1">
                  <CursorClickIcon />
                  <span>15k</span>
                </span>

                <span className="inline-flex items-center space-x-1">
                  <HourglassIcon />
                  <span>15分钟</span>
                </span>
              </span>
            </span>
          </span>
        </div>
      ))}
    </>
  )
}
