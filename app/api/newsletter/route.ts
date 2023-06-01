import { Ratelimit } from '@upstash/ratelimit'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

import { emailConfig } from '~/config/email'
import { db } from '~/db'
import { subscribers } from '~/db/schema'
import ConfirmSubscriptionEmail from '~/emails/confirm-subscription'
import { env } from '~/env.mjs'
import { url } from '~/lib'
import { redis } from '~/lib/redis'

const newsletterFormSchema = z.object({
  email: z.string().email().nonempty(),
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '10 s'),
  analytics: true,
})

const resend = new Resend(env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  if (env.NODE_ENV === 'production') {
    const { success } = await ratelimit.limit('subscribe_' + (req.ip ?? ''))
    if (!success) {
      return NextResponse.error()
    }
  }

  try {
    const { data } = await req.json()
    const parsed = newsletterFormSchema.parse(data)

    // generate a random one-time token
    const token = crypto.randomUUID()

    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, parsed.email))

    if (subscriber && subscriber.subscribedAt) {
      return NextResponse.json({ status: 'success' })
    }

    if (env.NODE_ENV === 'production') {
      await resend.sendEmail({
        from: emailConfig.from,
        to: parsed.email,
        subject: '来自 Cali 的订阅确认',
        react: ConfirmSubscriptionEmail({
          link: url(`confirm/${token}`).href,
        }),
      })

      if (!subscriber) {
        await db.insert(subscribers).values({
          email: parsed.email,
          token,
        })
      } else {
        await db
          .update(subscribers)
          .set({ token })
          .where(eq(subscribers.email, parsed.email))
      }
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('[Newsletter]', error)

    return NextResponse.error()
  }
}
