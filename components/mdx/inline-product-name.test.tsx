// @vitest-environment jsdom

import { cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { InlineProductName } from './inline-product-name'

afterEach(cleanup)

describe('InlineProductName', () => {
  it.each([
    ['ATS', '/images/products/ats.svg'],
    ['App Store', '/images/products/app-store.svg'],
    ['Codex', '/images/codex.svg'],
    ['Control', '/images/products/control.svg'],
    ['Dex', '/images/products/dex.svg'],
    ['Slack', '/images/products/slack.svg'],
  ] as const)('renders %s with its decorative mark', (product, src) => {
    const { container } = render(<InlineProductName product={product} />)

    expect(container.textContent).toBe(product)
    expect(container.querySelector(`img[src="${src}"]`)?.getAttribute('aria-hidden')).toBe('true')
  })

  it('reuses the Claude mark without hiding the product name', () => {
    const { container } = render(<InlineProductName product="Claude Code" />)

    expect(container.textContent).toBe('Claude Code')
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true')
  })
})
