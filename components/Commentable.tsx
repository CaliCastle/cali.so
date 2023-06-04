'use client'

import 'dayjs/locale/zh-cn'

import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { clsxm } from '@zolplay/utils'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useMutation } from 'react-query'
import TextareaAutosize from 'react-textarea-autosize'
import { useSnapshot } from 'valtio'

import { addComment, blogPostState } from '~/app/(main)/blog/blog-post.state'
import {
  NewCommentIcon,
  TiltedSendIcon,
  UserArrowLeftIcon,
  XSquareIcon,
} from '~/assets'
import { Markdown } from '~/components/Markdown'
import { Button } from '~/components/ui/Button'
import { HoverCard } from '~/components/ui/HoverCard'
import {
  type CommentDto,
  type PostIDLessCommentDto,
} from '~/db/dto/comment.dto'
import { url } from '~/lib'
import { parseDisplayName } from '~/lib/string'

dayjs.extend(relativeTime)

const MAX_COMMENT_LENGTH = 500

type CommentableProps = {
  blockId?: string
}
export function Commentable({ blockId }: CommentableProps) {
  const pathname = usePathname()
  const { postId, comments } = useSnapshot(blogPostState)
  const { user: me } = useUser()
  const [isCommenting, setIsCommenting] = React.useState(false)
  const currentComments = React.useMemo(
    () => comments.filter((c) => c.body.blockId === blockId),
    [comments, blockId]
  )

  const formRef = React.useRef<HTMLFormElement>(null)
  const { mutate: createComment, isLoading } = useMutation(
    ['comment', postId],
    async (comment: string) => {
      const res = await fetch(`/api/comments/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            blockId,
            text: comment,
          } satisfies CommentDto['body'],
        }),
      })
      const data: CommentDto = await res.json()
      return data
    },
    {
      onSuccess: (data) => {
        addComment(data)

        window.dispatchEvent(new CustomEvent('clear-comment'))
      },
    }
  )
  const onSubmit = React.useCallback(
    (e?: React.FormEvent<HTMLFormElement>) => {
      e?.preventDefault()

      if (e?.currentTarget || formRef.current) {
        const formData = new FormData(e?.currentTarget ?? formRef.current!)
        const comment = formData.get('comment') as string
        if (!comment.trim() || comment.length > MAX_COMMENT_LENGTH) return

        createComment(comment)
      }
    },
    [createComment]
  )

  const isMe = (comment: PostIDLessCommentDto) => comment.userId === me?.id

  return (
    <HoverCard.Root open={isCommenting}>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className="absolute -left-8 top-[5px] flex h-full w-8 origin-top-right translate-x-1.5 scale-95 transform-gpu appearance-none items-start opacity-0 transition-all group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100"
          onClick={() => setIsCommenting((prev) => !prev)}
        >
          <NewCommentIcon className="pointer-events-none h-5 w-5 select-none text-zinc-800 dark:text-zinc-300" />
        </button>
      </HoverCard.Trigger>
      <AnimatePresence>
        {isCommenting && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content
              side="top"
              align="start"
              className="relative"
              asChild
            >
              <motion.div
                key="new-comment-wrapper"
                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.96 }}
              >
                <button
                  type="button"
                  className="absolute -right-1.5 -top-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                  onClick={() => setIsCommenting(false)}
                >
                  <XSquareIcon className="h-6 w-6 text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" />
                </button>
                <main className="flex w-[clamp(200px,40vmax,320px)] flex-col">
                  {currentComments.length > 0 && (
                    <header className="mb-3 border-b border-zinc-300/20 pb-3">
                      <ul className="flex max-h-[70vh] w-full flex-col space-y-0.5 overflow-y-scroll">
                        {currentComments.map((c) => (
                          <li key={c.id}>
                            <div
                              className={clsxm(
                                'flex w-full items-stretch gap-2',
                                isMe(c) && 'flex-row-reverse'
                              )}
                            >
                              <div className="flex w-6 items-end">
                                <Image
                                  src={c.userInfo.imageUrl ?? ''}
                                  alt=""
                                  className="h-6 w-6 select-none rounded-full"
                                  width={24}
                                  height={24}
                                  unoptimized
                                />
                              </div>
                              <div
                                className={clsxm(
                                  'flex flex-1 shrink-0 flex-col',
                                  isMe(c) && 'items-end'
                                )}
                              >
                                <span
                                  className={clsxm(
                                    'flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200',
                                    isMe(c) && 'flex-row-reverse'
                                  )}
                                >
                                  {!isMe(c) && (
                                    <span>{parseDisplayName(c.userInfo)}</span>
                                  )}
                                  <span className="inline-flex select-none text-[12px] font-medium opacity-40">
                                    {dayjs(c.createdAt)
                                      .locale('zh-cn')
                                      .fromNow()}
                                  </span>
                                </span>

                                <div
                                  className={clsxm(
                                    'inline-block whitespace-pre-line rounded-xl px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200',
                                    isMe(c)
                                      ? 'rounded-br-sm bg-sky-200/30 dark:bg-sky-600/80'
                                      : 'rounded-bl-sm bg-zinc-600/5 dark:bg-zinc-500/20'
                                  )}
                                >
                                  <Markdown>{c.body.text}</Markdown>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </header>
                  )}
                  <form
                    className={clsxm(
                      'flex flex-col gap-2 transition-opacity',
                      isLoading && 'pointer-events-none opacity-50'
                    )}
                    ref={formRef}
                    onSubmit={onSubmit}
                  >
                    <SignedIn>
                      <CommentTextarea
                        isLoading={isLoading}
                        onSubmit={onSubmit}
                      />
                    </SignedIn>

                    <SignedOut>
                      <SignInButton
                        mode="modal"
                        redirectUrl={url(pathname).href}
                      >
                        <Button>
                          <UserArrowLeftIcon className="mr-1 h-5 w-5" />
                          登录后参与讨论
                        </Button>
                      </SignInButton>
                    </SignedOut>
                  </form>
                </main>
              </motion.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  )
}

type CommentTextareaProps = {
  isLoading?: boolean
  onSubmit?: () => void
}
function CommentTextarea({ isLoading, onSubmit }: CommentTextareaProps) {
  const { user: me } = useUser()
  const [comment, setComment] = React.useState('')
  const onKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault()
        onSubmit?.()
      }
    },
    [onSubmit]
  )
  React.useEffect(() => {
    const handler = () => {
      setComment('')
    }
    window.addEventListener('clear-comment', handler)

    return () => {
      window.removeEventListener('clear-comment', handler)
    }
  }, [])

  return (
    <>
      <div className="flex w-full pb-1">
        <TextareaAutosize
          id="comment"
          name="comment"
          className="block w-full resize-none border-0 bg-transparent text-sm leading-6 text-zinc-800 placeholder-zinc-300 outline-none focus:outline-none dark:text-zinc-200 dark:placeholder-zinc-500"
          placeholder="留下你的评论吧..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onKeyDown={onKeydown}
          disabled={isLoading}
          maxRows={8}
          autoFocus
        />
      </div>
      <footer className="flex w-full items-center justify-between">
        <Image
          src={me?.imageUrl ?? ''}
          alt=""
          className="h-6 w-6 select-none rounded-full"
          width={24}
          height={24}
          unoptimized
        />
        <AnimatePresence>
          {comment.length > 0 && (
            <motion.aside
              key="send-button-wrapper"
              initial={{ opacity: 0, y: 12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              className="flex items-center gap-2"
            >
              <span className="text-[12px] text-zinc-500">
                {comment.length}/{MAX_COMMENT_LENGTH}
              </span>
              <motion.button
                className="appearance-none"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={isLoading}
              >
                <TiltedSendIcon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
              </motion.button>
            </motion.aside>
          )}
        </AnimatePresence>
      </footer>
    </>
  )
}
