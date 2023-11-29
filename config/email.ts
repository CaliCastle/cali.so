export const emailConfig = {
  from: 'hi@marksun.co.uk',
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? `https://cali.so`
      : 'http://localhost:3000',
}
