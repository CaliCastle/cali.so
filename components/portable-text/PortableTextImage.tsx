'use client'

import { type PortableTextComponentProps } from '@portabletext/react'
import Image from 'next/image'
import React from 'react'

import { ClientOnly } from '~/components/ClientOnly'
import { Commentable } from '~/components/Commentable'

export function PortableTextImage({
  value,
}: PortableTextComponentProps<{
  _key: string
  url: string
  dimensions: {
    width: number
    height: number
  }
  lqip?: string
}>) {
  return (
    <div data-blockid={value._key} className="group relative pr-3 md:pr-0">
      <ClientOnly>
        <Commentable className="z-30" blockId={value._key} />
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
}
