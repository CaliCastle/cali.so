'use client'

import Image from 'next/image'

import { ExternalLabel } from '~/components/external-mark'
import { SitePreviewCard } from '~/components/preview-card-timing'
import { T } from '~/lib/i18n'

export interface SocialSnapshot {
  name: string
  handle: string
  bio: string
  bioEn: string
  followers?: string
  following?: string
}

export interface GitHubSnapshot {
  user: string
  followers?: number
  total: number
  to: string
  levels: string
}

// heatmap shows the recent ~180 days (26 weeks); the stat below still
// counts the full past year
const WEEKS = 26
const DAYS = 7

export const GLYPHS: Record<string, { path: string; color?: string }> = {
  x: {
    path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  },
  telegram: {
    path: 'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z',
    color: '#2AABEE',
  },
  youtube: {
    path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    color: '#FF0000',
  },
  github: {
    path: 'M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12',
  },
}

function Glyph({ service }: { service: keyof typeof GLYPHS }) {
  const { path, color } = GLYPHS[service]
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      aria-hidden
      className="service-card-glyph"
      style={color ? { color } : undefined}
    >
      <path fill="currentColor" d={path} />
    </svg>
  )
}

function Card({
  trigger,
  href,
  children,
  className,
  triggerClassName = 'footer-tree-link',
}: {
  trigger: React.ReactNode
  href: string
  children: React.ReactNode
  className: string
  triggerClassName?: string
}) {
  return (
    <SitePreviewCard
      href={href}
      target="_blank"
      rel="noreferrer"
      triggerClassName={triggerClassName}
      closeDelay={120}
      popupClassName={className}
      popup={children}
      side="top"
    >
      <ExternalLabel>{trigger}</ExternalLabel>
    </SitePreviewCard>
  )
}

function Identity({
  data,
  avatar,
  service,
  withBio = true,
}: {
  data: SocialSnapshot
  avatar: string
  service: keyof typeof GLYPHS
  withBio?: boolean
}) {
  return (
    <>
      <span className="service-card-head">
        <Image
          src={avatar}
          alt=""
          width={40}
          height={40}
          className="service-card-avatar"
        />
        <span className="service-card-names">
          <span className="service-card-name">{data.name}</span>
          <span className="service-card-sub">@{data.handle}</span>
        </span>
        <Glyph service={service} />
      </span>
      {withBio && (
        <span className="service-card-bio">
          <T zh={data.bio} en={data.bioEn} />
        </span>
      )}
    </>
  )
}

// Per-service hover cards for the chrome's social links. Server rendering
// supplies ISR-backed values with content/social.json and content/github.json
// as fallbacks; an open card never touches the network. Touch devices just
// follow the link. Bodies are exported separately so other triggers can serve
// the same cards.
export function XCardBody({ data }: { data: SocialSnapshot }) {
  return (
    <>
      <Identity
        data={data}
        avatar="/images/headshot.jpg"
        service="x"
      />
      {(data.followers || data.following) && (
        <span className="service-card-stat">
          {data.following && (
            <span>
              <b>{data.following}</b> <T zh="正在关注" en="following" />
            </span>
          )}
          {data.followers && data.following && <span aria-hidden>·</span>}
          {data.followers && (
            <span>
              <b>{data.followers}</b> <T zh="关注者" en="followers" />
            </span>
          )}
        </span>
      )}
    </>
  )
}

export function XiaohongshuCardBody() {
  return (
    <span className="xiaohongshu-card-content" data-profile-id="5cbba503000000001101b6a2">
      <span className="service-card-head">
        <Image
          src="/images/headshot.jpg"
          alt=""
          width={40}
          height={40}
          className="service-card-avatar"
        />
        <span className="service-card-names">
          <span className="service-card-name">Cali Castle</span>
          <span className="service-card-sub">小红书号 calicastle</span>
        </span>
        <span className="service-card-glyph xiaohongshu-card-wordmark" aria-hidden>
          <Image
            src="/images/xiaohongshu-wordmark.svg"
            alt=""
            width={48}
            height={23}
          />
        </span>
      </span>
      <span className="service-card-bio xiaohongshu-card-bio">
        <span>设计工程师，Cali 宝宝 app 开发者设计师</span>
        <span>@佐玩 Zolplay 创始人 CEO</span>
      </span>
      <span className="service-card-stat">
        <span>
          <b>10+</b> 粉丝
        </span>
        <span aria-hidden>·</span>
        <span>
          <b>1千+</b> 获赞与收藏
        </span>
      </span>
    </span>
  )
}

export function TelegramCardBody({ data }: { data: SocialSnapshot }) {
  return <Identity data={data} avatar="/images/avatar.png" service="telegram" withBio={false} />
}

