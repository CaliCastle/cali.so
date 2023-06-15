import * as React from 'react'
import ReactMarkdown from 'react-markdown'

import { Heading, Section } from './_components'
import Layout from './Layout'

const NewslettersTemplate = (props: {
  subject?: string | null
  body?: string | null
}) => {
  const {
    subject = '测试主题',
    body = `## 最近的一些更新与变化
  ![](https://zolplay.com/api/og?title=Some+Recent+Changes)
  `,
  } = props

  return (
    <Layout previewText={subject ?? ''}>
      <Heading>{subject}</Heading>

      {body && (
        <Section className="max-w-[465px] px-2 text-[14px] leading-[16px] text-zinc-700">
          <ReactMarkdown
            components={{
              img: ({ src, alt }) => {
                return (
                  <img
                    src={src}
                    alt={alt}
                    className="mx-auto my-0 max-w-[420px]"
                  />
                )
              },
            }}
          >
            {body}
          </ReactMarkdown>
        </Section>
      )}
    </Layout>
  )
}

export default NewslettersTemplate
