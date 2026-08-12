import type { AnchorHTMLAttributes, HTMLAttributes } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MDXRemote } from 'next-mdx-remote/rsc'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'

import {
  getCaliBabyPublicContent,
  type CaliBabyPageKind,
} from '~/lib/calibaby-public-content'
import { localePath, type Locale } from '~/lib/locale-route'
import { cn } from '~/lib/utils'

import styles from './calibaby-pages.module.css'

const SUPPORT_COPY = {
  zh: {
    pageTitle: '帮助与支持',
    helpTitle: '需要帮助？',
    localeLabel: 'English',
    localeAriaLabel: 'View in English',
    quickLinks: [
      ['家庭同步', '#家庭同步没有更新', 'lavender'],
      ['备份与恢复', '#备份与恢复', 'blue'],
      ['账号与家庭删除', '#删除账号', 'mint'],
      ['联系我们', '#联系我们', 'amber'],
    ],
    contactTitle: '联系我们',
    supportLabel: '使用问题、功能建议或一般反馈',
    legalLabel: '隐私、数据权利或法律相关请求',
    warning:
      '我们可能需要核实你的身份，但不会通过邮件索取密码、家庭密钥或完整的照顾记录。',
    privacy: '隐私政策',
    terms: '使用条款',
    back: '返回帮助与支持',
  },
  en: {
    pageTitle: 'Help and support',
    helpTitle: 'Need help?',
    localeLabel: '中文',
    localeAriaLabel: '切换到中文',
    quickLinks: [
      ['Family Sync', '#family-sync-isnt-updating', 'lavender'],
      ['Backup and restore', '#back-up-or-restore-records', 'blue'],
      ['Account and Family deletion', '#delete-an-account', 'mint'],
      ['Contact us', '#contact-us', 'amber'],
    ],
    contactTitle: 'Contact us',
    supportLabel: 'Help, feature ideas, or general feedback',
    legalLabel: 'Privacy, data-rights, or legal requests',
    warning:
      "We may need to verify your identity, but we'll never ask for your password, Family key, or complete care history by email.",
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    back: 'Back to help and support',
  },
} as const

const QUICK_HELP_PARAGRAPH = {
  zh: '需要帮助？你可以直接查看[家庭同步](#家庭同步没有更新)、[备份与恢复](#备份与恢复)、[账号与家庭删除](#删除账号)，或者[联系我们](#联系我们)。',
  en: "Need help? Jump to [Family Sync](#family-sync-isnt-updating), [backup and restore](#back-up-or-restore-records), [account and Family deletion](#delete-an-account), or [contact us](#contact-us).",
} as const

const SUPPORT_MARKERS = {
  zh: {
    contact: '## 联系我们',
    health: '## 健康与紧急情况',
    legal: '## 法律信息',
  },
  en: {
    contact: '## Contact us',
    health: '## Health and emergencies',
    legal: '## Legal',
  },
} as const

function MarkdownLink({ href = '', className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith('/')) {
    return <Link href={href} className={cn(styles.textLink, className)} {...props} />
  }

  return <a href={href} className={cn(styles.textLink, className)} {...props} />
}

const markdownComponents = {
  h2: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className={styles.sectionTitle} {...props} />
  ),
  h3: (props: HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className={styles.subsectionTitle} {...props} />
  ),
  p: (props: HTMLAttributes<HTMLParagraphElement>) => (
    <p className={styles.paragraph} {...props} />
  ),
  ul: (props: HTMLAttributes<HTMLUListElement>) => (
    <ul className={styles.list} {...props} />
  ),
  ol: (props: HTMLAttributes<HTMLOListElement>) => (
    <ol className={cn(styles.list, styles.orderedList)} {...props} />
  ),
  li: (props: HTMLAttributes<HTMLLIElement>) => (
    <li className={styles.listItem} {...props} />
  ),
  a: MarkdownLink,
  hr: () => null,
}

function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={className}>
      <MDXRemote
        source={source}
        components={markdownComponents}
        options={{
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            rehypePlugins: [rehypeSlug],
          },
        }}
      />
    </div>
  )
}

function ProductHeader({ locale, path }: { locale: Locale; path: string }) {
  const copy = SUPPORT_COPY[locale]
  const productName = locale === 'en' ? 'Cali Baby' : 'Cali 宝宝'

  return (
    <header className={styles.productHeader}>
      <Link href={localePath(locale, '/calibaby')} className={styles.brandLink}>
        <Image
          src="/images/calibaby-app-icon.png"
          alt=""
          width={48}
          height={48}
          priority
          className={styles.appIcon}
        />
        <span>{productName}</span>
      </Link>
      <Link
        href={localePath(locale === 'en' ? 'zh' : 'en', path)}
        hrefLang={locale === 'en' ? 'zh-CN' : 'en'}
        aria-label={copy.localeAriaLabel}
        className={styles.localeLink}
      >
        {copy.localeLabel}
      </Link>
    </header>
  )
}

function Chevron() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={styles.chevron}>
      <path d="m7.5 4.5 5.5 5.5-5.5 5.5" />
    </svg>
  )
}

