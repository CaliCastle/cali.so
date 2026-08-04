import { ImageResponse } from 'next/og'

import type { Post } from './content'
import { formatDate, formatDateEn } from './date'
import type { Locale } from './locale-route'
import type { ArchivedNewsletter } from './newsletters'
import {
  coverDataUri,
  ogColors,
  ogRuntimeFonts,
  OgPolaroid,
  OgSheet,
  publicImageDataUri,
} from './og'
import { tiltFromSlug } from './polaroid'
import {
  publicPageMetadata,
  type PublicSection,
} from './public-page-metadata'

const NAME = 'Cali Castle'
const HOME_INTRODUCTIONS: Record<Locale, string> = {
  zh: publicPageMetadata.home.zh.ogDescription,
  en: publicPageMetadata.home.en.ogDescription,
}

const IMAGE_SIZE = { width: 1200, height: 630 } as const
const CALIBABY_APP_STORE_BADGES = {
  zh: {
    src: '/images/calibaby/app-store-badge-zh-cn.svg',
    width: 196,
  },
  en: {
    src: '/images/calibaby/app-store-badge-en-us.svg',
    width: 215,
  },
} as const
const CALIBABY_PRODUCT_NAMES: Record<Locale, string> = {
  zh: 'Cali 宝宝助手',
  en: 'Cali Baby',
}

async function renderHomeOgImage(locale: Locale) {
  const introduction = HOME_INTRODUCTIONS[locale]
  const portrait = await publicImageDataUri('/images/headshot.jpg')

  return new ImageResponse(
    (
      <OgSheet>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 72,
            padding: '0 112px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
              width: 680,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 68,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: ogColors.foreground,
              }}
            >
              {NAME}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 32,
                lineHeight: 1.5,
                color: ogColors.mutedForeground,
              }}
            >
              {introduction}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexShrink: 0,
              padding: 8,
              paddingBottom: 24,
              backgroundColor: ogColors.paper,
              boxShadow: '0 0 0 1px rgb(0 0 0 / 0.04), 0 8px 30px rgb(0 0 0 / 0.12)',
              transform: 'rotate(2deg)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={portrait}
              alt=""
              width={216}
              height={198}
              style={{ objectFit: 'cover', width: 216, height: 198 }}
            />
          </div>
        </div>
      </OgSheet>
    ),
    { ...IMAGE_SIZE, fonts: await ogRuntimeFonts() },
  )
}

export async function createHomeOgImage(locale: Locale) {
  return renderHomeOgImage(locale)
}

