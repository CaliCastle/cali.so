import * as React from 'react'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from './_components'

const baseUrl =
  process.env.VERCEL_ENV === 'production'
    ? `https://cali.so`
    : 'http://localhost:3000'
const confirmLink = new URL('/confirm', baseUrl)

const ConfirmSubscriptionEmail: React.FC<{
  token?: string
}> = ({ token = 'fake-token' }) => {
  const previewText = `确认订阅 Cali 的动态吗？`
  confirmLink.searchParams.set('token', token)
  const link = confirmLink.toString()

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="mx-auto my-auto mt-[32px] bg-zinc-50 font-sans">
          <Container className="mx-auto my-[40px] w-[465px] rounded-2xl border border-solid border-zinc-100 bg-white p-[20px]">
            <Section className="mt-[24px]">
              <Img
                src={`${baseUrl}/subscription-email-header.jpg`}
                width="234"
                height="121"
                alt="Cali"
                className="mx-auto my-0"
              />
            </Section>
            <Heading className="mx-0 my-[30px] p-0 text-center text-[24px] font-bold text-black">
              订阅 Cali 的动态
            </Heading>
            <Text className="text-[14px] leading-[24px] text-black">
              Hello!
            </Text>
            <Text className="text-[14px] leading-[24px] text-black">
              为了认证此操作，请点击下面的按钮确认订阅 Cali 的动态噢，谢谢 🙏
            </Text>
            <Section className="mb-[32px] mt-[32px] text-center">
              <Button
                pX={20}
                pY={12}
                className="rounded-xl bg-zinc-900 text-center text-[12px] font-semibold text-white no-underline"
                href={link}
              >
                确认订阅
              </Button>
            </Section>
            <Text className="text-[14px] leading-[24px] text-black">
              或者复制下面的链接到你的浏览器中进行访问：{' '}
              <Link href={link} className="text-blue-600 no-underline">
                {link}
              </Link>
            </Text>
            <Hr className="mx-0 my-[26px] w-full border border-solid border-[#eaeaea]" />
            <Text className="text-[12px] leading-[24px] text-[#666666]">
              如果不是你本人操作的可以无视本封邮件，如果你有任何疑问可以随时联系我。
            </Text>
          </Container>

          <Container className="mx-auto mt-[32px] w-[465px]">
            <Hr className="mx-0 my-[20px] h-px w-full bg-zinc-100" />
            <Section>
              <Img
                src={`${baseUrl}/icon.png`}
                width="24"
                height="24"
                alt="Cali"
                className="mx-auto my-0"
              />
              <Text className="text-center">
                <Link
                  href="https://cali.so"
                  className="text-zinc-700 underline"
                >
                  <strong>Cali Castle</strong>
                </Link>
                <br />
                开发者、设计师、细节控、创始人
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default ConfirmSubscriptionEmail
