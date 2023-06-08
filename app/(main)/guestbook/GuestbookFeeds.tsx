'use client'

import 'dayjs/locale/zh-cn'

import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import { useQuery } from 'react-query'
import { useSnapshot } from 'valtio'

import { CommentMarkdown } from '~/components/CommentMarkdown'
import { type GuestbookDto } from '~/db/dto/guestbook.dto'
import { parseDisplayName } from '~/lib/string'

import { guestbookState, signBook } from './guestbook.state'

dayjs.extend(relativeTime)

export function GuestbookFeeds() {
  const { data: feed } = useQuery(
    ['guestbook'],
    async () => {
      const res = await fetch('/api/guestbook')
      const data = await res.json()
      return data as GuestbookDto[]
    },
    {
      refetchInterval: 30000,
      initialData: [],
    }
  )
  const { messages } = useSnapshot(guestbookState)
  React.useEffect(() => {
    feed?.forEach((message) => {
      if (!messages.find((m) => m.id === message.id)) {
        signBook(message, true)
      }
    })
  }, [feed, messages])

  return (
    <div className="relative mt-12">
      <div className="absolute inset-0 flex items-center" aria-hidden="true" />

      <ul role="list" className="-mb-8 px-1 md:px-4">
        <AnimatePresence>
          {messages.map((message, idx) => (
            <motion.li
              key={message.id}
              className="relative pb-8"
              initial={{ opacity: 0, scale: 0.95, x: 12 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95, x: 12 }}
            >
              {idx !== messages.length - 1 && (
                <span
                  className="absolute left-5 top-14 -ml-px h-[calc(100%-4.5rem)] w-0.5 rounded bg-zinc-200 dark:bg-zinc-800"
                  aria-hidden="true"
                />
              )}
              <div className="relative flex items-start space-x-3">
                <Image
                  src={
                    message.userInfo.imageUrl ??
                    `/avatars/avatar_${(idx % 8) + 1}.png`
                  }
                  alt=""
                  width={40}
                  height={40}
                  className="h-10 w-10 flex-shrink-0 rounded-full bg-zinc-200 ring-2 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-800"
                  unoptimized
                />
                <div className="-mt-1 flex min-w-0 flex-1 items-center gap-3">
                  <b className="text-sm font-bold dark:text-zinc-100">
                    {parseDisplayName(message.userInfo)}
                  </b>
                  <time
                    dateTime={message.createdAt.toString()}
                    className="inline-flex select-none text-[12px] font-medium opacity-40"
                  >
                    {dayjs(message.createdAt).locale('zh-cn').fromNow()}
                  </time>
                </div>
              </div>
              <div className="comment__message -mt-4 mb-1 pl-[3.25rem] text-sm">
                <CommentMarkdown>{message.message}</CommentMarkdown>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
