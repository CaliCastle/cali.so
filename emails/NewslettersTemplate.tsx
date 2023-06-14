import * as React from 'react'
import ReactMarkdown from 'react-markdown'

import { Heading, Section } from './_components'
import { Layout } from './Layout'

const NewslettersTemplate = (props: {
  subject?: string | null
  body?: string | null
}) => {
  const {
    subject = '测试主题',
    body = `# 你好，世界
  - 你好
  - 世界
  `,
  } = props

  return (
    <Layout previewText={subject ?? ''}>
      <Heading>{subject}</Heading>

      {body && (
        <Section className="px-2 text-[14px] leading-[16px] text-zinc-700">
          <ReactMarkdown>{body}</ReactMarkdown>
        </Section>
      )}
    </Layout>
  )
}

export default NewslettersTemplate
