import { Box, Button, Flex } from '@sanity/ui'
import React from 'react'
import ReadingTime from 'reading-time'
import { type NumberInputProps, set, useFormValue } from 'sanity'

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
  const body = useFormValue(['body'])

  const generate = React.useCallback(() => {
    const rt = ReadingTime(flattenBlocks(body as SanityBlock[]).join('\n'))
    props.onChange(set(rt.minutes))
  }, [body, props])

  return (
    <Flex gap={3} align="center">
      <Box flex={1}>{props.renderDefault(props)}</Box>
      <Button mode="ghost" onClick={generate}>
        Generate
      </Button>
    </Flex>
  )
}
