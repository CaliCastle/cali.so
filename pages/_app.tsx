import '~/styles/globals.css'
import type { AppProps } from 'next/app'
import { sansFont } from '~/lib/font'
import Seo from '~/components/Seo'
import { clsxm } from '@zolplay/utils'

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Seo />

      <main
        className={clsxm(
          sansFont.variable,
          'relative h-full font-sans',
          'bg-primary-900 text-slate-50',
          'bg-[url("/grid.svg")] bg-top bg-repeat'
        )}
      >
        <span className="pointer-events-none fixed top-0 block h-[800px] w-full select-none bg-[radial-gradient(103.72%_46.58%_at_50%_0%,rgba(255,255,255,0.09)_0%,rgba(255,255,255,0)_100%)]" />

        <Component {...pageProps} />
      </main>
    </>
  )
}
