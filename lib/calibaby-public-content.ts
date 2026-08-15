import 'server-only'

import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { localeRoutePair } from './locale-metadata'
import type { Locale } from './locale-route'

export type CaliBabyPageKind = 'support' | 'privacy' | 'terms'

export const CALI_BABY_APP_STORE_ID = '6769728441'
export const CALI_BABY_APP_STORE_URL =
  'https://apps.apple.com/app/id6769728441'

const LANDING_METADATA: Record<
  Locale,
  { title: string; description: string }
> = {
  zh: {
    title: 'Cali 宝宝｜宝宝的事很多，不必都靠脑子记',
    description:
      '胎动、喂奶、睡眠、尿布，发生了就顺手记一下。家里人都能看到刚刚发生了什么，换谁来照顾，都不用再从头问一遍。',
  },
  en: {
    title: 'Cali Baby | You don’t have to remember every feed.',
    description:
      'Log kicks, feeds, sleep, and diapers as they happen. Everyone caring for the baby can see what happened and when, so whoever takes over doesn’t have to start with a round of questions.',
  },
}

export const CALI_BABY_PRODUCT_DETAILS = {
  zh: {
    title: '从孕期到宝宝出生后的每一天',
    introduction:
      'Cali 宝宝把胎动、宫缩、喂养、睡眠、尿布和成长记录放在一处。无需账号即可开始，常用记录也能从锁定画面、Siri 或 Apple Watch 随手完成。',
    facts:
      'Zolplay 出品 · 适用于 iPhone 与 Apple Watch · 需 iOS 18 与 watchOS 11 或更高版本 · 支持简体中文与英文 · 免费下载，可选 Cali Baby Pro',
    features: [
      {
        title: '孕期记录',
        description: '记录胎动、宫缩、孕期体重、产检和待产包，陪你走到宝宝出生。',
      },
      {
        title: '日常照顾',
        description: '记录母乳、奶瓶、吸奶、辅食、睡眠、尿布、洗澡、体温和成长。',
      },
      {
        title: '随手记录',
        description:
          '通过小组件、实时活动、Siri、快捷指令和 Apple Watch，少几步完成常用记录。',
      },
      {
        title: '一起照顾',
        description:
          '按需开启家庭同步，让获得授权的照顾者查看并记录同一个宝宝的近况。',
      },
    ],
  },
  en: {
    title: 'From pregnancy through everyday care',
    introduction:
      'Cali Baby keeps kicks, contractions, feeding, sleep, diapers, and growth in one calm place. Start without an account, then log common care from the Lock Screen, Siri, or Apple Watch.',
    facts:
      'By Zolplay · For iPhone and Apple Watch · Requires iOS 18 and watchOS 11 or later · English and Simplified Chinese · Free with optional Cali Baby Pro',
    features: [
      {
        title: 'Pregnancy',
        description:
          'Track kicks, contractions, pregnancy weight, prenatal checkups, and a hospital bag checklist.',
      },
      {
        title: 'Daily care',
        description:
          'Log nursing, bottles, pumping, solids, sleep, diapers, baths, temperature, growth, and more.',
      },
      {
        title: 'Quick entry',
        description:
          'Use widgets, Live Activities, Siri, Shortcuts, and Apple Watch to record common care with fewer steps.',
      },
      {
        title: 'Care together',
        description:
          'Turn on Family Sync when needed so authorized caregivers can view and log care for the same baby.',
      },
    ],
  },
} as const

type CaliBabyPublicContent = {
  route: string
  metadataTitle: string
  metadataDescription: string
  title: string
  body: string
}

const SOURCE = readFileSync(
  join(process.cwd(), 'docs/calibaby-public-copy.md'),
  'utf8',
)

const MARKERS: Record<Locale, Record<CaliBabyPageKind, [string, string | null]>> = {
  zh: {
    support: ['## 中文产品与支持页', '## English product and support page'],
    privacy: ['## 中文隐私政策', '## English Privacy Policy'],
    terms: ['## 中文使用条款', '## English Terms of Use'],
  },
  en: {
    support: ['## English product and support page', '## 中文隐私政策'],
    privacy: ['## English Privacy Policy', '## 中文使用条款'],
    terms: ['## English Terms of Use', null],
  },
}

function sectionBetween(startMarker: string, endMarker: string | null) {
  const start = SOURCE.indexOf(startMarker)
  if (start < 0) throw new Error(`Missing Cali Baby content marker: ${startMarker}`)

  const bodyStart = start + startMarker.length
  const end = endMarker ? SOURCE.indexOf(endMarker, bodyStart) : SOURCE.length
  if (endMarker && end < 0) {
    throw new Error(`Missing Cali Baby content marker: ${endMarker}`)
  }

  return SOURCE.slice(bodyStart, end)
    .trim()
    .replace(/\n---\s*$/, '')
    .trim()
}

