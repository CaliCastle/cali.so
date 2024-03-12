import { env } from '~/env.mjs'

export const emailConfig = {
  from: env.NEXT_PUBLIC_SITE_EMAIL_FROM,
  baseUrl:
    env.VERCEL_ENV === 'production'
      ? env.NEXT_PUBLIC_SITE_URL
      : 'http://localhost:3000',
}
