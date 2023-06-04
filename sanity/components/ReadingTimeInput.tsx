import { Box, Button, Flex } from '@sanity/ui'
import React from 'react'
import ReadingTime from 'reading-time'
import {
  type FieldMember,
  type NumberInputProps,
  set,
  useFormBuilder,
} from 'sanity'

type SanityBlock = {
  _type: string
  children?: SanityBlock[]
  text?: string
}

function flattenBlocks(blocks: SanityBlock[]): string[] {
  return blocks.flatMap((block) => {
    if (block.text) {
      return [block.text]
    }

    if (block.children) {
      return flattenBlocks(block.children)
    }

    return []
  })
}

export default function ReadingTimeInput(props: NumberInputProps) {
  const value = React.useDeferredValue(props.value)
  const { schemaType } = props
  const { members } = useFormBuilder()

  const generate = React.useCallback(() => {
    // find the member that has the key of "body"
    const bodyMember = members.find((member) => {
      if (member.kind === 'field') {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comments
        // @ts-ignore
        return member.name === schemaType.options?.source ?? 'body'
      }
      return false
    }) as FieldMember | undefined
    if (!bodyMember) {
      return
    }

    const rt = ReadingTime(
      flattenBlocks(bodyMember.field.value as SanityBlock[]).join('\n')
    )
    props.onChange(set(rt.minutes))
  }, [members, props.onChange, schemaType.options])

  return (
    <Flex gap={3} align="center">
      <Box flex={1}>{props.renderDefault(props)}</Box>
      <Button mode="ghost" onClick={generate}>
        Generate
      </Button>
    </Flex>
  )
}
