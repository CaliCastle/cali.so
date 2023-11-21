import * as React from 'react'

import { emailConfig } from '../config/email'
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from './_components'

export default function Layout({
  previewText,
  children,
}: {
  previewText: string
  children: React.ReactNode
}) {
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto bg-zinc-50 pt-[32px] font-sans">
          <Container className="mx-auto my-[40px] w-[465px] max-w-[465px] rounded-2xl border border-solid border-zinc-100 bg-white px-[24px] py-[20px]">
            {children}
          </Container>

          <Container className="mx-auto mt-[32px] w-[465px]">
            <Hr className="mx-0 my-[20px] h-px w-full bg-zinc-100" />
            <Section>
              <Img
                src={`${emailConfig.baseUrl}/icon.png`}
                width="24"
                height="24"
                alt="Suremotoo"
                className="mx-auto my-0"
              />
              <Text className="text-center">
                <Link
                  href="https://suremotoo.cc"
                  className="text-zinc-700 underline"
                >
                  <strong>Suremotoo</strong>
                </Link>
                <br />
                开发者、妄想家
              </Text>
              <Text className="text-center">
                {/* <Link
                  href="https://suremotoo.cc/twitter"
                  className="text-xs text-zinc-600 underline"
                >
                  Twitter
                </Link>{' '}
                |&nbsp;
                <Link
                  href="https://suremotoo.cc/youtube"
                  className="text-xs text-zinc-600 underline"
                >
                  YouTube
                </Link>{' '}
                |&nbsp; */}
                <Link
                  href="https://suremotoo.cc/github"
                  className="text-xs text-zinc-600 underline"
                >
                  GitHub
                </Link>{' '}
                |&nbsp;
                <Link
                  href="https://suremotoo.cc/bilibili"
                  className="text-xs text-zinc-600 underline"
                >
                  哔哩哔哩
                </Link>
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}
