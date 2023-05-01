import { type NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

import { env } from '~/env.mjs'

const API_KEY = env.CONVERTKIT_API_KEY
const BASE_URL = 'https://api.convertkit.com/v3'

const newsletterFormSchema = z.object({
  email: z.string().email().nonempty(),
  formId: z.string().nonempty(),
})

function subscribeToForm({ formId, email }: { formId: string; email: string }) {
  const url = [BASE_URL, 'forms', formId, 'subscribe'].join('/')

  const headers = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
  })

  return fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      api_key: API_KEY,
      email,
      tags: [
        // cali.so newsletter tag
        3817600,
        // Chinese newsletter tag
        3817754,
      ],
    }),
  })
}

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const { data } = await req.json()
    const parsed = newsletterFormSchema.parse(data)
    const res = await subscribeToForm(parsed)
    if (res.ok) {
      return NextResponse.json({ status: 'success' })
    }

    return NextResponse.error()
  } catch (error) {
    console.error('[Newsletter]', error)

    return NextResponse.error()
  }
}
