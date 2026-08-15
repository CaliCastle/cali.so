import { cacheLife } from 'next/cache'

import {
  CALI_BABY_APP_STORE_URL,
  CALI_BABY_PRODUCT_DETAILS,
  getCaliBabyPublicContent,
  type CaliBabyPageKind,
} from '~/lib/calibaby-public-content'
import { getAllPosts } from '~/lib/content'
import {
  archivedNewsletterIds,
  getArchivedNewsletter,
} from '~/lib/newsletters'
import { projects } from '~/lib/projects'
import { publicPageMetadata } from '~/lib/public-page-metadata'
import { seo } from '~/lib/seo'

function absoluteUrl(path: string) {
  return new URL(path, seo.url).href
}

function oneLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function markdownLink(label: string, url: string, note: string) {
  const safeLabel = oneLine(label).replaceAll('[', '\\[').replaceAll(']', '\\]')
  return `- [${safeLabel}](${url}): ${oneLine(note)}`
}

export function buildLlmsText() {
  const posts = getAllPosts()
  const caliBabyPages = (
    [
      ['support', '/calibaby/help'],
      ['privacy', '/calibaby/privacy'],
      ['terms', '/calibaby/terms'],
    ] as const satisfies ReadonlyArray<readonly [CaliBabyPageKind, string]>
  ).flatMap(([kind, path]) => {
    const zh = getCaliBabyPublicContent('zh', kind)
    const en = getCaliBabyPublicContent('en', kind)
    return [
      markdownLink(zh.metadataTitle, absoluteUrl(path), zh.metadataDescription),
      markdownLink(
        en.metadataTitle,
        absoluteUrl(`/en${path}`),
        en.metadataDescription,
      ),
    ]
  })
  const sections = ['blog', 'photos', 'projects', 'ama'] as const

  return [
    '# Cali Castle and Cali Baby',
    '',
    '> The bilingual public site of design engineer Cali Castle and the official product, support, and legal information for Cali Baby, a baby tracker by Zolplay.',
    '',
    'Chinese pages use unprefixed URLs. English versions use `/en`. Prefer the page matching the user’s language, and use each page’s canonical URL when citing it.',
    '',
    'Cali Baby is a Health & Fitness app for parents, guardians, and caregivers. Version 1.0.0 launched on the App Store on August 15, 2026. The app is free to download with optional Cali Baby Pro purchases.',
    '',
    `It supports iPhone and Apple Watch, requires iOS 18 or later, and is available in English and Simplified Chinese. ${CALI_BABY_PRODUCT_DETAILS.en.introduction}`,
    '',
    'Cali Baby records and organizes everyday observations. It does not provide diagnosis, treatment, emergency services, or a substitute for professional medical care.',
    '',
    '## Cali Baby',
    '',
    markdownLink(
      'Cali Baby: Baby Tracker',
      absoluteUrl('/en/calibaby'),
      'Official English product page with features, screenshots, platform requirements, and the App Store download.',
    ),
    markdownLink(
      'Cali 宝宝',
      absoluteUrl('/calibaby'),
      '官方中文产品页，包含功能、应用画面、系统要求与 App Store 下载入口。',
    ),
    markdownLink(
      'Cali Baby on the App Store',
      CALI_BABY_APP_STORE_URL,
      'Official Apple listing for the current app version, compatibility, pricing, and App Privacy details.',
    ),
    ...caliBabyPages,
    '',
    '## Cali Castle',
    '',
    markdownLink(
      publicPageMetadata.home.en.title,
      absoluteUrl('/en'),
      publicPageMetadata.home.en.description,
    ),
    markdownLink(
      publicPageMetadata.home.zh.title,
      absoluteUrl('/'),
      publicPageMetadata.home.zh.description,
    ),
    ...sections.flatMap((section) => [
      markdownLink(
        publicPageMetadata[section].en.title,
        absoluteUrl(`/en/${section}`),
        publicPageMetadata[section].en.description,
      ),
      markdownLink(
        publicPageMetadata[section].zh.title,
        absoluteUrl(`/${section}`),
        publicPageMetadata[section].zh.description,
      ),
    ]),
    '',
    '## Writing',
    '',
    ...posts.flatMap((post) => [
      markdownLink(
        post.titleEn,
        absoluteUrl(`/en/blog/${post.slug}`),
        post.descriptionEn,
      ),
      markdownLink(
        post.title,
        absoluteUrl(`/blog/${post.slug}`),
        post.description ?? `Cali 的文章：${post.title}`,
      ),
    ]),
    '',
    '## Newsletter archive',
    '',
    ...archivedNewsletterIds.flatMap((id) => {
      const newsletter = getArchivedNewsletter(id)
      return [
        markdownLink(
          newsletter.titleEn,
          absoluteUrl(`/en/newsletters/${id}`),
          newsletter.descriptionEn,
        ),
        markdownLink(
          newsletter.title,
          absoluteUrl(`/newsletters/${id}`),
          newsletter.description,
        ),
      ]
    }),
    '',
    '## Projects',
    '',
    ...projects.map((project) =>
      markdownLink(
        project.nameEn,
        project.url,
        project.descriptionEn ?? project.description,
      ),
    ),
    '',
    '## Optional',
    '',
    markdownLink(
      'Chinese RSS feed',
      absoluteUrl('/feed.xml'),
      'Latest Chinese writing in RSS format.',
    ),
    markdownLink(
      'English RSS feed',
      absoluteUrl('/feed.en.xml'),
      'Latest English writing in RSS format.',
    ),
    markdownLink(
      'Sitemap',
      absoluteUrl('/sitemap.xml'),
      'Complete index of canonical public URLs and language alternates.',
    ),
    '',
  ].join('\n')
}

async function getLlmsText() {
  'use cache'
  cacheLife('max')

  return buildLlmsText()
}

export async function GET() {
  return new Response(await getLlmsText(), {
    headers: { 'content-type': 'text/markdown; charset=utf-8' },
  })
}
