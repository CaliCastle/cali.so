//opengraph-image TBD

import { type Metadata } from 'next'
import Balancer from 'react-wrap-balancer'

import { Container } from '~/components/ui/Container'
import { fetchGuestbookMessages } from '~/db/queries/guestbook'

import { Guestbook } from './Guestbook'

const title = '留言墙'
const description =
  '留个言吧，有什么想对我说的都可以写在这里。期待你的留言！'
export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
  },
} satisfies Metadata

export default async function GuestBookPage() {
  const messages = await fetchGuestbookMessages()

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          欢迎来到留言墙
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          <Balancer>{description}</Balancer>
        </p>
      </header>
      <div className="mt-16 sm:mt-20">
        <Guestbook messages={messages} />
      </div>
    </Container>
  )
}