function QuickHelp({ locale }: { locale: Locale }) {
  const copy = SUPPORT_COPY[locale]

  return (
    <nav aria-labelledby="calibaby-quick-help" className={styles.haloCard}>
      <h2 id="calibaby-quick-help" className={styles.cardTitle}>
        {copy.helpTitle}
      </h2>
      <div className={styles.quickLinks}>
        {copy.quickLinks.map(([label, href, accent]) => (
          <a key={href} href={href} className={styles.quickLink}>
            <span className={cn(styles.accentDot, styles[accent])} aria-hidden="true" />
            <span>{label}</span>
            <Chevron />
          </a>
        ))}
      </div>
    </nav>
  )
}

function ContactCard({ locale }: { locale: Locale }) {
  const copy = SUPPORT_COPY[locale]

  return (
    <section id={locale === 'en' ? 'contact-us' : '联系我们'} className={styles.haloCard}>
      <h2 className={styles.cardTitle}>{copy.contactTitle}</h2>
      <div className={styles.contactLinks}>
        <a
          href="mailto:hi@cali.so?subject=Cali%20Baby%20Support"
          className={styles.contactLink}
        >
          <span>{copy.supportLabel}</span>
          <strong>hi@cali.so</strong>
        </a>
        <a
          href="mailto:contact@zolplay.com?subject=Cali%20Baby%20Privacy%20Request"
          className={styles.contactLink}
        >
          <span>{copy.legalLabel}</span>
          <strong>contact@zolplay.com</strong>
        </a>
      </div>
      <p className={styles.contactNote}>{copy.warning}</p>
    </section>
  )
}

function LegalActions({ locale }: { locale: Locale }) {
  const copy = SUPPORT_COPY[locale]

  return (
    <nav aria-label={locale === 'en' ? 'Legal information' : '法律信息'} className={styles.legalActions}>
      <Link href={localePath(locale, '/calibaby/privacy')} className={styles.ghostAction}>
        {copy.privacy}
      </Link>
      <Link href={localePath(locale, '/calibaby/terms')} className={styles.ghostAction}>
        {copy.terms}
      </Link>
    </nav>
  )
}

function PageFooter({ locale, kind }: { locale: Locale; kind: CaliBabyPageKind }) {
  const copy = SUPPORT_COPY[locale]

  return (
    <footer className={styles.footer}>
      {kind !== 'support' && (
        <Link href={localePath(locale, '/calibaby/help')} className={styles.footerLink}>
          {copy.back}
        </Link>
      )}
      <span>© Cali Baby</span>
    </footer>
  )
}

function supportSources(locale: Locale, body: string) {
  const markers = SUPPORT_MARKERS[locale]
  const withoutQuickHelp = body.replace(QUICK_HELP_PARAGRAPH[locale], '').trim()
  const firstSection = withoutQuickHelp.indexOf('\n## ')
  const contact = withoutQuickHelp.indexOf(markers.contact)
  const health = withoutQuickHelp.indexOf(markers.health)
  const legal = withoutQuickHelp.indexOf(markers.legal)

  if ([firstSection, contact, health, legal].some((index) => index < 0)) {
    throw new Error(`Cali Baby ${locale} support copy has an unexpected structure`)
  }

  return {
    introduction: withoutQuickHelp.slice(0, firstSection).trim(),
    main: withoutQuickHelp.slice(firstSection, contact).trim(),
    health: withoutQuickHelp.slice(health, legal).trim(),
  }
}

function SupportPage({ locale }: { locale: Locale }) {
  const content = getCaliBabyPublicContent(locale, 'support')
  const copy = SUPPORT_COPY[locale]
  const sources = supportSources(locale, content.body)

  return (
    <>
      <ProductHeader locale={locale} path="/calibaby/help" />
      <main>
        <header className={styles.introduction}>
          <h1>{copy.pageTitle}</h1>
          <Markdown source={sources.introduction} className={styles.introductionCopy} />
        </header>
        <QuickHelp locale={locale} />
        <Markdown source={sources.main} className={styles.supportContent} />
        <ContactCard locale={locale} />
        <Markdown source={sources.health} className={styles.healthContent} />
        <LegalActions locale={locale} />
      </main>
      <PageFooter locale={locale} kind="support" />
    </>
  )
}

function LegalPage({
  locale,
  kind,
}: {
  locale: Locale
  kind: Exclude<CaliBabyPageKind, 'support'>
}) {
  const content = getCaliBabyPublicContent(locale, kind)
  const [effective, introduction, ...body] = content.body.split(/\n\n+/)

  return (
    <>
      <ProductHeader locale={locale} path={`/calibaby/${kind}`} />
      <main>
        <header className={cn(styles.haloCard, styles.legalHeader)}>
          <h1>{content.title}</h1>
          <p className={styles.effectiveDate}>{effective}</p>
          <p>{introduction}</p>
        </header>
        <Markdown source={body.join('\n\n')} className={styles.legalContent} />
      </main>
      <PageFooter locale={locale} kind={kind} />
    </>
  )
}

export function CaliBabyPage({
  locale,
  kind,
}: {
  locale: Locale
  kind: CaliBabyPageKind
}) {
  return (
    <div className={styles.page}>
      {kind === 'support' ? (
        <SupportPage locale={locale} />
      ) : (
        <LegalPage locale={locale} kind={kind} />
      )}
    </div>
  )
}
