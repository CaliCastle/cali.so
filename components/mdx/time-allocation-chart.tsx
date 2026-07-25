import type { CSSProperties } from 'react'

import { localize, type Locale } from '~/lib/locale-route'

const ALLOCATION = [
  {
    value: 5,
    tone: 'context',
    zh: '前期规划',
    en: 'Upfront planning',
  },
  {
    value: 50,
    tone: 'primary',
    zh: '决策、体验设计与反复优化',
    en: 'Decisions, UX, and refinement',
  },
  {
    value: 45,
    tone: 'secondary',
    zh: '界面调试与原型迭代',
    en: 'UI debugging and prototyping',
  },
] as const

export function TimeAllocationChart({ locale = 'zh' }: { locale?: Locale }) {
  const title = localize(
    locale,
    '95% 的时间花在判断与打磨上',
    '95% of the time went into judgment and refinement',
  )
  const caption = localize(
    locale,
    '业务代码反而不是主要瓶颈。个人回顾估算，并非精确工时统计。',
    'Business logic was not the main bottleneck. Personal retrospective estimate, not tracked hours.',
  )

  return (
    <figure className="post-figure time-allocation-figure">
      <div
        className="time-allocation-chart"
        role="group"
        aria-label={localize(
          locale,
          '宝宝助手应用开发时间分配',
          'Baby tracking app development time allocation',
        )}
      >
        <div className="time-allocation-chart__header">
          <p className="time-allocation-chart__eyebrow">
            {localize(
              locale,
              '宝宝助手应用 · 时间分配',
              'Baby tracking app · Time allocation',
            )}
          </p>
          <p className="time-allocation-chart__title">{title}</p>
        </div>

        <div className="time-allocation-chart__rows">
          {ALLOCATION.map((item) => (
            <div className="time-allocation-chart__row" key={item.tone}>
              <div className="time-allocation-chart__label">
                <span>{localize(locale, item.zh, item.en)}</span>
                <span className="time-allocation-chart__value">{item.value}%</span>
              </div>
              <div className="time-allocation-chart__track" aria-hidden="true">
                <span
                  className="time-allocation-chart__bar"
                  data-tone={item.tone}
                  style={{ '--allocation': `${item.value}%` } as CSSProperties}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="post-figcaption">{caption}</figcaption>
    </figure>
  )
}
