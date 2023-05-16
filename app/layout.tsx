import '~/app/globals.css'

import { type Metadata } from 'next'

import { sansFont } from '~/lib/font'

const title = 'Cali Castle | 开发者、设计师、细节控、创始人'
const description =
  '我叫 Cali，一名开发者，设计师，细节控，同时也是佐玩创始人，目前带领着佐玩致力于创造一个充满创造力的工作环境，同时鼓励团队创造影响世界的产品。'
export const metadata: Metadata = {
  metadataBase: new URL('https://cali.so'),
  title: {
    template: '%s | Cali Castle',
    default: title,
  },
  description,
  keywords: 'Cali,Cali Castle,郭晓楠,佐玩,创始人,CEO,开发者,设计师,细节控,创新',
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#000212' },
    { media: '(prefers-color-scheme: light)', color: '#fafafa' },
  ],
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: {
      default: title,
      template: '%s | Cali Castle',
    },
    description,
    siteName: 'Cali Castle',
    locale: 'zh_CN',
    type: 'website',
    images: [
      {
        url: '/og_zh.png',
        width: 1200,
        height: 630,
      },
    ],
    url: 'https://cali.so',
  },
  twitter: {
    site: '@thecalicastle',
    creator: '@thecalicastle',
    card: 'summary_large_image',
    title,
    description,
    images: [
      {
        url: '/og_zh.png',
        width: 1200,
        height: 630,
      },
    ],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      className={`${sansFont.variable} m-0 h-full p-0 font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex h-full flex-col">{children}</body>
    </html>
  )
}
