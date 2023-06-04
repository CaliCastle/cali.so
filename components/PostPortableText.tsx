'use client'

import { PortableText, type PortableTextComponents } from '@portabletext/react'
import React from 'react'
import { Tweet } from 'react-tweet'

import { BleedThroughImage } from '~/components/BleedThroughImage'
import { ClientOnly } from '~/components/ClientOnly'
import { Commentable } from '~/components/Commentable'
import { PeekabooLink } from '~/components/links/PeekabooLink'

const components: PortableTextComponents = {
  block: {
    normal: ({ value, children }) => {
      const isEmpty = !Boolean(
        value.children
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          .map((child) => ('text' in child ? child.text : ''))
          .join('')
      )

      return (
        <p
          data-blockid={isEmpty ? undefined : value._key}
          className="group relative"
        >
          {!isEmpty && (
            <ClientOnly>
              <Commentable blockId={value._key} />
            </ClientOnly>
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
    tweet: ({ value }) => (
      <ClientOnly>
        <div className="flex justify-center">
          <Tweet id={value.id} />
        </div>
      </ClientOnly>
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