export function YouTubeCardBody({ data }: { data: SocialSnapshot }) {
  return (
    <>
      <Identity
        data={data}
        avatar="/images/headshot.jpg"
        service="youtube"
        withBio={false}
      />
      {data.followers && (
        <span className="service-card-stat">
          <b>{data.followers}</b> <T zh="订阅者" en="subscribers" />
        </span>
      )}
    </>
  )
}

export function GitHubCardBody({ data }: { data: GitHubSnapshot }) {
  const levels = data.levels.slice(-WEEKS * DAYS)
  return (
    <>
      <span className="contrib-grid" aria-hidden>
        {Array.from({ length: WEEKS }, (_, w) => (
          <span key={w} className="contrib-col">
            {Array.from({ length: DAYS }, (_, d) => {
              const i = w * DAYS + d
              return (
                <i
                  key={d}
                  data-level={levels[i] ?? '0'}
                  style={{ '--ci': i } as React.CSSProperties}
                />
              )
            })}
          </span>
        ))}
      </span>
      <span className="service-card-stat">
        <span>
          <b>{data.total.toLocaleString()}</b> <T zh="次贡献" en="contributions" />
        </span>
        {data.followers != null && (
          <>
            <span aria-hidden>·</span>
            <span>
              <b>{data.followers}</b> <T zh="关注者" en="followers" />
            </span>
          </>
        )}
        <Glyph service="github" />
      </span>
    </>
  )
}

export function XCard({
  data,
  trigger = 'X/Twitter',
  triggerClassName,
}: {
  data: SocialSnapshot
  trigger?: React.ReactNode
  triggerClassName?: string
}) {
  return (
    <Card
      trigger={trigger}
      href={`https://x.com/${data.handle}`}
      className="link-card service-card"
      triggerClassName={triggerClassName}
    >
      <XCardBody data={data} />
    </Card>
  )
}

export function TelegramCard({ data }: { data: SocialSnapshot }) {
  return (
    <Card trigger="Telegram" href={`https://t.me/${data.handle}`} className="link-card service-card">
      <TelegramCardBody data={data} />
    </Card>
  )
}

export function YouTubeCard({ data }: { data: SocialSnapshot }) {
  return (
    <Card trigger="YouTube" href={`https://youtube.com/@${data.handle}`} className="link-card service-card">
      <YouTubeCardBody data={data} />
    </Card>
  )
}

export function GitHubCard({
  data,
  trigger = 'GitHub',
  triggerClassName,
}: {
  data: GitHubSnapshot
  trigger?: React.ReactNode
  triggerClassName?: string
}) {
  return (
    <Card
      trigger={trigger}
      href={`https://github.com/${data.user}`}
      className="link-card service-card"
      triggerClassName={triggerClassName}
    >
      <GitHubCardBody data={data} />
    </Card>
  )
}

export function XiaohongshuCard({
  trigger = '小红书',
  triggerClassName,
}: {
  trigger?: React.ReactNode
  triggerClassName?: string
}) {
  return (
    <Card
      trigger={trigger}
      href="https://xhslink.com/m/7vluP5ANiNE"
      className="link-card service-card xiaohongshu-card"
      triggerClassName={triggerClassName}
    >
      <XiaohongshuCardBody />
    </Card>
  )
}

// Email's card is the front of a mailed envelope: stamps, cancellation
// marks, sender, recipient, and folded seams. Purely visual; the trigger
// itself opens mailto:.
export function EmailCard({
  address,
  trigger = 'Email',
  triggerClassName = 'footer-tree-link',
}: {
  address: string
  trigger?: React.ReactNode
  triggerClassName?: string
}) {
  return (
    <SitePreviewCard
      href={`mailto:${address}`}
      triggerClassName={triggerClassName}
      closeDelay={120}
      popupClassName="link-card email-envelope-card"
      side="top"
      popup={
        <span className="email-envelope" aria-hidden>
          <span className="email-envelope-flap" />
          <span className="email-envelope-return">
            <span>FROM</span>
            CALI CASTLE
            <br />
            TAIPEI
          </span>
          <span className="email-envelope-stamps">
            <span className="email-envelope-stamp email-envelope-stamp-portrait">
              <Image src="/images/avatar.png" alt="" width={32} height={32} />
              <span>CALI · 20</span>
            </span>
            <span className="email-envelope-stamp email-envelope-stamp-mark">
              <span className="email-envelope-stamp-star">✦</span>
              <span>POST · 26</span>
            </span>
          </span>
          <span className="email-envelope-postmark" />
          <span className="email-envelope-address">
            <span><T zh="收" en="TO" /></span>
            {address}
          </span>
        </span>
      }
    >
      {trigger}
    </SitePreviewCard>
  )
}
