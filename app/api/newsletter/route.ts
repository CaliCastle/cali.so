import { Ratelimit } from '@upstash/ratelimit'
import { type NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

import { emailConfig } from '~/config/email'
import ConfirmSubscriptionEmail from '~/emails/confirm-subscription'
import { env } from '~/env.mjs'
import { redis } from '~/lib/redis'

const newsletterFormSchema = z.object({
  email: z.string().email().nonempty(),
})

export const runtime = 'edge'

const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '10 s'),
  analytics: true,
})

export async function POST(req: NextRequest) {
  const { success } = await ratelimit.limit('subscribe_' + (req.ip ?? ''))
  if (!success) {
    return NextResponse.error()
  }

  try {
    const { data } = await req.json()
    const parsed = newsletterFormSchema.parse(data)

    // generate a random one-time token
    const token = Math.random().toString(36).slice(2)

    await new Resend(env.RESEND_API_KEY).sendEmail({
      from: emailConfig.from,
      to: parsed.email,
      subject: '确认订阅 Cali 的动态吗？',
      react: ConfirmSubscriptionEmail({ token }),
    })

    return NextResponse.json({ status: 'success' })
  } catch (error) {
    console.error('[Newsletter]', error)

    return NextResponse.error()
  }
}
