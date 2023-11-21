export const seo = {
  title: 'Suremotoo | 开发者、妄想家',
  description:
    '我叫 Suremotoo，一名开发者。',
  url: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://suremotoo.cc'
      : 'http://localhost:3000'
  ),
} as const
