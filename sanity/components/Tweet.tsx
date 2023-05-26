import { Tweet as ReactTweet } from 'react-tweet'
import { type BlockProps } from 'sanity'

export function Tweet(props: BlockProps) {
  const id = 'id' in props.value ? (props.value.id as string) : ''

  if (!id) {
    return null
  }

  return <ReactTweet apiUrl={`/api/tweet/${id}`} />
}
