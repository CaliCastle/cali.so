'use client'

import { SignedIn, SignedOut, SignInButton, useUser } from '@clerk/nextjs'
import { clsxm } from '@zolplay/utils'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import React from 'react'
import { useMutation } from 'react-query'
import { useSnapshot } from 'valtio'

import { addComment, blogPostState } from '~/app/(main)/blog/blog-post.state'
import {
  NewCommentIcon,
  TiltedSendIcon,
  UserArrowLeftIcon,
  XSquareIcon,
} from '~/assets'
import { Button } from '~/components/ui/Button'
import { HoverCard } from '~/components/ui/HoverCard'
import { type CommentDto } from '~/db/dto/comment.dto'
import { url } from '~/lib'

type CommentableProps = {
  blockId?: string
}
export function Commentable({ blockId }: CommentableProps) {
  const pathname = usePathname()
  const { postId, comments } = useSnapshot(blogPostState)
  const { user: me } = useUser()
  const [isCommenting, setIsCommenting] = React.useState(false)
  const [comment, setComment] = React.useState('')
  const currentComments = React.useMemo(
    () => comments.filter((c) => c.body.blockId === blockId),
    [comments, blockId]
  )

  const { mutate: createComment, isLoading } = useMutation(
    ['comment', postId],
    async () => {
      const res = await fetch(`/api/comments/${postId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: {
            blockId,
            text: comment.trim(),
          } satisfies CommentDto['body'],
        }),
      })
      const data: CommentDto = await res.json()
      return data
    },
    {
      onSuccess: (data) => {
        addComment(data)
        setComment('')
      },
    }
  )
  const onSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    if (!comment.trim()) return

    createComment()
  }
  const onCommentKeydown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.metaKey) {
      e.preventDefault()
      onSubmit()
    }
  }

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
                <SignedIn>
                  {me && (
                    <>
                      <button
                        type="button"
                        className="absolute -right-1.5 -top-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800"
                        onClick={() => setIsCommenting(false)}
                      >
                        <XSquareIcon className="h-6 w-6 text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200" />
                      </button>
                      <main className="flex w-[clamp(200px,40vmin,320px)] flex-col">
                        {currentComments.length > 0 && (
                          <header className="mb-2 flex items-center justify-between">
                            <h3 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              所有评论
                            </h3>
                          </header>
                        )}
                        <form
                          className={clsxm(
                            'flex flex-col gap-2 transition-opacity',
                            isLoading && 'pointer-events-none opacity-50'
                          )}
                          onSubmit={onSubmit}
                        >
                          <div className="flex w-full gap-2">
                            <Image
                              src={me.imageUrl}
                              alt=""
                              className="h-6 w-6 select-none rounded-full"
                              width={24}
                              height={24}
                              unoptimized
                            />
                            <textarea
                              rows={3}
                              name="comment"
                              id="comment"
                              className="block w-full resize-none border-0 bg-transparent text-sm leading-6 text-zinc-800 placeholder-zinc-300 outline-none focus:outline-none dark:text-zinc-200 dark:placeholder-zinc-500"
                              placeholder="留下你的评论吧..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              onKeyDown={onCommentKeydown}
                              disabled={isLoading}
                              autoFocus
                            />
                          </div>
                          <footer className="flex w-full items-center justify-end">
                            <AnimatePresence>
                              {comment.trim().length > 0 && (
                                <motion.aside
                                  key="send-button-wrapper"
                                  initial={{ opacity: 0, y: 12, height: 0 }}
                                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                                  exit={{ opacity: 0, y: 20, height: 0 }}
                                  className="flex items-center gap-2"
                                >
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
                        </form>
                      </main>
                    </>
                  )}
                </SignedIn>
                <SignedOut>
                  <SignInButton mode="modal" redirectUrl={url(pathname).href}>
                    <Button>
                      <UserArrowLeftIcon className="mr-1 h-5 w-5" />
                      登录后参与讨论
                    </Button>
                  </SignInButton>
                </SignedOut>
              </motion.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  )
}
