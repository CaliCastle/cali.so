import Link from 'next/link'
import React from 'react'

import { CursorClickIcon, UsersIcon } from '~/assets'
import { Container } from '~/components/ui/Container'
import { kvKeys } from '~/config/kv'
import { navigationItems } from '~/config/nav'
import { env } from '~/env.mjs'
import { prettifyNumber } from '~/lib/math'
import { redis } from '~/lib/redis'

function NavLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="transition hover:text-lime-500 dark:hover:text-lime-400"
    >
      {children}
    </Link>
  )
}

function Links() {
  return (
    <nav className="flex gap-6 text-sm font-medium text-zinc-800 dark:text-zinc-200">
      {navigationItems.map(({ href, text }) => (
        <NavLink key={href} href={href}>
          {text}
        </NavLink>
      ))}
    </nav>
  )
}

async function TotalPageViews() {
  let views: number
  if (env.VERCEL_ENV === 'production') {
    views = await redis.incr(kvKeys.totalPageViews)
  } else {
    views = 345678
  }

  return (
    <span className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 md:justify-start">
      <UsersIcon className="h-4 w-4" />
      <span title={`${Intl.NumberFormat('en-US').format(views)}次浏览`}>
        总浏览量&nbsp;
        <span className="font-medium">{prettifyNumber(views, true)}</span>
      </span>
    </span>
  )
}

type VisitorGeolocation = {
  country: string
  city?: string
  flag: string
}
async function LastVisitorInfo() {
  let lastVisitor: VisitorGeolocation | undefined = undefined
  if (env.VERCEL_ENV === 'production') {
    const [lv, cv] = await redis.mget<VisitorGeolocation[]>(
      kvKeys.lastVisitor,
      kvKeys.currentVisitor
    )
    lastVisitor = lv
    await redis.set(kvKeys.lastVisitor, cv)
  }

  if (!lastVisitor) {
    lastVisitor = {
      country: 'US',
      flag: '🇺🇸',
    }
  }

  return (
    <span className="flex items-center justify-center gap-1 text-xs text-zinc-500 dark:text-zinc-400 md:justify-start">
      <CursorClickIcon className="h-4 w-4" />
      <span>
        最近访客来自&nbsp;
        {[lastVisitor.city, lastVisitor.country].filter(Boolean).join(', ')}
      </span>
      <span className="font-medium">{lastVisitor.flag}</span>
    </span>
  )
}

