export const emailConfig = {
  from: 'hi@lemondy.org',
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? `https://lemondy.org`
      : 'http://localhost:3000',
}
