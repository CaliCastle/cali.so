'use client'

import { PortableText, type PortableTextComponents } from '@portabletext/react'
import React from 'react'

import { NewCommentIcon } from '~/assets'
import { BleedThroughImage } from '~/components/BleedThroughImage'
import { PeekabooLink } from '~/components/links/PeekabooLink'
import { HoverCard } from '~/components/ui/HoverCard'

const components: PortableTextComponents = {
  block: {
    normal: ({ value, children }) => {
      const isEmpty = !Boolean(
        value.children
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          .map((child) => ('text' in child ? child.text : ''))
          .join('')
      )
      const [isCommenting, setIsCommenting] = React.useState(false)

      return (
        <p
          data-blockid={isEmpty ? undefined : value._key}
          className="group relative"
        >
          {!isEmpty && (
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
              <HoverCard.Portal>
                <HoverCard.Content side="top" align="start">
                  You are commenting
                </HoverCard.Content>
              </HoverCard.Portal>
            </HoverCard.Root>
          )}
          {children}
        </p>
      )
    },
  },
  types: {
    image: ({ value }) => (
      <BleedThroughImage
        src={value.url}
        alt=""
        dimensions={value.dimensions}
        lqip={value.lqip}
      />
    ),
  },

  marks: {
    link: ({ children, value }) => {
      const rel = !value.href.startsWith('/')
        ? 'noreferrer noopener'
        : undefined
      return (
        <PeekabooLink href={value.href} rel={rel}>
          {children}
        </PeekabooLink>
      )
    },
  },
}

export function PostPortableText(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any
  components?: PortableTextComponents
}) {
  return (
    <PortableText
      value={props.value}
      components={props.components ?? components}
    />
  )
}
