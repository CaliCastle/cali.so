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
    src: '/images/calibaby/screenshots/daily-care.webp',
    alt: {
      zh: 'Cali 宝宝助手今日照顾总览',
      en: 'Cali Baby daily care overview',
    },
  },
  {
    src: '/images/calibaby/screenshots/care-timeline.webp',
    alt: {
      zh: 'Cali 宝宝助手连续照顾时间线',
      en: 'Cali Baby continuous care timeline',
    },
  },
  {
    src: '/images/calibaby/screenshots/pregnancy.webp',
    alt: {
      zh: 'Cali 宝宝助手孕期首页',
      en: 'Cali Baby pregnancy home screen',
    },
  },
  {
    src: '/images/calibaby/screenshots/live-activity.webp',
    alt: {
      zh: 'Cali 宝宝助手锁定画面实时记录',
      en: 'Cali Baby Lock Screen live recording',
    },
  },
  {
    src: '/images/calibaby/screenshots/voice-record.webp',
    alt: {
      zh: 'Cali 宝宝助手语音快速记录',
      en: 'Cali Baby voice quick record',
    },
  },
  {
    src: '/images/calibaby/screenshots/family-sync.webp',
    alt: {
      zh: 'Cali 宝宝助手家庭照顾自动同步',
      en: 'Cali Baby automatic family care sync',
    },
  },
  {
    src: '/images/calibaby/screenshots/trends.webp',
    alt: {
      zh: 'Cali 宝宝助手照顾趋势',
      en: 'Cali Baby care trends',
    },
  },
] as const

const CONTROL_COPY = {
  zh: {
    label: 'Cali 宝宝助手应用画面',
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
            key={screenshot.src}
            data-blossom-slide
            className={styles.slide}
            aria-label={`${index + 1} / ${SCREENSHOTS.length}`}
          >
            <Image
              src={screenshot.src}
              alt={screenshot.alt[locale]}
              width={1284}
              height={2778}
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
