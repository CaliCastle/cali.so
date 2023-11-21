export const emailConfig = {
  from: 'suremotoo@gmail.com',
  baseUrl:
    process.env.VERCEL_ENV === 'production'
      ? `https://suremotoo.cc`
      : 'http://localhost:3000',
}
