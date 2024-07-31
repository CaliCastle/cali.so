import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { Container } from '~/components/ui/Container'
import { db } from '~/db'
import { subscribers } from '~/db/schema'

import { Unsubed } from './Unsubed'

export const metadata = {
  title: '您已成功退订！',
}

export default async function UnsubPage({
  params,
}: {
  params: { token: string }
}) {
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.unsub_token, params.token))

  if (!subscriber || subscriber.unsubscribedAt) {
    redirect('/')
  }

  await db
    .update(subscribers)
    .set({ subscribedAt: null, unsubscribedAt: new Date(), unsub_token: null, updatedAt: new Date() })
    .where(eq(subscribers.id, subscriber.id))

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="relative mx-auto flex w-full max-w-2xl items-center justify-center">
        <h1
          className="w-full text-center text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
          id="Unsubed"
        >
          👋  您已成功退订！ 😊
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400"></p>
      </header>
      <Unsubed />
    </Container>
  )
}
