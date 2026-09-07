'use client'

import {
  BlossomCarousel,
  BlossomDot,
  BlossomDots,
  BlossomNext,
  BlossomPrev,
} from '@blossom-carousel/react'
import Image from 'next/image'

import type { Locale } from '~/lib/locale-route'

import styles from '../_views/calibaby-landing.module.css'

const CAROUSEL_ID = 'calibaby-screenshots'

const SCREENSHOTS = [
  {
    src: {
      zh: '/images/calibaby/screenshots/01-today.webp',
      en: '/images/calibaby/screenshots/en/01-today.webp',
    },
    alt: {
      zh: 'Cali 宝宝今日概览与日常照顾记录',
      en: 'Cali Baby Today overview and daily care records',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/02-sounds.webp',
      en: '/images/calibaby/screenshots/en/02-sounds.webp',
    },
    alt: {
      zh: 'Cali 宝宝助眠声音',
      en: 'Cali Baby sleep sounds',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/03-sleep-live.webp',
      en: '/images/calibaby/screenshots/en/03-sleep-live.webp',
    },
    alt: {
      zh: 'Cali 宝宝实时睡眠记录',
      en: 'Cali Baby live sleep tracking',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/04-feeding-live.webp',
      en: '/images/calibaby/screenshots/en/04-feeding-live.webp',
    },
    alt: {
      zh: 'Cali 宝宝实时喂养记录',
      en: 'Cali Baby live feeding tracking',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/05-ipad.webp',
      en: '/images/calibaby/screenshots/en/05-ipad.webp',
    },
    alt: {
      zh: 'Cali 宝宝 iPad 应用界面',
      en: 'Cali Baby on iPad',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/06-watch.webp',
      en: '/images/calibaby/screenshots/en/06-watch.webp',
    },
    alt: {
      zh: 'Cali 宝宝 Apple Watch 应用界面',
      en: 'Cali Baby on Apple Watch',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/07-family.webp',
      en: '/images/calibaby/screenshots/en/07-family.webp',
    },
    alt: {
      zh: 'Cali 宝宝家庭共享与同步',
      en: 'Cali Baby family sharing and sync',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/08-history.webp',
      en: '/images/calibaby/screenshots/en/08-history.webp',
    },
    alt: {
      zh: 'Cali 宝宝照顾记录与历史时间线',
      en: 'Cali Baby care history and timeline',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/09-widgets.webp',
      en: '/images/calibaby/screenshots/en/09-widgets.webp',
    },
    alt: {
      zh: 'Cali 宝宝小组件',
      en: 'Cali Baby widgets',
    },
  },
] as const

const CONTROL_COPY = {
  zh: {
    label: 'Cali 宝宝应用画面',
    previous: '上一张应用画面',
    next: '下一张应用画面',
    dots: '选择应用画面',
  },
  en: {
    label: 'Cali Baby app screenshots',
    previous: 'Previous app screenshot',
    next: 'Next app screenshot',
    dots: 'Choose an app screenshot',
  },
} as const

function Arrow({ direction }: { direction: 'previous' | 'next' }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className={styles.arrowIcon}>
      <path d={direction === 'previous' ? 'm12.5 4.5-5.5 5.5 5.5 5.5' : 'm7.5 4.5 5.5 5.5-5.5 5.5'} />
    </svg>
  )
}

export function CaliBabyScreenshotCarousel({ locale }: { locale: Locale }) {
  const copy = CONTROL_COPY[locale]

  return (
    <div className={styles.carouselFrame}>
      <BlossomCarousel
        id={CAROUSEL_ID}
        as="ul"
        load="conditional"
        aria-label={copy.label}
        aria-roledescription="carousel"
        className={styles.carousel}
      >
        {SCREENSHOTS.map((screenshot, index) => (
          <li
            key={screenshot.src.zh}
            data-blossom-slide
            className={styles.slide}
            aria-label={`${index + 1} / ${SCREENSHOTS.length}`}
          >
            <Image
              src={screenshot.src[locale]}
              alt={screenshot.alt[locale]}
              width={1320}
              height={2868}
              sizes="(max-width: 40rem) 78vw, (max-width: 70rem) 42vw, 22rem"
              className={styles.screenshot}
            />
          </li>
        ))}
      </BlossomCarousel>

      <div className={styles.carouselControls}>
        <BlossomPrev
          for={CAROUSEL_ID}
          aria-label={copy.previous}
          className={styles.carouselButton}
        >
          <Arrow direction="previous" />
        </BlossomPrev>

        <BlossomDots
          for={CAROUSEL_ID}
          aria-label={copy.dots}
          className={styles.carouselDots}
        >
          {({ index, active }) => (
            <BlossomDot
              className={styles.carouselDot}
              data-active={active ? 'true' : 'false'}
              aria-label={SCREENSHOTS[index]?.alt[locale]}
            >
              <span className={styles.carouselDotMark} />
            </BlossomDot>
          )}
        </BlossomDots>

        <BlossomNext
          for={CAROUSEL_ID}
          aria-label={copy.next}
          className={styles.carouselButton}
        >
          <Arrow direction="next" />
        </BlossomNext>
      </div>
    </div>
  )
}
