export const seo = {
  title: '马克孙 | 物理学生,创始人,开发者',
  description:
    '我是孙霄逸，你可以叫我马克。一名物理学生，梦想家。我希望我的创造物日后可以改变世界。',
  url: new URL(
    process.env.NODE_ENV === 'production'
      ? 'https://marksun.co.uk'
      : 'http://localhost:3000'
  ),
} as const
