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

import {
  addComment,
  blogPostState,
  clearBlockFocus,
  clearReply,
  focusBlock,
  replyTo,
} from '~/app/(main)/blog/blog-post.state'
import {
  EyeCloseIcon,
  EyeOpenIcon,
  NewCommentIcon,
  TiltedSendIcon,
  UserArrowLeftIcon,
  UTurnLeftIcon,
  XIcon,
  XSquareIcon,
} from '~/assets'
import { CommentMarkdown } from '~/components/CommentMarkdown'
import { RichLink } from '~/components/links/RichLink'
import { Button } from '~/components/ui/Button'
import { HoverCard } from '~/components/ui/HoverCard'
import { ElegantTooltip } from '~/components/ui/Tooltip'
import {
  type CommentDto,
  type PostIDLessCommentDto,
} from '~/db/dto/comment.dto'
import { url } from '~/lib'
import { parseDisplayName } from '~/lib/string'

dayjs.extend(relativeTime)

const MAX_COMMENT_LENGTH = 999

type CommentableProps = {
  className?: string
  blockId?: string
}

function Root({ className, blockId }: CommentableProps) {
  const pathname = usePathname()
  const { postId, comments, currentBlockId } = useSnapshot(blogPostState)
  const { user: me } = useUser()
  const [isCommenting, setIsCommenting] = React.useState(false)
  const currentComments = React.useMemo(
    () => comments.filter((c) => c.body.blockId === blockId),
    [comments, blockId]
  )
  const top3Users = React.useMemo(() => {
    if (currentComments.length === 0) {
      return []
    }

    const users = new Set<PostIDLessCommentDto['userId']>()
    const top3: PostIDLessCommentDto['userInfo'][] = []
    for (const comment of currentComments) {
      if (users.has(comment.userId)) {
        continue
      }

      if (comment.userInfo.imageUrl) {
        top3.push(comment.userInfo)
        users.add(comment.userId)
      }

      if (top3.length >= 3) {
        break
      }
    }

    return top3
  }, [currentComments])

  const formRef = React.useRef<HTMLFormElement>(null)
  const commentsRef = React.useRef<HTMLUListElement>(null)
  const scrollToComment = React.useCallback((id: string) => {
    setTimeout(() => {
      if (commentsRef.current) {
        commentsRef.current
          .querySelector(`[data-commentid="${id}"]`)
          ?.scrollIntoView({
            behavior: 'smooth',
          })
      }
    }, 300)
  }, [])

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
          parentId: blogPostState.replyingTo?.id,
        }),
      })
      const data: CommentDto = await res.json()
      return data
    },
    {
      onSuccess: (data) => {
        addComment(data)

        window.requestAnimationFrame(() => {
          scrollToComment(data.id)
        })

        window.dispatchEvent(new CustomEvent('clear-comment'))
      },
    }
  )
  const onSubmit = React.useCallback(
    (e?: React.FormEvent<HTMLFormElement> | string) => {
      let comment = ''
      if (typeof e === 'string') {
        comment = e
      } else {
        e?.preventDefault()

        const form = e?.currentTarget || formRef.current
        if (form) {
          const formData = new FormData(form)
          comment = formData.get('comment') as string
        }
      }

      if (
        !comment ||
        typeof comment !== 'string' ||
        !comment.trim() ||
        comment.length > MAX_COMMENT_LENGTH
      ) {
        return
      }

      createComment(comment.trim())
    },
    [createComment]
  )

  const isMe = React.useCallback(
    (comment: PostIDLessCommentDto) => comment.userId === me?.id,
    [me?.id]
  )
  React.useEffect(() => {
    if (!isCommenting) {
      clearReply()
    }
  }, [isCommenting])

  React.useEffect(() => {
    const event = 'scroll-to-comment'
    const handler = (e: Event) => {
      if (e instanceof CustomEvent && typeof e.detail === 'string') {
        scrollToComment(e.detail)
      }
    }
    window.addEventListener(event, handler)

    return () => {
      window.removeEventListener(event, handler)
    }
  }, [scrollToComment])

  const handleToggleCommenting = React.useCallback(() => {
    if (isCommenting) {
      clearBlockFocus()
    } else {
      focusBlock(blockId ?? null)
    }
  }, [blockId, isCommenting])

  React.useEffect(() => {
    setIsCommenting(currentBlockId === blockId)
  }, [blockId, currentBlockId])

  return (
    <HoverCard.Root open={isCommenting}>
      <AnimatePresence>
        {top3Users.length > 0 && (
          <motion.button
            type="button"
            className={clsxm(
              'absolute -right-2 top-[4px] flex origin-top-right appearance-none flex-col items-center justify-end -space-y-1 md:right-[calc(100%+1.65rem)] md:w-16 md:flex-row md:-space-x-1.5 md:space-y-0',
              className
            )}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={handleToggleCommenting}
          >
            {top3Users.map((user, idx) => (
              <Image
                key={idx}
                src={user.imageUrl ?? ''}
                alt=""
                width={20}
                height={20}
                unoptimized
                className="pointer-events-none h-5 w-5 select-none rounded-full ring-2 ring-white dark:ring-zinc-800"
              />
            ))}
          </motion.button>
        )}
      </AnimatePresence>
      <HoverCard.Trigger asChild>
        <button
          type="button"
          className={clsxm(
            'absolute -right-1 top-[5px] flex h-full origin-top-right translate-x-1.5 scale-95 transform-gpu appearance-none items-start opacity-0 transition-all group-hover:translate-x-0 group-hover:scale-100 group-hover:opacity-100 md:right-[calc(100%+6px)]',
            className
          )}
          onClick={handleToggleCommenting}
        >
          <NewCommentIcon className="pointer-events-none h-5 w-5 select-none rounded-xl bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 md:rounded-none md:bg-transparent" />
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
                  className="group absolute inset-x-0 -top-3 z-50 flex justify-center"
                  onClick={handleToggleCommenting}
                >
                  <XIcon className="h-6 w-6 rounded-full border border-zinc-400/20 bg-white/95 p-1 text-zinc-500 backdrop-blur transition-all group-hover:w-12 group-hover:text-zinc-700 dark:border-zinc-500/30 dark:bg-zinc-800/95 dark:text-zinc-400 dark:group-hover:text-zinc-200" />
                </button>
                <main className="flex w-[clamp(140px,75vw,300px)] flex-col">
                  {currentComments.length > 0 && (
                    <header className="-mx-4 -mt-4 rounded-t-xl border-b border-zinc-400/20 bg-zinc-100/50 dark:border-zinc-300/10 dark:bg-black/20">
                      <ul
                        ref={commentsRef}
                        className="flex max-h-[50vh] w-full flex-col space-y-0.5 overflow-x-hidden overflow-y-scroll p-4 [-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_28px,black_100%)]"
                      >
                        {currentComments.map((c) => (
                          <CommentItem key={c.id} {...c} isMe={isMe} />
                        ))}
                      </ul>
                    </header>
                  )}
                  <form
                    className={clsxm(
                      'flex flex-col gap-2 pt-2 transition-opacity',
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
                      <div className="flex justify-center">
                        <SignInButton
                          mode="modal"
                          redirectUrl={url(pathname).href}
                        >
                          <Button type="button">
                            <UserArrowLeftIcon className="mr-1 h-5 w-5" />
                            登录后参与讨论
                          </Button>
                        </SignInButton>
                      </div>
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

export const Commentable = React.memo(Root)
Commentable.displayName = 'Commentable'
Root.displayName = 'Commentable.Root'

function Comment({
  isMe,
  ...c
}: PostIDLessCommentDto & {
  isMe: (comment: PostIDLessCommentDto) => boolean
}) {
  const isMyself = React.useMemo(() => isMe(c), [c, isMe])
  const onClickReply = React.useCallback(() => {
    replyTo(c)
  }, [c])
  const parentComment = React.useMemo(
    () =>
      c.parentId
        ? blogPostState.comments.find(({ id }) => id === c.parentId)
        : null,
    [c]
  )

  return (
    <li data-commentid={c.id} data-parentid={parentComment?.id}>
      <div
        className={clsxm(
          'flex w-full items-stretch gap-2',
          isMyself ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        <div className="flex w-6 shrink-0 items-end">
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
            'flex flex-1 flex-col',
            isMyself ? 'items-end' : 'items-start'
          )}
        >
          <span
            className={clsxm(
              'flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200',
              isMyself && 'flex-row-reverse'
            )}
          >
            {!isMyself && <span>{parseDisplayName(c.userInfo)}</span>}
            <span className="inline-flex select-none text-[10px] font-medium opacity-40">
              {dayjs(c.createdAt).locale('zh-cn').fromNow()}
            </span>
          </span>

          <div
            className={clsxm(
              'comment__message group relative inline-block break-all rounded-xl px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200',
              isMyself
                ? 'rounded-br-sm bg-sky-300/40 dark:bg-sky-600/80'
                : 'rounded-bl-sm bg-zinc-600/5 dark:bg-zinc-500/20'
            )}
          >
            {!isMyself && (
              <div className="absolute inset-y-0 -right-4 flex h-full translate-x-0.5 transform-gpu items-center opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                <ElegantTooltip content="回复">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.96 }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800"
                    onClick={onClickReply}
                  >
                    <UTurnLeftIcon className="h-4 w-4" />
                  </motion.button>
                </ElegantTooltip>
              </div>
            )}
            {parentComment && (
              <div
                className={clsxm(
                  'border-l-2 pl-1.5 text-[12px] !leading-3',
                  isMyself
                    ? 'border-zinc-500 text-zinc-600 dark:border-zinc-400 dark:text-zinc-300'
                    : 'border-zinc-500 text-zinc-600 dark:border-zinc-400 dark:text-zinc-300'
                )}
                role="button"
                tabIndex={0}
                onClick={() =>
                  window.dispatchEvent(
                    new CustomEvent('scroll-to-comment', {
                      detail: parentComment.id,
                    })
                  )
                }
              >
                <span className="font-semibold">
                  {parseDisplayName(parentComment.userInfo)}
                </span>
                <span className="line-clamp-1 w-full max-w-[240px]">
                  {parentComment.body.text}
                </span>
              </div>
            )}
            <CommentMarkdown>{c.body.text}</CommentMarkdown>
          </div>
        </div>
      </div>
    </li>
  )
}

const CommentItem = React.memo(Comment)
CommentItem.displayName = 'Commentable.CommentItem'
Comment.displayName = 'Commentable.Comment'

type CommentTextareaProps = {
  isLoading?: boolean
  onSubmit?: (comment: string) => void
}
function CommentTextarea({ isLoading, onSubmit }: CommentTextareaProps) {
  const { user: me } = useUser()
  const textareaRef = React.useRef<HTMLTextAreaElement>(null)
  const [comment, setComment] = React.useState('')
  const [isPreviewing, setIsPreviewing] = React.useState(false)

  const { replyingTo } = useSnapshot(blogPostState)

  const onClickSend = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      onSubmit?.(comment)
    },
    [onSubmit, comment]
  )
  const onKeydown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && e.metaKey) {
        e.preventDefault()
        onSubmit?.(comment)
      }
    },
    [onSubmit, comment]
  )
  React.useEffect(() => {
    const handler = () => {
      setComment('')
      setIsPreviewing(false)
      clearReply()
    }
    window.addEventListener('clear-comment', handler)

    return () => {
      window.removeEventListener('clear-comment', handler)
    }
  }, [])

  React.useEffect(() => {
    if (replyingTo) {
      textareaRef.current?.focus()
    }
  }, [replyingTo])

  return (
    <>
      <AnimatePresence>
        {replyingTo && (
          <motion.header
            className="flex w-full items-stretch justify-between gap-1.5"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center">
              <UTurnLeftIcon className="h-4 w-4 text-zinc-500" />
            </div>
            <span className="line-clamp-1 flex-1 shrink-0 border-l-2 border-zinc-300 pl-1.5 text-xs text-zinc-600 dark:border-zinc-600 dark:text-zinc-400">
              {replyingTo.body.text}
            </span>
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={clearReply}
              >
                <XSquareIcon className="h-5 w-5" />
              </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>
      <div className="flex w-full items-end pb-1">
        {isPreviewing ? (
          <div className="comment__message flex-1 shrink-0 break-all px-2 py-1 text-sm text-zinc-800 dark:text-zinc-200">
            <CommentMarkdown>{comment}</CommentMarkdown>
          </div>
        ) : (
          <TextareaAutosize
            ref={textareaRef}
            id="comment"
            name="comment"
            className="block flex-1 shrink-0 resize-none border-0 bg-transparent p-0 text-sm leading-6 text-zinc-800 placeholder-zinc-400 outline-none focus:outline-none focus:ring-0 dark:text-zinc-200 dark:placeholder-zinc-500"
            placeholder={
              replyingTo
                ? `回复 ${parseDisplayName(replyingTo.userInfo)} 的评论...`
                : '留下你的评论吧...'
            }
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={onKeydown}
            disabled={isLoading}
            maxRows={8}
            autoFocus
          />
        )}
        <Image
          src={me?.imageUrl ?? ''}
          alt=""
          className="h-6 w-6 select-none rounded-full"
          width={24}
          height={24}
          unoptimized
        />
      </div>
      <footer className="flex h-5 w-full items-center justify-between">
        <span
          className={clsxm(
            'flex-1 shrink-0 select-none text-[10px] text-zinc-500 transition-opacity',
            comment.length > 0 ? 'opacity-100' : 'opacity-0'
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
          {comment.length > 0 && (
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
                  comment.length > MAX_COMMENT_LENGTH
                    ? 'text-red-500'
                    : 'text-zinc-500'
                )}
              >
                {comment.length}/{MAX_COMMENT_LENGTH}
              </span>

              <ElegantTooltip content={isPreviewing ? '关闭预览' : '预览一下'}>
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
                  type="submit"
                  disabled={isLoading}
                  onClick={onClickSend}
                >
                  <TiltedSendIcon className="h-5 w-5 text-zinc-800 dark:text-zinc-200" />
                </motion.button>
              </ElegantTooltip>
            </motion.aside>
          )}
        </AnimatePresence>
      </footer>
    </>
  )
}
