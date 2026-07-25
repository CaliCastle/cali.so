/** @vitest-environment jsdom */

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { TimeAllocationChart } from './time-allocation-chart'

afterEach(cleanup)

describe('TimeAllocationChart', () => {
  it('keeps the Chinese takeaway, values, and estimate caveat visible', () => {
    const { container } = render(<TimeAllocationChart locale="zh" />)
    const chart = screen.getByRole('group', {
      name: '宝宝助手应用开发时间分配',
    })

    expect(
      within(chart).getByText('95% 的时间花在判断与打磨上'),
    ).toBeTruthy()
    expect(within(chart).getByText('前期规划')).toBeTruthy()
    expect(within(chart).getByText('决策、体验设计与反复优化')).toBeTruthy()
    expect(within(chart).getByText('界面调试与原型迭代')).toBeTruthy()
    expect(
      screen.getByText(/个人回顾估算，并非精确工时统计/),
    ).toBeTruthy()
    expect(
      container
        .querySelector('[data-tone="context"]')
        ?.getAttribute('style'),
    ).toContain('--allocation: 5%')
    expect(
      container
        .querySelector('[data-tone="primary"]')
        ?.getAttribute('style'),
    ).toContain('--allocation: 50%')
    expect(
      container
        .querySelector('[data-tone="secondary"]')
        ?.getAttribute('style'),
    ).toContain('--allocation: 45%')
  })

  it('can render the same evidence for the English edition', () => {
    render(<TimeAllocationChart locale="en" />)

    expect(
      screen.getByRole('group', {
        name: 'Baby tracking app development time allocation',
      }),
    ).toBeTruthy()
    expect(
      screen.getByText('95% of the time went into judgment and refinement'),
    ).toBeTruthy()
    expect(screen.getByText('Decisions, UX, and refinement')).toBeTruthy()
  })
})
