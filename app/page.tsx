import Link from 'next/link'
import { TbAtom2, TbPlanet } from 'react-icons/tb'
import Balancer from 'react-wrap-balancer'

import { NewsletterSignup } from '~/app/(home)/NewsletterSignup'
import { Photos } from '~/app/(home)/Photos'
import { Resume } from '~/app/(home)/Resume'
import { SocialLink } from '~/components/links/SocialLink'
import { Container } from '~/components/ui/Container'

function Developer() {
  return (
    <span className="group">
      <span className="font-mono">&lt;</span>开发者
      <span className="font-mono">/&gt;</span>
      <span className="invisible inline-flex text-zinc-300 before:content-['|'] group-hover:visible group-hover:animate-typing dark:text-zinc-500" />
    </span>
  )
}

function Designer() {
  return (
    <span className="group relative rounded-2xl bg-black/5 p-1 dark:bg-white/5">
      <span className="pointer-events-none absolute inset-0 border border-lime-700/90 opacity-70 group-hover:border-dashed group-hover:opacity-100 dark:border-lime-400/90">
        <span className="absolute -left-0.5 -top-0.5 h-1.5 w-1.5 border border-lime-700 bg-zinc-50 dark:border-lime-400" />
        <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 border border-lime-700 bg-zinc-50 dark:border-lime-400" />
        <span className="absolute -bottom-0.5 -left-0.5 h-1.5 w-1.5 border border-lime-700 bg-zinc-50 dark:border-lime-400" />
        <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 border border-lime-700 bg-zinc-50 dark:border-lime-400" />
      </span>
      设计师
    </span>
  )
}

function OCD() {
  return (
    <span className="group">
      <TbAtom2 className="mr-1 inline-flex transform-gpu transition-transform duration-500 group-hover:rotate-180" />
      <span>细节控</span>
    </span>
  )
}

function Founder() {
  return (
    <>
      <TbPlanet className="mr-1 inline-flex" />
      <span>创始人</span>
    </>
  )
}

export default function HomePage() {
  return (
    <>
      <Container className="mt-10">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
            <Developer />，<Designer />，
            <br />
            <OCD />，<Founder />
          </h1>
          <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
            <Balancer>
              我是 Cali，
              <Link
                href="https://zolplay.cn/?utm_source=cali.so"
                className="font-semibold text-zinc-800 hover:underline dark:text-zinc-100"
                target="_blank"
              >
                佐玩
              </Link>
              创始人，目前带领着佐玩致力于创造一个充满创造力的工作环境，同时鼓励团队创造影响世界的产品。
              我热爱开发，设计，创新，享受生活，以及在未知领域中探索。
            </Balancer>
          </p>
          <div className="mt-6 flex gap-6">
            <SocialLink
              href="https://twitter.com/thecalicastle"
              aria-label="我的推特"
            />
            <SocialLink
              href="https://github.com/CaliCastle"
              aria-label="我的 GitHub"
            />
            <SocialLink
              href="https://youtube.com/@calicastle"
              aria-label="我的 YouTube"
            />
            <SocialLink
              href="https://t.me/calicastle"
              aria-label="我的 Telegram"
            />
            <SocialLink
              href="https://www.linkedin.com/in/calicastle/"
              aria-label="我的领英"
            />
            <SocialLink href="mailto:hi@cali.so" aria-label="我的邮箱" />
          </div>
        </div>
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16"></div>
          <aside className="space-y-10 lg:pl-16 xl:pl-24">
            <NewsletterSignup />
            <Resume />
          </aside>
        </div>
      </Container>
    </>
  )
}
