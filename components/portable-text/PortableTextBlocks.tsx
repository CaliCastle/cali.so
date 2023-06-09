import { type PortableTextComponentProps } from '@portabletext/react'
import React from 'react'

import { ClientOnly } from '~/components/ClientOnly'
import { Commentable } from '~/components/Commentable'

export function PortableTextBlocksNormal({
  value,
  children,
}: PortableTextComponentProps<any>) {
  const isEmpty = !Boolean(
    value.children
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      .map((child: any) => ('text' in child ? child.text : ''))
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
}

export function PortableTextBlocksH1({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <h1 data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable blockId={value._key} />
      </ClientOnly>
      {children}
    </h1>
  )
}

export function PortableTextBlocksH2({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <h2 data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable blockId={value._key} />
      </ClientOnly>
      {children}
    </h2>
  )
}

export function PortableTextBlocksH3({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <h3 data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable blockId={value._key} />
      </ClientOnly>
      {children}
    </h3>
  )
}

export function PortableTextBlocksH4({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <h4 data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable blockId={value._key} />
      </ClientOnly>
      {children}
    </h4>
  )
}

export function PortableTextBlocksBlockquote({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <blockquote data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable blockId={value._key} />
      </ClientOnly>
      {children}
    </blockquote>
  )
}

export function PortableTextBlocksListItem({
  value,
  children,
}: PortableTextComponentProps<any>) {
  return (
    <li data-blockid={value._key} className="group relative">
      <ClientOnly>
        <Commentable className="mr-5" blockId={value._key} />
      </ClientOnly>
      {children}
    </li>
  )
}
