/** @vitest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PhotoStack, PhotoStackCaption, PhotoStackFrames } from './photo-stack'

describe('PhotoStack', () => {
  it('groups a set of photos under one semantic caption', () => {
    const { container } = render(
      <PhotoStack>
        <PhotoStackFrames>
          <button type="button">Photo one</button>
          <button type="button">Photo two</button>
        </PhotoStackFrames>
        <PhotoStackCaption>Jensen's first month</PhotoStackCaption>
      </PhotoStack>,
    )

    const figure = container.querySelector('figure.photo-stack')
    expect(figure).toBeTruthy()
    expect(figure?.querySelector('.photo-stack__frames')).toBeTruthy()
    expect(screen.getByText("Jensen's first month").tagName).toBe('FIGCAPTION')
  })
})
