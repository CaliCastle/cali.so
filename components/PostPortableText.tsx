'use client'

import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import React from 'react'
import { Tweet } from 'react-tweet'

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
    h1: ({ value, children }) => {
      return (
        <h1 data-blockid={value._key} className="group relative">
          <ClientOnly>
            <Commentable blockId={value._key} />
          </ClientOnly>
          {children}
        </h1>
      )
    },
    h2: ({ value, children }) => {
      return (
        <h2 data-blockid={value._key} className="group relative">
          <ClientOnly>
            <Commentable blockId={value._key} />
          </ClientOnly>
          {children}
        </h2>
      )
    },
    h3: ({ value, children }) => {
      return (
        <h3 data-blockid={value._key} className="group relative">
          <ClientOnly>
            <Commentable blockId={value._key} />
          </ClientOnly>
          {children}
        </h3>
      )
    },
    h4: ({ value, children }) => {
      return (
        <h4 data-blockid={value._key} className="group relative">
          <ClientOnly>
            <Commentable blockId={value._key} />
          </ClientOnly>
          {children}
        </h4>
      )
    },
  },
  listItem: ({ value, children }) => {
    return (
      <li data-blockid={value._key} className="group relative">
        <ClientOnly>
          <Commentable className="mr-5" blockId={value._key} />
        </ClientOnly>
        {children}
      </li>
    )
  },
  types: {
    image: ({ value }) => {
      return (
        <div data-blockid={value._key} className="group relative">
          <ClientOnly>
            <Commentable blockId={value._key} />
          </ClientOnly>

          <Image
            src={value.url}
            width={value.dimensions.width}
            height={value.dimensions.height}
            unoptimized
            placeholder={value.lqip ? 'blur' : 'empty'}
            blurDataURL={value.lqip}
            className="relative z-20 rounded-xl md:rounded-3xl"
            alt=""
          />
        </div>
      )
    },
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
