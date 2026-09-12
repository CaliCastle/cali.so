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

const SCREENSHOTS = {
  zh: [
    {
      src: '/images/calibaby/screenshots/01-everyday-care.webp',
      alt: 'Cali 宝宝日常照顾记录与今日概览',
    },
    {
      src: '/images/calibaby/screenshots/01b-bottle-input.webp',
      alt: 'Cali 宝宝瓶喂记录，一次记好奶量与奶源',
    },
    {
      src: '/images/calibaby/screenshots/02-family-care.webp',
      alt: 'Cali 宝宝家庭共享与共同照顾',
    },
    {
      src: '/images/calibaby/screenshots/03-watch-and-widgets.webp',
      alt: 'Cali 宝宝 Apple Watch 与小组件',
    },
    {
      src: '/images/calibaby/screenshots/04-voice-recording.webp',
      alt: 'Cali 宝宝语音记录',
    },
    {
      src: '/images/calibaby/screenshots/05b-supplies-catalog.webp',
      alt: 'Cali 宝宝用品目录，集中管理喂养、护理与营养用品',
    },
    {
      src: '/images/calibaby/screenshots/06-vaccine-book.webp',
      alt: 'Cali 宝宝疫苗本',
    },
    {
      src: '/images/calibaby/screenshots/07-feeding-records.webp',
      alt: 'Cali 宝宝喂养记录',
    },
    {
      src: '/images/calibaby/screenshots/08-sleep-records.webp',
      alt: 'Cali 宝宝睡眠记录',
    },
    {
      src: '/images/calibaby/screenshots/09-growth-records.webp',
      alt: 'Cali 宝宝成长记录',
    },
  ],
  en: [
    {
      src: '/images/calibaby/screenshots/en/01-today.webp',
      alt: 'Cali Baby Today overview and daily care records',
    },
    {
      src: '/images/calibaby/screenshots/en/02-sounds.webp',
      alt: 'Cali Baby sleep sounds',
    },
    {
      src: '/images/calibaby/screenshots/en/03-sleep-live.webp',
      alt: 'Cali Baby live sleep tracking',
    },
    {
      src: '/images/calibaby/screenshots/en/04-feeding-live.webp',
      alt: 'Cali Baby live feeding tracking',
    },
    {
      src: '/images/calibaby/screenshots/en/05-ipad.webp',
      alt: 'Cali Baby on iPad',
    },
    {
      src: '/images/calibaby/screenshots/en/06-watch.webp',
      alt: 'Cali Baby on Apple Watch',
    },
    {
      src: '/images/calibaby/screenshots/en/07-family.webp',
      alt: 'Cali Baby family sharing and sync',
    },
    {
      src: '/images/calibaby/screenshots/en/08-history.webp',
      alt: 'Cali Baby care history and timeline',
    },
    {
      src: '/images/calibaby/screenshots/en/09-widgets.webp',
      alt: 'Cali Baby widgets',
    },
  ],
} as const

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
  const screenshots = SCREENSHOTS[locale]

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
        {screenshots.map((screenshot, index) => (
          <li
            key={screenshot.src}
            data-blossom-slide
            className={styles.slide}
            aria-label={`${index + 1} / ${screenshots.length}`}
          >
            <Image
              src={screenshot.src}
              alt={screenshot.alt}
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
              aria-label={screenshots[index]?.alt}
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
