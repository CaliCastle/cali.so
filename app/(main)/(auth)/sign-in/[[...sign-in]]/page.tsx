import { SignIn } from '@clerk/nextjs'

import { Container } from '~/components/ui/Container'

export default function Page() {
  return (
    <Container className="mt-24 flex items-center justify-center">
      <SignIn />
    </Container>
  )
}
