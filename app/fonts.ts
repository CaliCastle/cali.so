import { Geist, Geist_Mono, National_Park } from 'next/font/google'
import localFont from 'next/font/local'

import type { Locale } from '~/lib/locale-route'

const geist = Geist({
  subsets: ['latin'],
  variable: '--font-geist',
  display: 'swap',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

const nationalPark = National_Park({
  weight: 'variable',
  subsets: ['latin'],
  variable: '--font-national-park',
  display: 'swap',
  adjustFontFallback: false,
})

// Shared CJK fallback: the public site keeps Geist, while Cali Baby uses
// National Park for Latin glyphs.
const frexSansGB = localFont({
  src: [
    { path: './_fonts/FrexSansGB-Regular.woff2', weight: '400' },
    { path: './_fonts/FrexSansGB-Medium.woff2', weight: '500' },
    { path: './_fonts/FrexSansGB-SemiBold.woff2', weight: '600' },
  ],
  variable: '--font-frex-gb',
  display: 'swap',
  preload: false,
})

const latinFontVariables = [geist.variable, geistMono.variable].join(' ')

export function cjkFontVariableForLocale(locale: Locale) {
  return locale === 'zh' ? frexSansGB.variable : ''
}

export function fontVariablesForLocale(locale: Locale) {
  return [latinFontVariables, cjkFontVariableForLocale(locale)]
    .filter(Boolean)
    .join(' ')
}

export function caliBabyFontVariablesForLocale(locale: Locale) {
  return [nationalPark.variable, cjkFontVariableForLocale(locale)]
    .filter(Boolean)
    .join(' ')
}
