import { Card } from '@sanity/ui'
import { Tweet as ReactTweet } from 'react-tweet'
import { type PreviewProps } from 'sanity'

type TweetProps = PreviewProps & {
  id: string | undefined
}

export function Tweet(props: TweetProps) {
  if (!props.id) {
    return <Card padding={4}>Missing tweet ID</Card>
  }

  return (
    <Card>
      <ReactTweet apiUrl={`/api/tweet/${props.id}`} />
    </Card>
  )
}
