'use client'

import { useUser } from '@clerk/nextjs'
import { clsxm } from '@zolplay/utils'
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
} from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import { useMutation } from 'react-query'
import { useReward } from 'react-rewards'
import TextareaAutosize from 'react-textarea-autosize'

import { signBook } from '~/app/(main)/guestbook/guestbook.state'
import { EyeCloseIcon, EyeOpenIcon, TiltedSendIcon } from '~/assets'
import { CommentMarkdown } from '~/components/CommentMarkdown'
import { RichLink } from '~/components/links/RichLink'
import { ElegantTooltip } from '~/components/ui/Tooltip'
import { type GuestbookDto } from '~/db/dto/guestbook.dto'

const MAX_MESSAGE_LENGTH = 600
const REWARDS_ID = 'guestbook-rewards'

export function GuestbookInput() {
  const { user } = useUser()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [message, setMessage] = React.useState('')
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const { reward } = useReward(REWARDS_ID, 'emoji', {
    position: 'absolute',
    emoji: [
      '🤓',
      '😊',
      '🥳',
      '🤩',
      '🤪',
      '🤯',
      '🥰',
      '😎',
      '🤗',
      '😇',
      '🥸',
      '🤠',
      '💯',
      '🤔',
      '🤫',
      '🤭',
      '🙏',
      '👀',
      '👨🏻‍💻',
    ],
    elementCount: 62,
  })

  const { mutate: signGuestbook, isLoading } = useMutation(
    ['guestbook'],
    async () => {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
        }),
      })
      const data: GuestbookDto = await res.json()
      return data
    },
    {
      onSuccess: (data) => {
        setMessage('')
        setIsPreviewing(false)
        reward()
        signBook(data)
      },
    }
  )

  const onClickSend = () => {
    if (isLoading) {
      return
    }

    signGuestbook()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      onClickSend()
    }
  }

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const handleMouseMove = React.useCallback(
    ({ clientX, clientY, currentTarget }: React.MouseEvent) => {
      const bounds = currentTarget.getBoundingClientRect()
      mouseX.set(clientX - bounds.left)
      mouseY.set(clientY - bounds.top)
    },
    [mouseX, mouseY]
  )
  const background = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, var(--spotlight-color) 0%, transparent 85%)`

  if (!user) {
    return (
      <div className="h-[82px] animate-pulse rounded-xl bg-white/70 ring-2 ring-zinc-200/30 dark:bg-zinc-800/80 dark:ring-zinc-700/30" />
    )
  }

  return (
    <div
      className={clsxm(
        'group relative flex w-full rounded-xl bg-gradient-to-b from-zinc-50/50 to-white/70 p-2 pb-6 shadow-xl shadow-zinc-500/10 ring-2 ring-zinc-200/30 transition-opacity [--spotlight-color:rgb(236_252_203_/_0.25)] dark:from-zinc-900/70 dark:to-zinc-800/60 dark:shadow-zinc-700/10 dark:ring-zinc-700/30 dark:[--spotlight-color:rgb(217_249_157_/_0.04)] md:p-4',
        isLoading && 'pointer-events-none opacity-50'
      )}
      onMouseMove={handleMouseMove}
    >
      <motion.div
        className="pointer-events-none absolute -inset-px z-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background }}
        aria-hidden="true"
      />
      <div
        className={clsxm(
          'pointer-events-none absolute inset-0 z-0 select-none overflow-hidden rounded-xl mix-blend-overlay',
          isLoading && 'opacity-0'
        )}
      >
        <svg
          aria-hidden="true"
          className="absolute inset-x-0 inset-y-[-30%] h-[160%] w-full skew-y-[-18deg] fill-black/5 stroke-zinc-900/10 dark:fill-[hsla(0,0%,100%,.03)] dark:stroke-white/10"
        >
          <defs>
            <pattern
              id=":R1d6hd6:"
              width="72"
              height="56"
              patternUnits="userSpaceOnUse"
              x="50%"
              y="16"
            >
              <path d="M.5 56V.5H72" fill="none"></path>
            </pattern>
          </defs>
          <rect
            width="100%"
            height="100%"
            strokeWidth="0"
            fill="url(#:R1d6hd6:)"
          ></rect>
          <svg x="50%" y="16" className="overflow-visible">
            <rect strokeWidth="0" width="73" height="57" x="0" y="56"></rect>
            <rect strokeWidth="0" width="73" height="57" x="72" y="168"></rect>
          </svg>
        </svg>
      </div>

      <div className="z-10 h-8 w-8 shrink-0 md:h-10 md:w-10">
        <Image
          src={user.imageUrl}
          alt=""
          width={40}
          height={40}
          className="h-8 w-8 select-none rounded-full md:h-10 md:w-10"
          unoptimized
        />
      </div>

      <div className="z-10 ml-2 flex-1 shrink-0 md:ml-4">
        {isPreviewing ? (
          <div
            className="comment__message flex-1 shrink-0 px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200"
            key="preview"
          >
            <CommentMarkdown>{message}</CommentMarkdown>
          </div>
        ) : (
          <TextareaAutosize
            ref={textareaRef}
            className="block w-full shrink-0 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-zinc-800 placeholder-zinc-400 outline-none transition-[height] will-change-[height] focus:outline-none focus:ring-0 dark:text-zinc-200 dark:placeholder-zinc-500"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="说点什么吧，万一火不了呢..."
            onKeyDown={handleKeyDown}
            maxRows={8}
            autoFocus
          />
        )}

        <footer className="-mb-1.5 mt-3 flex h-5 w-full items-center justify-between">
          <span
            className={clsxm(
              'flex-1 shrink-0 select-none text-[10px] text-zinc-500 transition-opacity',
              message.length > 0 ? 'opacity-100' : 'opacity-0'
            )}
          >
            支持 <b>Markdown</b> 与{' '}
            <RichLink
              favicon={false}
              href="https://docs.github.com/zh/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax"
              className="font-bold hover:underline"
            >
              GFM
            </RichLink>
          </span>
          <AnimatePresence>
            {message.length > 0 && (
              <motion.aside
                key="send-button-wrapper"
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 8 }}
                className="flex select-none items-center gap-2.5"
              >
                <span
                  className={clsxm(
                    'font-mono text-[10px]',
                    message.length > MAX_MESSAGE_LENGTH
                      ? 'text-red-500'
                      : 'text-zinc-500'
                  )}
                >
                  {message.length}/{MAX_MESSAGE_LENGTH}
                </span>

                <ElegantTooltip
                  content={isPreviewing ? '关闭预览' : '预览一下'}
                >
                  <motion.button
                    className="appearance-none"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    disabled={isLoading}
                    onClick={() => setIsPreviewing((prev) => !prev)}
                  >
                    {isPreviewing ? (
                      <EyeCloseIcon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
                    ) : (
                      <EyeOpenIcon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
                    )}
                  </motion.button>
                </ElegantTooltip>

                <ElegantTooltip content="发送">
                  <motion.button
                    className="appearance-none"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    disabled={isLoading}
                    onClick={onClickSend}
                  >
                    <TiltedSendIcon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
                  </motion.button>
                </ElegantTooltip>
              </motion.aside>
            )}
          </AnimatePresence>
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-1/2 select-none"
            id={REWARDS_ID}
          />
        </footer>
      </div>
    </div>
  )
}
