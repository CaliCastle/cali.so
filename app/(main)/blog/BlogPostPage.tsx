'use client'

import { Portal } from '@headlessui/react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import Balancer from 'react-wrap-balancer'

import { BlogReactions } from '~/app/(main)/blog/BlogReactions'
import {
  CalendarIcon,
  CursorClickIcon,
  HourglassIcon,
  ScriptIcon,
  UTurnLeftIcon,
} from '~/assets'
import { PostPortableText } from '~/components/PostPortableText'
import { Prose } from '~/components/Prose'
import { Button } from '~/components/ui/Button'
import { Container } from '~/components/ui/Container'
import { prettifyNumber } from '~/lib/math'
import { type Post } from '~/sanity/schemas/post'

export function BlogPostPage({
  post,
  views,
  reactions,
}: {
  post: Post
  views?: number
  reactions?: number[]
}) {
  return (
    <>
      <Container className="mt-16 lg:mt-32">
        <div className="xl:relative">
          <div className="mx-auto max-w-2xl">
            <Button
              href="/blog"
              variant="secondary"
              aria-label="Go back to articles"
              className="group mb-8 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 transition dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0 dark:ring-white/10 dark:hover:border-zinc-700 dark:hover:ring-white/20 lg:absolute lg:-left-5 lg:-mt-2 lg:mb-0 xl:-top-1.5 xl:left-0 xl:mt-0"
            >
              <UTurnLeftIcon className="h-8 w-8 stroke-zinc-500 transition group-hover:stroke-zinc-700 dark:stroke-zinc-500 dark:group-hover:stroke-zinc-400" />
            </Button>
            <article>
              <header className="relative flex flex-col items-center pb-5 after:absolute after:-bottom-1 after:block after:h-px after:w-full after:rounded after:bg-gradient-to-r after:from-zinc-400/20 after:via-zinc-200/10 after:to-transparent dark:after:from-zinc-600/20 dark:after:via-zinc-700/10">
                <motion.div
                  className="relative mb-7 aspect-[240/135] w-full md:mb-12 md:w-[120%]"
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{
                    duration: 0.35,
                    type: 'spring',
                    stiffness: 120,
                    damping: 20,
                  }}
                >
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
                </motion.div>
                <motion.div
                  className="flex w-full items-center space-x-4 text-sm font-medium text-zinc-600/80 dark:text-zinc-400/80"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.15,
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                    delay: 0.1,
                  }}
                >
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
                </motion.div>
                <motion.h1
                  className="mt-6 w-full text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 150,
                    damping: 30,
                    delay: 0.2,
                  }}
                >
                  <Balancer>{post.title}</Balancer>
                </motion.h1>
                <motion.p
                  className="my-5 w-full text-sm font-medium text-zinc-500"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.2,
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                    delay: 0.23,
                  }}
                >
                  <Balancer>{post.description}</Balancer>
                </motion.p>
                <motion.div
                  className="flex w-full items-center space-x-4 text-sm font-medium text-zinc-700/50 dark:text-zinc-300/50"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.15,
                    type: 'spring',
                    stiffness: 150,
                    damping: 20,
                    delay: 0.255,
                  }}
                >
                  <span className="inline-flex items-center space-x-1.5">
                    <CursorClickIcon />
                    <span>{prettifyNumber(views ?? 0, true)}次点击</span>
                  </span>

                  <span className="inline-flex items-center space-x-1.5">
                    <HourglassIcon />
                    <span>{post.readingTime.toFixed(0)}分钟阅读</span>
                  </span>
                </motion.div>
              </header>
              <Prose className="mt-8">
                <PostPortableText value={post.body} />
              </Prose>
            </article>
          </div>
        </div>
      </Container>

      <Portal>
        <div className="pointer-events-none fixed inset-0 z-50 h-full w-full sm:px-8">
          <div className="mx-auto h-full max-w-7xl px-4 sm:px-8 lg:px-12">
            <div className="mx-auto flex h-full max-w-2xl justify-between lg:max-w-5xl">
              <div className=""></div>
              <div className="hidden h-full flex-col items-center justify-center lg:flex">
                <BlogReactions
                  _id={post._id}
                  mood={post.mood}
                  reactions={reactions}
                />
              </div>
            </div>
          </div>
        </div>
      </Portal>
    </>
  )
}
