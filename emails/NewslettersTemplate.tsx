import * as React from 'react'
import ReactMarkdown from 'react-markdown'

import { Heading, Section,Text,Link } from './_components'
import Layout from './Layout'

const NewslettersTemplate = (props: {
  subject?: string | null
  body?: string | null
  link?: string | null
}) => {
  const { subject = '测试主题', body = `## 测试内容`, link = 'link.com/unsubscribe?fake-token' } = props

  return (
    <Layout previewText={subject ?? ''}>
      <Heading>{subject}</Heading>
      {body && (
        <Section className="max-w-[465px] px-2 text-[14px] leading-loose text-zinc-700">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => {
                return (
                  <img
                    src={src}
                    alt={alt}
                    className="mx-auto my-0 max-w-[465px]"
                  />
                )
              },
            }}
          >
            {body}
          </ReactMarkdown>
        </Section>
      )}
      <Text className="text-[14px] leading-[24px] text-black">
        不再订阅Newsletter？请点击此处取消订阅
        <br />
        <Link href={link} className="text-blue-600 no-underline">
          取消订阅
        </Link>
      </Text>
    </Layout>
  )
}

export default NewslettersTemplate
