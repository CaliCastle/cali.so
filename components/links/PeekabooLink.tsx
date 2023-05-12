'use client'

import { clsxm } from '@zolplay/utils'
import { AnimatePresence } from 'framer-motion'
import { motion } from 'framer-motion'
import Link, { type LinkProps } from 'next/link'
import React from 'react'

import { RichLink } from '~/components/links/RichLink'
import { HoverCard } from '~/components/ui/HoverCard'

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
        <RichLink
          href={href}
          className={clsxm(
            'font-semibold text-zinc-800 hover:underline dark:text-zinc-100',
            className
          )}
          target="_blank"
          {...props}
        >
          {children}
        </RichLink>
      </HoverCard.Trigger>
      <AnimatePresence mode="wait">
        {isOpen && (
          <HoverCard.Portal forceMount>
            <HoverCard.Content asChild>
              <motion.div
                className="pointer-events-none relative w-[400px] overflow-hidden !p-0"
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
                  height: 250,
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
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/api/link-preview?url=${href}`}
                  alt={`${href} 的预览图`}
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
