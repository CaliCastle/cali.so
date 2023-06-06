import { Ratelimit } from '@upstash/ratelimit'
import { eq } from 'drizzle-orm'
import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { emailConfig } from '~/config/email'
import { db } from '~/db'
import { subscribers } from '~/db/schema'
import ConfirmSubscriptionEmail from '~/emails/ConfirmSubscription'
import { env } from '~/env.mjs'
import { url } from '~/lib'
import { resend } from '~/lib/mail'
import { redis } from '~/lib/redis'

const newsletterFormSchema = z.object({
  email: z.string().email().nonempty(),
})

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '10 s'),
  analytics: true,
})

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

    const [subscriber] = await db
      .select()
      .from(subscribers)
      .where(eq(subscribers.email, parsed.email))

    if (subscriber) {
      return NextResponse.json({ status: 'success' })
    }

    // generate a random one-time token
    const token = crypto.randomUUID()

    if (env.NODE_ENV === 'production') {
      await resend.sendEmail({
        from: emailConfig.from,
        to: parsed.email,
        subject: '来自 Cali 的订阅确认',
        react: ConfirmSubscriptionEmail({
          link: url(`confirm/${token}`).href,
        }),
      })

      await db.insert(subscribers).values({
        email: parsed.email,
        token,
      })
    }

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('[Newsletter]', error)

    return NextResponse.error()
  }
}
