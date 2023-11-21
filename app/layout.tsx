import './globals.css'
import './clerk.css'
import './prism.css'

import { ClerkProvider } from '@clerk/nextjs'
import { type Metadata } from 'next'

import { ThemeProvider } from '~/app/(main)/ThemeProvider'
import { url } from '~/lib'
import { zhCN } from '~/lib/clerkLocalizations'
import { sansFont } from '~/lib/font'
import { seo } from '~/lib/seo'

export const metadata: Metadata = {
  metadataBase: seo.url,
  title: {
    template: '%s | Suremotoo',
    default: seo.title,
  },
  description: seo.description,
  keywords: 'Suremotoo，开发者',
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
      default: seo.title,
      template: '%s | Suremotoo',
    },
    description: seo.description,
    siteName: 'Suremotoo',
    locale: 'zh_CN',
    type: 'website',
    url: 'https://suremotoo.cc',
  },
  twitter: {
    site: '@suremotoo',
    creator: '@suremotoo',
    card: 'summary_large_image',
    title: seo.title,
    description: seo.description,
  },
  alternates: {
    canonical: url('/'),
    types: {
      'application/rss+xml': [{ url: 'rss', title: 'RSS 订阅' }],
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider localization={zhCN}>
      <html
        lang="zh-CN"
        className={`${sansFont.variable} m-0 h-full p-0 font-sans antialiased`}
        suppressHydrationWarning
      >
        <body className="flex h-full flex-col">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
