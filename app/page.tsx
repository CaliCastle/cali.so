import { Headline } from '~/app/Headline'
import { Newsletter } from '~/app/Newsletter'
import { Photos } from '~/app/Photos'
import { Resume } from '~/app/Resume'
import { Container } from '~/components/ui/Container'

export default function HomePage() {
  return (
    <>
      <Container className="mt-10">
        <Headline />
      </Container>
      <Photos />
      <Container className="mt-24 md:mt-28">
        <div className="mx-auto grid max-w-xl grid-cols-1 gap-y-20 lg:max-w-none lg:grid-cols-2">
          <div className="flex flex-col gap-16"></div>
          <aside className="space-y-10 lg:pl-16 xl:pl-24">
            <Newsletter />
            <Resume />
          </aside>
        </div>
      </Container>
    </>
  )
}

export const runtime = 'edge'
