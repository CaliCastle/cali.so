import Image from 'next/image'
import Link from 'next/link'

import { CaliBabyScreenshotCarousel } from '../_components/calibaby-screenshot-carousel'
import { localePath, type Locale } from '~/lib/locale-route'

import styles from './calibaby-landing.module.css'

const APP_STORE_URL = 'https://apps.apple.com/app/id6769728441'

const APP_STORE_BADGES = {
  zh: {
    src: '/images/calibaby/app-store-badge-zh-cn.svg',
    width: 108.85157,
  },
  en: {
    src: '/images/calibaby/app-store-badge-en-us.svg',
    width: 119.66407,
  },
} as const

const LANDING_COPY = {
  zh: {
    productName: 'Cali 宝宝',
    headline: '宝宝的事很多，\n不必都靠脑子记。',
    description:
      '胎动、喂奶、睡眠、尿布，发生了就顺手记一下。家里人都能看到刚刚发生了什么，换谁来照顾，都不用再从头问一遍。',
    appStore: '前往 App Store 下载',
    help: '帮助与支持',
    privacy: '隐私政策',
    terms: '使用条款',
    locale: 'English',
    localeAriaLabel: 'View Cali Baby in English',
    galleryLabel: 'Cali 宝宝应用画面',
  },
  en: {
    productName: 'Cali Baby',
    headline: 'You don’t have to\nremember every feed.',
    description:
      'Log kicks, feeds, sleep, and diapers as they happen. Everyone caring for the baby can see what happened and when, so whoever takes over doesn’t have to start with a round of questions.',
    appStore: 'Download on the App Store',
    help: 'Help and support',
    privacy: 'Privacy Policy',
    terms: 'Terms of Use',
    locale: '中文',
    localeAriaLabel: '切换到 Cali 宝宝中文页面',
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

      <nav aria-label={locale === 'en' ? 'Cali Baby' : 'Cali 宝宝'} className={styles.headerLinks}>
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
  const appStoreBadge = APP_STORE_BADGES[locale]

  return (
    <div className={styles.landingPage}>
      <LandingHeader locale={locale} />

      <main>
        <section className={styles.hero}>
          <Image
            src="/images/calibaby-app-icon.png"
            alt=""
            width={96}
            height={96}
            className={styles.heroAppIcon}
          />
          <h1>
            {copy.headline.split('\n').map((line) => (
              <span key={line}>{line}</span>
            ))}
          </h1>
          <p>{copy.description}</p>
          <div className={styles.heroActions}>
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noreferrer"
              className={styles.appStoreLink}
            >
              <Image
                src={appStoreBadge.src}
                alt={copy.appStore}
                width={appStoreBadge.width}
                height={40}
                unoptimized
                className={styles.appStoreBadge}
              />
            </a>
          </div>
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
        <nav aria-label={locale === 'en' ? 'Cali Baby information' : 'Cali 宝宝信息'} className={styles.footerLinks}>
          <Link href={localePath(locale, '/calibaby/help')}>{copy.help}</Link>
          <Link href={localePath(locale, '/calibaby/privacy')}>{copy.privacy}</Link>
          <Link href={localePath(locale, '/calibaby/terms')}>{copy.terms}</Link>
        </nav>
      </footer>
    </div>
  )
}
