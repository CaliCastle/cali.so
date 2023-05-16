import { PortableText, type PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'

import { PeekabooLink } from '~/components/links/PeekabooLink'

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => (
      <Image
        src={value.url}
        alt=""
        width={value.dimensions.width}
        height={value.dimensions.height}
        placeholder="blur"
        blurDataURL={value.lqip}
        unoptimized
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
