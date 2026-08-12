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
      zh: '/images/calibaby/screenshots/daily-care.webp',
      en: '/images/calibaby/screenshots/en/daily-care.webp',
    },
    alt: {
      zh: 'Cali Baby 应用界面，展示最近的喂奶、睡眠与尿布记录',
      en: 'Cali Baby showing recent feeds, sleep, and diaper changes',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/care-timeline.webp',
      en: '/images/calibaby/screenshots/en/care-timeline.webp',
    },
    alt: {
      zh: 'Cali 宝宝连续照顾时间线',
      en: 'Cali Baby continuous care timeline',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/pregnancy.webp',
      en: '/images/calibaby/screenshots/en/pregnancy.webp',
    },
    alt: {
      zh: 'Cali 宝宝孕期首页',
      en: 'Cali Baby pregnancy home screen',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/live-activity.webp',
      en: '/images/calibaby/screenshots/en/live-activity.webp',
    },
    alt: {
      zh: 'Cali 宝宝锁定画面实时记录',
      en: 'Cali Baby Lock Screen live recording',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/voice-record.webp',
      en: '/images/calibaby/screenshots/en/voice-record.webp',
    },
    alt: {
      zh: 'Cali 宝宝语音快速记录',
      en: 'Cali Baby voice quick record',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/family-sync.webp',
      en: '/images/calibaby/screenshots/en/family-sync.webp',
    },
    alt: {
      zh: 'Cali 宝宝家庭照顾自动同步',
      en: 'Cali Baby automatic family care sync',
    },
  },
  {
    src: {
      zh: '/images/calibaby/screenshots/trends.webp',
      en: '/images/calibaby/screenshots/en/trends.webp',
    },
    alt: {
      zh: 'Cali 宝宝照顾趋势',
      en: 'Cali Baby care trends',
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
