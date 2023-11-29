import { type Metadata } from 'next'

import { Projects } from '~/app/(main)/projects/Projects'
import { Container } from '~/components/ui/Container'

const title = '我的项目'
const description =
  '多年来，我一直在做各种各样的小项目，这里就是我筛选出来我觉得还不错的项目合集，也是我在技术领域中尝试和探索的最好见证。'
export const metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
  },
  twitter: {
    title,
    description,
    card: 'summary_large_image',
  },
} satisfies Metadata

export default function ProjectsPage() {
  return (
    <Container className="mt-16 sm:mt-32">
      <header className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl">
          我的项目们。
        </h1>
        <p className="mt-6 text-base text-zinc-600 dark:text-zinc-400">
          我自己没事就会做一些小项目来实现一下自己的想法，绝大多数都是 just for fun 的。但是谁知道这些小项目会不会成为下一个大项目呢？
          虽然现在项目的数量还不多，也不够专业，但只要不断进步，总有一天会成为大牛的❤。
        </p>
      </header>
      <div className="mt-16 sm:mt-20">
        <Projects />
      </div>
    </Container>
  )
}

export const revalidate = 3600