function capture(section: string, pattern: RegExp, label: string) {
  const value = section.match(pattern)?.[1]
  if (!value) throw new Error(`Missing ${label} in Cali Baby public copy`)
  return value
}

export function getCaliBabyPublicContent(
  locale: Locale,
  kind: CaliBabyPageKind,
): CaliBabyPublicContent {
  const [start, end] = MARKERS[locale][kind]
  const section = sectionBetween(start, end)
  const titleMatch = /^# (.+)$/m.exec(section)
  if (!titleMatch || titleMatch.index === undefined) {
    throw new Error(`Missing page title for Cali Baby ${locale} ${kind}`)
  }

  const titleEnd = titleMatch.index + titleMatch[0].length

  return {
    route: capture(section, /^Route: `([^`]+)`$/m, 'route'),
    metadataTitle: capture(
      section,
      /^Metadata title: `([^`]+)`$/m,
      'metadata title',
    ),
    metadataDescription: capture(
      section,
      /^Metadata description: `([^`]+)`$/m,
      'metadata description',
    ),
    title: titleMatch[1],
    body: section.slice(titleEnd).trim(),
  }
}

export function caliBabyPageMetadata(
  locale: Locale,
  kind: CaliBabyPageKind,
): Metadata {
  const content = getCaliBabyPublicContent(locale, kind)
  const unlocalizedPath = kind === 'support' ? '/calibaby/help' : `/calibaby/${kind}`
  return {
    ...caliBabyMetadata(
      locale,
      unlocalizedPath,
      content.metadataTitle,
      content.metadataDescription,
    ),
    // The product has launched, but this source copy remains subject to the
    // publication gates in docs/calibaby-public-copy.md.
    robots: { index: false, follow: true },
  }
}

export function caliBabyLandingMetadata(locale: Locale): Metadata {
  const copy = LANDING_METADATA[locale]
  return caliBabyMetadata(locale, '/calibaby', copy.title, copy.description)
}

export function caliBabyLandingStructuredData(locale: Locale) {
  const copy = LANDING_METADATA[locale]
  const details = CALI_BABY_PRODUCT_DETAILS[locale]
  const canonical = localeRoutePair('/calibaby')[locale]

  return {
    '@context': 'https://schema.org',
    '@type': 'MobileApplication',
    '@id': `${canonical.href}#app`,
    name: locale === 'en' ? 'Cali Baby: Baby Tracker' : 'Cali 宝宝',
    alternateName: locale === 'en' ? 'Cali Baby' : 'Cali Baby: Baby Tracker',
    description: copy.description,
    url: canonical.href,
    sameAs: CALI_BABY_APP_STORE_URL,
    downloadUrl: CALI_BABY_APP_STORE_URL,
    image: new URL('/images/calibaby-app-icon.png', canonical).href,
    applicationCategory: 'HealthApplication',
    applicationSubCategory: 'Health & Fitness',
    operatingSystem: 'iOS 18.0 or later; watchOS 11.0 or later',
    availableOnDevice: ['iPhone', 'Apple Watch'],
    inLanguage: ['en', 'zh-CN'],
    isAccessibleForFree: true,
    featureList: details.features.map(
      (feature) => `${feature.title}: ${feature.description}`,
    ),
    offers: {
      '@type': 'Offer',
      price: 0,
      priceCurrency: 'USD',
      url: CALI_BABY_APP_STORE_URL,
      availability: 'https://schema.org/InStock',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Zolplay',
      url: 'https://zolplay.com',
    },
  }
}

function caliBabyMetadata(
  locale: Locale,
  unlocalizedPath: string,
  title: string,
  description: string,
): Metadata {
  const pair = localeRoutePair(unlocalizedPath)
  const canonical = locale === 'en' ? pair.en : pair.zh
  const image = new URL('/og', canonical)
  image.searchParams.set('locale', locale)
  image.searchParams.set('path', unlocalizedPath)
  const imageAlt =
    locale === 'en'
      ? 'Cali Baby app icon and wordmark'
      : 'Cali 宝宝应用图标与名称'

  return {
    title,
    description,
    itunes: { appId: CALI_BABY_APP_STORE_ID },
    alternates: {
      canonical,
      languages: pair.languages,
    },
    openGraph: {
      title,
      description,
      type: 'website',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      siteName: 'Cali Baby',
      url: canonical,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
          type: 'image/png',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [{ url: image, alt: imageAlt }],
    },
  }
}
