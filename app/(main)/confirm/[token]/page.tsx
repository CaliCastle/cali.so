import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'

import { Container } from '~/components/ui/Container'
import { db } from '~/db'
import { subscribers } from '~/db/schema'

import { SubbedCelebration } from './SubbedCelebration'

export const metadata = {
  title: '感谢你的订阅',
}

export default async function ConfirmPage({
  params,
}: {
  params: { token: string }
}) {
  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.token, params.token))

  if (!subscriber || subscriber.subscribedAt) {
    redirect('/')
  }

  await db
    .update(subscribers)
    .set({ subscribedAt: new Date(), token: null })
    .where(eq(subscribers.id, subscriber.id))

  return (
    <Container className="mt-16 sm:mt-32">
      <header className="relative mx-auto flex w-full max-w-2xl items-center justify-center">
        <h1
          className="w-full text-center text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
          id="subbed-celebration"
        >
          🥳 感谢你的订阅 🎉
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400"></p>
      </header>
      <SubbedCelebration />
    </Container>
  )
}
