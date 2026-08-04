import Image from 'next/image'
import Link from 'next/link'

import { CaliBabyScreenshotCarousel } from '../_components/calibaby-screenshot-carousel'
import { localePath, type Locale } from '~/lib/locale-route'

import styles from './calibaby-landing.module.css'

const LANDING_COPY = {
  zh: {
    productName: 'Cali 宝宝助手',
    headline: '从孕期到育儿，\n一起照顾每一天。',
    description:
      '安静、快速地记录每一次喂养、睡眠、尿布与成长，让家人始终在同一页。',
    help: '帮助与支持',
    privacy: '隐私政策',
    terms: '使用条款',
    locale: 'English',
    localeAriaLabel: 'View Cali Baby in English',
    galleryLabel: 'Cali 宝宝助手应用画面',
  },
  en: {
    productName: 'Cali Baby',
    headline: 'Care together,\nfrom pregnancy onward.',
    description:
      'Quiet, fast tracking for feeding, sleep, diapers, and growth, with everyone in the Family on the same page.',
    help: 'Help and support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    locale: '中文',
    localeAriaLabel: '切换到 Cali 宝宝助手中文页面',
    galleryLabel: 'Cali Baby app screenshots',
  },
} as const

function LandingHeader({ locale }: { locale: Locale }) {
  const copy = LANDING_COPY[locale]
  const otherLocale = locale === 'en' ? 'zh' : 'en'

  return (
    <header className={styles.header}>
      <Link href={localePath(locale, '/calibaby')} className={styles.brandLink}>
        <Image
          src="/images/calibaby-app-icon.png"
          alt=""
          width={48}
          height={48}
          preload
          className={styles.appIcon}
        />
        <span>{copy.productName}</span>
      </Link>

      <nav aria-label={locale === 'en' ? 'Cali Baby' : 'Cali 宝宝助手'} className={styles.headerLinks}>
        <Link href={localePath(locale, '/calibaby/help')} className={styles.headerLink}>
          {copy.help}
        </Link>
        <Link
          href={localePath(otherLocale, '/calibaby')}
          hrefLang={otherLocale === 'en' ? 'en' : 'zh-CN'}
          aria-label={copy.localeAriaLabel}
          className={styles.headerLink}
        >
          {copy.locale}
        </Link>
      </nav>
    </header>
  )
}

export function CaliBabyLandingPage({ locale }: { locale: Locale }) {
  const copy = LANDING_COPY[locale]

  return (
    <div className={styles.landingPage}>
      <LandingHeader locale={locale} />

      <main>
        <section className={styles.hero}>
          <h1>
            {copy.headline.split('\n').map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p>{copy.description}</p>
        </section>

        <section className={styles.gallery} aria-labelledby="calibaby-gallery-title">
          <h2 id="calibaby-gallery-title" className={styles.srOnly}>
            {copy.galleryLabel}
          </h2>
          <CaliBabyScreenshotCarousel locale={locale} />
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© Cali Baby</span>
        <nav aria-label={locale === 'en' ? 'Cali Baby information' : 'Cali 宝宝助手信息'} className={styles.footerLinks}>
          <Link href={localePath(locale, '/calibaby/help')}>{copy.help}</Link>
          <Link href={localePath(locale, '/calibaby/privacy')}>{copy.privacy}</Link>
          <Link href={localePath(locale, '/calibaby/terms')}>{copy.terms}</Link>
        </nav>
      </footer>
    </div>
  )
}
