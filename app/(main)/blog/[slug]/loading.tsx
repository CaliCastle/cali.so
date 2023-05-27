import { UFOIcon } from '~/assets'
import { Container } from '~/components/ui/Container'

export default function BlogPostPageSkeleton() {
  return (
    <Container className="relative mt-16 min-h-screen lg:mt-32">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="animate-pulse text-5xl">
          <UFOIcon />
        </div>
      </div>
    </Container>
  )
}
