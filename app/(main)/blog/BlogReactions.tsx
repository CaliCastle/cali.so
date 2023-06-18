'use client'

import {
  motion,
  type MotionValue,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import Image from 'next/image'
import React from 'react'

import { prettifyNumber } from '~/lib/math'
import { type Post } from '~/sanity/schemas/post'

function moodToReactions(mood: Post['mood']) {
  switch (mood) {
    case 'happy':
      return ['claps', 'tada', 'confetti', 'fire']
    case 'sad':
      return ['pray', 'cry', 'heart', 'hugs']
    default:
      return ['claps', 'heart', 'thumbs-up', 'fire']
  }
}

export function BlogReactions({
  _id,
  mood,
  reactions,
}: Pick<Post, '_id' | 'mood'> & { reactions?: number[] }) {
  const mouseY = useMotionValue(Infinity)
  const onMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      mouseY.set(e.clientY)
    },
    [mouseY]
  )
  const [cachedReactions, setCachedReactions] = React.useState(
    reactions ?? [0, 0, 0, 0]
  )
  const onClick = React.useCallback(
    async (index: number) => {
      // Optimistic update
      setCachedReactions((prev) => {
        const next = [...prev]
        next[index]++
        return next
      })

      const res = await fetch(`/api/reactions?id=${_id}&index=${index}`, {
        method: 'PATCH',
      })
      const { data } = (await res.json()) as { data: number[] }
      setCachedReactions(data)
    },
    [_id]
  )

  return (
    <motion.div
      className="pointer-events-auto flex w-12 flex-col items-center justify-center gap-8 rounded-3xl bg-gradient-to-b from-zinc-100/80 to-white/90 px-1 pb-8 pt-4 ring-1 ring-zinc-400/10 backdrop-blur-lg dark:from-zinc-800/80 dark:to-zinc-950/80 dark:ring-zinc-500/10"
      onMouseMove={onMouseMove}
      onMouseLeave={() => mouseY.set(Infinity)}
      initial={{
        opacity: 0,
        y: 8,
        rotateY: 90,
      }}
      animate={{
        opacity: 1,
        y: 0,
        rotateY: 0,
      }}
      transition={{
        delay: 0.5,
        duration: 0.55,
        type: 'spring',
        damping: 15,
        stiffness: 180,
      }}
    >
      {moodToReactions(mood).map((reaction, idx) => (
        <ReactIcon
          key={idx}
          y={mouseY}
          image={`/reactions/${reaction}.png`}
          count={cachedReactions[idx]}
          onClick={() => onClick(idx)}
        />
      ))}
    </motion.div>
  )
}

function ReactIcon({
  y,
  image,
  count = 0,
  onClick,
}: {
  y: MotionValue
  image: string
  count?: number
  onClick?: () => void
}) {
  const ref = React.useRef<HTMLButtonElement>(null)

  const distance = useTransform(y, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { y: 0, height: 0 }

    return val - bounds.y - bounds.height / 2
  })

  const heightSync = useTransform(distance, [-120, 0, 120], [24, 56, 24])
  const height = useSpring(heightSync, {
    mass: 0.1,
    stiffness: 180,
    damping: 15,
  })

  return (
    <motion.button
      ref={ref}
      type="button"
      style={{ height }}
      className="relative aspect-square h-8"
      whileTap={{
        scale: 1.3,
      }}
      onClick={onClick}
    >
      <Image
        src={image}
        alt=""
        className="inline-block"
        priority
        fetchPriority="high"
        fill
        unoptimized
      />
      <span className="absolute -bottom-6 left-0 flex w-full items-center justify-center whitespace-nowrap text-[12px] font-semibold text-zinc-700/30 dark:text-zinc-200/25">
        {prettifyNumber(count, true)}
      </span>
    </motion.button>
  )
}
