import 'server-only'

import type { Metadata } from 'next'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { localeRoutePair } from './locale-metadata'
import type { Locale } from './locale-route'

export type CaliBabyPageKind = 'support' | 'privacy' | 'terms'

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
  const unlocalizedPath = kind === 'support' ? '/calibaby' : `/calibaby/${kind}`
  const pair = localeRoutePair(unlocalizedPath)
  const canonical = locale === 'en' ? pair.en : pair.zh
  const image = new URL('/og', canonical)
  image.searchParams.set('locale', locale)
  image.searchParams.set('path', unlocalizedPath)
  const imageAlt =
    locale === 'en'
      ? 'Cali Baby app icon and wordmark'
      : 'Cali 宝宝助手应用图标与名称'

  return {
    title: content.metadataTitle,
    description: content.metadataDescription,
    alternates: {
      canonical,
      languages: pair.languages,
    },
    // The approved publication checklist still contains unresolved gates and
    // effective-date placeholders. Keep previews reachable but out of search
    // results until that checklist is explicitly cleared.
    robots: { index: false, follow: true },
    openGraph: {
      title: content.metadataTitle,
      description: content.metadataDescription,
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
      title: content.metadataTitle,
      description: content.metadataDescription,
      images: [{ url: image, alt: imageAlt }],
    },
  }
}