async function renderCaliBabyOgImage(locale: Locale) {
  const appStoreBadge = CALIBABY_APP_STORE_BADGES[locale]
  const [icon, badge] = await Promise.all([
    publicImageDataUri('/images/calibaby-app-icon.png'),
    publicImageDataUri(appStoreBadge.src),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f3f4f5',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 64,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={icon}
            alt=""
            width={240}
            height={240}
            style={{
              width: 240,
              height: 240,
              borderRadius: 56,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              style={{
                display: 'flex',
                color: '#242529',
                fontSize: 76,
                fontWeight: 600,
                letterSpacing: '-0.035em',
              }}
            >
              {CALIBABY_PRODUCT_NAMES[locale]}
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={badge}
              alt=""
              width={appStoreBadge.width}
              height={72}
              style={{
                display: 'block',
                width: appStoreBadge.width,
                height: 72,
                marginTop: 30,
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...IMAGE_SIZE,
      fonts: await ogRuntimeFonts(),
    },
  )
}

export async function createCaliBabyOgImage(locale: Locale) {
  return renderCaliBabyOgImage(locale)
}

function OgSectionMark({ section }: { section: PublicSection }) {
  const stroke = ogColors.paperInk
  const faint = ogColors.border

  if (section === 'blog') {
    return (
      <svg
        width="232"
        height="232"
        viewBox="0 0 232 232"
        fill="none"
        aria-hidden="true"
      >
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M61 36C91 31 137 30 177 33C179 78 181 146 177 194C140 198 92 199 53 196C55 148 53 80 61 36Z"
            stroke={faint}
            strokeWidth="1.4"
          />
          <path
            d="M48 44C84 38 132 38 166 42C169 91 169 151 164 202C126 203 82 205 43 199C47 149 43 92 48 44Z"
            stroke={faint}
            strokeWidth="1.4"
          />
          <path
            d="M55 33C89 29 136 30 178 35C181 82 180 148 176 197C137 201 93 200 51 196C54 147 50 82 55 33Z"
            stroke={stroke}
            strokeWidth="1.7"
          />
          <path
            d="M77 71C100 69 128 70 152 71M76 93C101 91 128 93 151 92M77 115C97 113 119 115 138 114M77 157C91 155 106 157 119 156"
            stroke={stroke}
            strokeWidth="1.7"
          />
        </g>
      </svg>
    )
  }

  if (section === 'ama') {
    // Two sketched speech bubbles trading a conversation, with an hour tick.
    return (
      <svg
        width="232"
        height="232"
        viewBox="0 0 232 232"
        fill="none"
        aria-hidden="true"
      >
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M40 52C74 45 116 46 148 52C152 74 152 96 148 116C122 121 92 122 68 118C62 126 54 133 44 138C47 129 48 121 47 113C42 95 38 72 40 52Z"
            stroke={faint}
            strokeWidth="1.4"
          />
          <path
            d="M46 46C80 41 118 41 152 47C156 70 155 94 151 114C124 119 94 120 70 116C64 125 55 132 45 136C48 128 50 119 48 111C43 92 42 67 46 46Z"
            stroke={stroke}
            strokeWidth="1.7"
          />
          <path
            d="M96 132C124 127 156 128 186 134C189 152 189 170 186 186C179 184 172 184 165 186C167 179 167 172 165 166C142 170 116 170 96 166C93 155 93 143 96 132Z"
            stroke={faint}
            strokeWidth="1.4"
          />
          <path
            d="M92 136C122 131 154 132 184 138C187 155 186 172 183 188C176 186 169 186 162 188C164 181 164 174 162 168C139 172 113 171 93 167C90 157 90 146 92 136Z"
            stroke={stroke}
            strokeWidth="1.65"
          />
          <path
            d="M70 80C86 78 104 78 122 80M70 96C82 94 96 94 108 95"
            stroke={stroke}
            strokeWidth="1.7"
          />
          <path
            d="M138 62C144 61 149 65 149 71C149 77 144 81 138 81C132 81 128 76 128 71C128 66 132 62 138 62ZM138 66L138 71L142 74"
            stroke={stroke}
            strokeWidth="1.55"
          />
        </g>
      </svg>
    )
  }

  if (section === 'photos') {
    return (
      <svg
        width="232"
        height="232"
        viewBox="0 0 232 232"
        fill="none"
        aria-hidden="true"
      >
        <g strokeLinecap="round" strokeLinejoin="round">
          <path
            d="M47 42C88 35 139 38 187 47C181 98 177 152 168 198C125 196 83 188 38 178C42 131 45 86 47 42Z"
            stroke={faint}
            strokeWidth="1.4"
          />
          <path
            d="M58 31C101 34 145 39 187 47C183 96 177 149 171 197C128 196 81 189 39 181C44 131 51 78 58 31Z"
            stroke={stroke}
            strokeWidth="1.7"
          />
          <path
            d="M67 43C101 44 143 49 175 55C172 84 168 116 164 147C129 144 94 139 55 132C59 101 63 71 67 43Z"
            stroke={stroke}
            strokeWidth="1.55"
          />
          <path
            d="M59 132C78 115 87 106 102 96C114 112 124 123 135 134C144 124 151 116 160 108C165 120 168 133 171 147"
            stroke={stroke}
            strokeWidth="1.65"
          />
          <path
            d="M145 69C150 66 157 67 160 72C163 78 160 84 154 86C148 87 142 83 142 77C142 74 143 71 145 69Z"
            stroke={faint}
            strokeWidth="1.55"
          />
        </g>
      </svg>
    )
  }

  return (
    <svg
      width="232"
      height="232"
      viewBox="0 0 232 232"
      fill="none"
      aria-hidden="true"
    >
      <g strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M116 38C159 37 194 72 193 116C192 160 159 193 115 194C72 193 38 158 39 115C40 72 73 39 116 38Z"
          stroke={faint}
          strokeWidth="1.4"
          strokeDasharray="5 7"
        />
        <path
          d="M116 20C115 69 117 162 116 212M20 116C70 115 164 117 212 116M49 48C82 83 151 151 184 184M184 48C151 80 82 151 48 184"
          stroke={faint}
          strokeWidth="1.35"
        />
        <path
          d="M116 66C145 65 167 88 167 116C166 145 145 167 116 167C88 166 65 144 66 116C66 88 88 67 116 66Z"
          stroke={stroke}
          strokeWidth="1.7"
        />
        <path
          d="M89 140C94 126 98 112 103 99C115 95 128 91 141 87C136 101 132 114 127 127C114 131 102 136 89 140Z"
          stroke={stroke}
          strokeWidth="1.75"
        />
        <path
          d="M111 113C112 109 118 107 121 110C124 114 122 119 118 121C113 122 109 118 111 113Z"
          stroke={stroke}
          strokeWidth="1.55"
        />
      </g>
    </svg>
  )
}

async function renderSectionOgImage(section: PublicSection, locale: Locale) {
  const copy = publicPageMetadata[section][locale]
  const signature = 'Cali Castle'

  return new ImageResponse(
    (
      <OgSheet>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 64,
            padding: '0 104px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 720,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 22,
                color: ogColors.paperInk,
              }}
            >
              {signature}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 28,
                fontSize: 70,
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: ogColors.foreground,
              }}
            >
              {copy.title}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                fontSize: 29,
                lineHeight: 1.48,
                color: ogColors.mutedForeground,
              }}
            >
              {copy.description}
            </div>
          </div>
          <div style={{ display: 'flex', flexShrink: 0 }}>
            <OgSectionMark section={section} />
          </div>
        </div>
      </OgSheet>
    ),
    {
      ...IMAGE_SIZE,
      fonts: await ogRuntimeFonts(),
    },
  )
}

