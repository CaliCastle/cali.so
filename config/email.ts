export const emailConfig = {
  from: 'hi@marksun.co.uk',
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? `https://marksun.co.uk`
      : 'http://localhost:3000',
}
