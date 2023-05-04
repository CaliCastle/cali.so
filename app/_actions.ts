'use server'

import { z } from 'zod'

import { env } from '~/env.mjs'
import { withValidate } from '~/lib/validation'

export const subscribeToNewsletter = withValidate(
  z.object({
    email: z.string().email({ message: '邮箱地址不正确' }).nonempty(),
  }),
  async ({ email }) => {
    const url = [
      'https://api.convertkit.com/v3',
      'forms',
      '5108903', // formId
      'subscribe',
    ].join('/')

    const headers = new Headers({
      'Content-Type': 'application/json; charset=utf-8',
    })

    const res = await fetch(url, {
      method: 'POST',
      headers,
      cache: 'no-cache',
      body: JSON.stringify({
        api_key: env.CONVERTKIT_API_KEY,
        email,
        tags: [
          // cali.so newsletter tag
          3817600,
          // Chinese newsletter tag
          3817754,
        ],
      }),
    })

    if (!res.ok) {
      throw new Error('Failed to subscribe')
    }
  }
)
