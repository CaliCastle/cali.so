'use client'

import Image from 'next/image'
import React from 'react'
import Balancer from 'react-wrap-balancer'

import {
  CalendarIcon,
  CursorClickIcon,
  HourglassIcon,
  ScriptIcon,
} from '~/assets'
import { PostPortableText } from '~/components/PostPortableText'
import { Prose } from '~/components/Prose'
import { Container } from '~/components/ui/Container'
import { prettifyNumber } from '~/lib/math'
import { usePostStore, usePresenceStore } from '~/lib/store'
import { type Post } from '~/sanity/schemas/post'

export function BlogPostPage({ post, views }: { post: Post; views?: number }) {
  const { enterRoom, leaveRoom } = usePostStore((state) => state.liveblocks)
  const setRoomId = usePresenceStore((state) => state.setRoomId)

  React.useEffect(() => {
    if (post._id) {
      enterRoom(`post.${post._id}`)
    }

    return () => {
      if (post._id) {
        leaveRoom(`post.${post._id}`)
      }
    }
  }, [enterRoom, leaveRoom, post._id])

  React.useEffect(() => {
    setRoomId(`post.presence.${post._id}`)

    return () => {
      setRoomId(undefined)
    }
  }, [setRoomId, post._id])

  return (
    <Container className="mt-16 lg:mt-32">
      <div className="xl:relative">
        <div className="mx-auto max-w-2xl">
          {/*{previousPathname && (*/}
          {/*  <button*/}
          {/*    type="button"*/}
          {/*    onClick={() => router.back()}*/}
          {/*    aria-label="Go back to articles"*/}
          {/*    className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"*/}
          {/*  >*/}
          {/*    <ArrowLeftIcon className="h-4 w-4 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />*/}
          {/*  </button>*/}
          {/*)}*/}
          <article>
            <header className="relative flex flex-col items-center pb-5 after:absolute after:-bottom-1 after:block after:h-px after:w-full after:rounded after:bg-gradient-to-r after:from-zinc-400/20 after:via-zinc-200/10 after:to-transparent dark:after:from-zinc-600/20 dark:after:via-zinc-700/10">
              <div className="relative mb-7 aspect-[240/135] w-full md:mb-12 md:w-[120%]">
                <div className="absolute z-0 aspect-[240/135] w-full blur-xl saturate-150 after:absolute after:inset-0 after:block after:bg-white/50 dark:after:bg-black/50">
                  <Image
                    src={post.mainImage.asset.url}
                    alt=""
                    className="select-none"
                    unoptimized
                    fill
                  />
                </div>
                <Image
                  src={post.mainImage.asset.url}
                  alt={post.title}
                  className="select-none rounded-3xl ring-1 ring-zinc-900/5 transition dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20"
                  placeholder="blur"
                  blurDataURL={post.mainImage.asset.lqip}
                  unoptimized
                  fill
                />
              </div>
              <div className="flex w-full items-center space-x-4 text-sm font-medium text-zinc-600/80 dark:text-zinc-400/80">
                <time
                  dateTime={post.publishedAt}
                  className="flex items-center space-x-1.5"
                >
                  <CalendarIcon />
                  <span>
                    {Intl.DateTimeFormat('zh').format(
                      new Date(post.publishedAt)
                    )}
                  </span>
                </time>
                <span className="inline-flex items-center space-x-1.5">
                  <ScriptIcon />
                  <span>{post.categories.join(', ')}</span>
                </span>
              </div>
              <h1 className="mt-6 w-full text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
                <Balancer>{post.title}</Balancer>
              </h1>
              <p className="my-5 w-full text-sm font-medium text-zinc-500">
                <Balancer>{post.description}</Balancer>
              </p>
              <div className="flex w-full items-center space-x-4 text-sm font-medium text-zinc-700/50 dark:text-zinc-300/50">
                <span className="inline-flex items-center space-x-1.5">
                  <CursorClickIcon />
                  <span>{prettifyNumber(views ?? 0, true)}次点击</span>
                </span>

                <span className="inline-flex items-center space-x-1.5">
                  <HourglassIcon />
                  <span>{post.readingTime.toFixed(0)}分钟阅读</span>
                </span>
              </div>
            </header>
            <Prose className="mt-8">
              <PostPortableText value={post.body} />
            </Prose>
          </article>
        </div>
      </div>
    </Container>
  )
}