export async function createSectionOgImage(section: PublicSection, locale: Locale) {
  return renderSectionOgImage(section, locale)
}

type NewsletterOgInput = Pick<
  ArchivedNewsletter,
  'id' | 'title' | 'titleEn' | 'description' | 'descriptionEn'
>

async function renderNewsletterOgImage(newsletter: NewsletterOgInput, locale: Locale) {
  const title = locale === 'en' ? newsletter.titleEn : newsletter.title
  const description =
    locale === 'en' ? newsletter.descriptionEn : newsletter.description
  const archiveLabel =
    locale === 'en'
      ? `Cali Castle · Archive ${newsletter.id.padStart(3, '0')}`
      : `Cali Castle · 存档 ${newsletter.id.padStart(3, '0')}`
  const cover = await coverDataUri(
    `/content/newsletters/${newsletter.id}/cover.png`,
  )

  return new ImageResponse(
    (
      <OgSheet>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 64,
            padding: '0 96px',
            width: '100%',
          }}
        >
          <OgPolaroid src={cover} tilt={-2} width={432} />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              width: 512,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 21,
                color: ogColors.paperInk,
              }}
            >
              {archiveLabel}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                fontSize: 48,
                fontWeight: 600,
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                color: ogColors.foreground,
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                fontSize: 24,
                lineHeight: 1.5,
                color: ogColors.mutedForeground,
              }}
            >
              {description}
            </div>
          </div>
        </div>
      </OgSheet>
    ),
    {
      ...IMAGE_SIZE,
      fonts: await ogRuntimeFonts(),
    },
  )
}

export async function createNewsletterOgImage(
  newsletter: ArchivedNewsletter,
  locale: Locale,
) {
  const input: NewsletterOgInput = {
    id: newsletter.id,
    title: newsletter.title,
    titleEn: newsletter.titleEn,
    description: newsletter.description,
    descriptionEn: newsletter.descriptionEn,
  }

  return renderNewsletterOgImage(input, locale)
}

type PostOgInput = Pick<Post, 'slug' | 'title' | 'titleEn' | 'publishedAt' | 'cover'>

async function renderPostOgImage(post: PostOgInput, locale: Locale) {
  const title = locale === 'en' ? post.titleEn : post.title
  const date = locale === 'en' ? formatDateEn(post.publishedAt) : formatDate(post.publishedAt)

  return new ImageResponse(
    (
      <OgSheet>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 64,
            padding: '0 96px',
            width: '100%',
          }}
        >
          {post.cover && (
            <OgPolaroid
              src={await coverDataUri(post.cover.src)}
              tilt={tiltFromSlug(post.slug)}
              width={432}
            />
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flexGrow: 0,
              flexShrink: 0,
              gap: 28,
              width: 512,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontSize: 54,
                fontWeight: 600,
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
                color: ogColors.foreground,
                textWrap: 'balance',
              }}
            >
              {title}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                flexShrink: 0,
                fontSize: 24,
                gap: 8,
                color: ogColors.mutedForeground,
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', flexShrink: 0 }}>{NAME}</div>
              <div style={{ display: 'flex', flexShrink: 0 }}>·</div>
              <div style={{ display: 'flex', flexShrink: 0 }}>{date}</div>
            </div>
          </div>
        </div>
      </OgSheet>
    ),
    {
      ...IMAGE_SIZE,
      fonts: await ogRuntimeFonts(),
    },
  )
}

export async function createPostOgImage(post: Post, locale: Locale) {
  const input: PostOgInput = {
    slug: post.slug,
    title: post.title,
    titleEn: post.titleEn,
    publishedAt: post.publishedAt,
    cover: post.cover,
  }

  return renderPostOgImage(input, locale)
}
