// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { InlineProductName } from './inline-product-name'

afterEach(cleanup)

describe('InlineProductName', () => {
  it('renders Codex with its existing decorative mark', () => {
    const { container } = render(<InlineProductName product="Codex" />)

    expect(container.textContent).toBe('Codex')
    expect(
      container.querySelector('img[src="/images/codex.svg"]')?.getAttribute('aria-hidden'),
    ).toBe('true')
  })

  it('reuses the Claude mark without hiding the product name', () => {
    const { container } = render(<InlineProductName product="Claude Code" />)

    expect(container.textContent).toBe('Claude Code')
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