function LiveBlocksBadge() {
  return (
    <span className="inline-flex items-center text-xs text-zinc-500 dark:text-zinc-400">
      多人实时功能由
      <Link
        href="https://liveblocks.io"
        className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
        target="_blank"
      >
        <svg
          className="inline-block h-14"
          viewBox="0 0 1080 480"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M328.99 187.313H312L312.004 287.984H328.99V187.313ZM360.513 216.093H343.528V287.984H360.513V216.093ZM360.513 186.539H343.528V204.861H360.513V186.539ZM385.441 216.093H367.187L392.884 287.984H411.839L437.536 216.093H419.561L408.82 250.145C408.541 251.03 407.534 254.496 405.802 260.533L402.361 272.117C400.328 264.766 398.199 257.441 395.976 250.145L385.441 216.093ZM507.111 238.561C505.705 233.74 503.645 229.642 500.927 226.271C497.883 222.487 494.026 219.559 489.347 217.499C484.712 215.392 479.564 214.343 473.902 214.343C463.138 214.343 454.525 217.71 448.067 224.448C444.845 227.929 442.382 232.042 440.834 236.527C439.243 241.157 438.448 246.283 438.448 251.899C438.448 263.926 441.655 273.218 448.071 279.772C454.573 286.415 463.233 289.739 474.043 289.739C483.31 289.739 490.818 287.658 496.58 283.491C502.338 279.325 506.152 273.149 508.022 264.958L491.454 263.694C490.659 268.14 488.831 271.464 485.976 273.661C483.121 275.816 479.096 276.895 473.902 276.895C462.016 276.895 455.932 270.2 455.652 256.814H509.145L509.218 254.428C509.218 248.67 508.513 243.381 507.111 238.561ZM459.44 233.508C462.437 229.294 467.258 227.187 473.902 227.187C477.131 227.187 479.848 227.63 482.046 228.52C484.247 229.41 486.144 230.837 487.735 232.803C488.972 234.328 489.923 236.065 490.543 237.928C491.24 239.873 491.666 241.904 491.807 243.965H455.789C456.211 239.799 457.428 236.312 459.44 233.508ZM575.211 218.905C570.391 215.766 564.822 214.201 558.505 214.201H558.496C553.913 214.201 549.724 215.134 545.932 217.009C542.2 218.828 539.005 221.585 536.661 225.011V187.313H519.676V287.984H536.665V278.086C538.819 281.643 541.869 284.572 545.51 286.579C549.303 288.686 553.491 289.739 558.075 289.739C564.443 289.739 570.081 288.217 575.005 285.177C579.915 282.137 583.729 277.781 586.442 272.117C589.203 266.407 590.588 259.717 590.588 252.041C590.588 244.55 589.225 237.954 586.516 232.244C583.846 226.486 580.078 222.04 575.211 218.905ZM567.978 271.064C565.265 275.183 560.633 277.239 554.076 277.239C548.176 277.239 543.734 275.11 540.742 270.853C537.745 266.596 536.248 260.37 536.248 252.179C536.248 244.267 537.581 238.092 540.247 233.645C542.965 229.152 547.527 226.907 553.939 226.907C560.492 226.907 565.148 228.967 567.91 233.082C570.674 237.154 572.05 243.475 572.05 252.041C572.05 260.602 570.696 266.945 567.978 271.064ZM618.181 187.313H601.192V287.984H618.181V187.313ZM645.701 285.245C651.227 288.242 657.776 289.739 665.362 289.739C672.663 289.739 679.075 288.17 684.596 285.039C690.079 281.991 694.546 277.401 697.444 271.838C700.484 266.128 702.007 259.527 702.007 252.041C702.007 244.834 700.51 238.371 697.513 232.665C694.64 227.036 690.205 222.355 684.737 219.185C679.212 215.955 672.754 214.339 665.362 214.339C657.918 214.339 651.412 215.955 645.844 219.185C640.391 222.342 635.956 226.994 633.064 232.592C630.118 238.255 628.643 244.739 628.643 252.041C628.643 259.811 630.092 266.524 632.995 272.186C635.818 277.72 640.247 282.272 645.701 285.245ZM679.47 271.137C676.615 275.162 671.911 277.174 665.362 277.174C660.915 277.174 657.334 276.284 654.62 274.504C651.902 272.681 649.937 269.942 648.72 266.291C647.503 262.593 646.897 257.842 646.897 252.037C646.897 243.334 648.325 236.969 651.18 232.945C654.082 228.92 658.808 226.907 665.362 226.907C671.867 226.907 676.546 228.92 679.401 232.945C682.304 236.969 683.753 243.334 683.753 252.041C683.753 260.744 682.325 267.108 679.47 271.137ZM725.176 285.245C730.654 288.242 737.181 289.739 744.766 289.739C750.662 289.739 755.929 288.712 760.56 286.652C765.198 284.592 768.96 281.715 771.864 278.017C774.774 274.248 776.682 269.802 777.408 265.096L761.052 263.414C759.93 267.904 758.058 271.253 755.435 273.451C752.816 275.652 749.255 276.753 744.766 276.753C740.178 276.753 736.575 275.816 733.952 273.941C731.333 272.023 729.505 269.288 728.478 265.728C727.446 262.124 726.934 257.562 726.934 252.041C726.934 246.61 727.446 242.117 728.478 238.561C729.505 234.957 731.307 232.196 733.883 230.275C736.506 228.309 740.131 227.329 744.766 227.329C749.725 227.329 753.401 228.709 755.788 231.47C758.22 234.183 759.954 237.902 760.98 242.633L777.06 239.752C775.518 232.076 772.026 225.923 766.596 221.292C761.214 216.656 753.938 214.343 744.766 214.343C737.276 214.343 730.795 215.934 725.317 219.116C719.908 222.229 715.537 226.869 712.753 232.454C709.85 238.118 708.397 244.645 708.397 252.041C708.397 259.854 709.824 266.596 712.679 272.26C715.582 277.922 719.749 282.253 725.176 285.245ZM803.46 261.307L811.392 253.722L832.452 287.984H852.042L822.906 242.839L851.13 216.093H829.08L803.46 242.353V187.313H786.468V287.984H803.46V261.307ZM866.928 287.141C871.704 288.874 877.014 289.738 882.864 289.738C891.804 289.738 899.172 287.958 904.98 284.407C910.83 280.846 913.758 275.041 913.758 266.992C913.758 261.749 912.396 257.63 909.684 254.638C906.972 251.593 903.738 249.417 899.994 248.106C896.298 246.751 891.264 245.371 884.904 243.965C881.202 243.169 878.28 242.421 876.126 241.72C873.972 241.015 872.238 240.103 870.93 238.981C869.67 237.854 869.034 236.405 869.034 234.629C869.034 232.007 870.204 230.02 872.544 228.661C874.884 227.302 877.788 226.623 881.25 226.623C885.834 226.623 889.416 227.724 891.996 229.925C894.612 232.127 896.016 235.425 896.202 239.824L911.928 237.227C911.178 229.177 908.022 223.351 902.448 219.743C896.928 216.144 889.86 214.338 881.25 214.338C876.192 214.338 871.518 215.108 867.21 216.656C862.95 218.152 859.512 220.517 856.89 223.751C854.268 226.976 852.96 231.047 852.96 235.963C852.96 240.503 854.082 244.175 856.326 246.983C858.612 249.821 861.552 252.061 864.894 253.511C868.356 255.011 872.706 256.439 877.95 257.794L882.306 258.847C885.21 259.536 888.09 260.332 890.94 261.233C892.902 261.844 894.516 262.687 895.782 263.762C897.048 264.837 897.678 266.243 897.678 267.976C897.678 271.016 896.412 273.359 893.886 274.994C891.408 276.636 887.778 277.453 883.008 277.453C878.136 277.453 874.254 276.236 871.35 273.803C868.452 271.369 866.976 267.86 866.928 263.272L850.926 265.095C851.106 270.62 852.63 275.23 855.486 278.928C858.39 282.626 862.2 285.361 866.928 287.141Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M237 222H156L180 246V279L237 222Z"
            fill="currentColor"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M195 288H276L252 264V231L195 288Z"
            fill="currentColor"
          />
        </svg>
      </Link>
      驱动
    </span>
  )
}

export function Footer() {
  return (
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <p className="text-sm text-zinc-500/80 dark:text-zinc-400/80">
                &copy; 1995 - {new Date().getFullYear()} Cali Castle.
              </p>
              <Links />
            </div>
          </Container.Inner>
          <Container.Inner className="mt-6">
            <div className="flex flex-col items-center justify-start gap-2 sm:flex-row">
              <React.Suspense>
                {/* @ts-expect-error Async Server Component */}
                <TotalPageViews />
              </React.Suspense>
              <React.Suspense>
                {/* @ts-expect-error Async Server Component */}
                <LastVisitorInfo />
              </React.Suspense>
            </div>
          </Container.Inner>
          <Container.Inner className="mt-2">
            <div className="flex flex-col items-center justify-start gap-2 sm:flex-row">
              <LiveBlocksBadge />
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
