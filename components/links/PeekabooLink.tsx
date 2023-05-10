'use client'

import { clsxm } from '@zolplay/utils'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link, { type LinkProps } from 'next/link'
import React from 'react'

import { HoverCard } from '~/components/ui/HoverCard'

const shimmer = (w: number, h: number) => `
<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="gshimmer">
      <stop stop-color="#eee" offset="20%" />
      <stop stop-color="#222" offset="50%" />
      <stop stop-color="#eee" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#333" />
  <rect id="r" width="${w}" height="${h}" fill="url(#gshimmer)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite" />
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

type PeekabooLinkProps = LinkProps &
  React.ComponentPropsWithoutRef<'a'> & {
    children: React.ReactNode
  }
export function PeekabooLink({
  href,
  children,
  className,
  ...props
}: PeekabooLinkProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  // if it's a relative link, use a fallback Link
  if (!href.startsWith('http')) {
    return (
      <Link href={href} className={clsxm(className)} {...props}>
        {children}
      </Link>
    )
  }

  function onOpenChange(open: boolean) {
    setIsOpen(open)
  }

  return (
    <HoverCard.Root openDelay={0} closeDelay={50} onOpenChange={onOpenChange}>
      <HoverCard.Trigger asChild>
        <Link
          href={`${href}?utm_source=cali.so`}
          className={clsxm(
            'font-semibold text-zinc-800 hover:underline dark:text-zinc-100',
            className
          )}
          target="_blank"
          {...props}
        >
          {children}
        </Link>
      </HoverCard.Trigger>
      <AnimatePresence mode="wait">
        {isOpen && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content asChild>
              <motion.div
                className="pointer-events-none relative w-[300px] overflow-hidden !p-0"
                initial={{
                  opacity: 0,
                  scale: 0.965,
                  y: 9,
                  transformOrigin: 'center 115px',
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: 0,
                  transformOrigin: 'center 115px',
                  height: 150,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.98,
                  y: 8,
                  transformOrigin: 'center 115px',
                  height: 90,
                }}
                transition={{
                  duration: 0.2,
                }}
              >
                <Image
                  src={`/api/link.preview?url=${href}`}
                  placeholder="blur"
                  blurDataURL={`data:image/svg+xml;base64,${toBase64(
                    shimmer(300, 150)
                  )}`}
                  priority
                  alt={`${href} 的预览图`}
                  width={300}
                  height={150}
                  className="pointer-events-none absolute left-0 top-0 h-full w-full rounded-xl object-cover"
                />
              </motion.div>
            </HoverCard.Content>
          </HoverCard.Portal>
        )}
      </AnimatePresence>
    </HoverCard.Root>
  )
}
