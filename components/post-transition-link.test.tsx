/** @vitest-environment jsdom */

import type { MouseEventHandler, ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('next/link', () => ({
  default: ({
    children,
    onClick,
    onNavigate,
  }: {
    children: ReactNode
    onClick?: MouseEventHandler<HTMLAnchorElement>
    onNavigate?: () => void
  }) => (
    <a
      href="/blog/a-post"
      onClick={(event) => {
        onClick?.(event)
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return
        }
        onNavigate?.()
        event.preventDefault()
      }}
    >
      {children}
    </a>
  ),
}))

import { PostTransitionLink } from './post-transition-link'

describe('PostTransitionLink', () => {
  afterEach(() => {
    cleanup()
    document.documentElement.style.removeProperty(
      '--post-cover-transition-name',
    )
    document.documentElement.style.removeProperty(
      '--post-title-transition-name',
    )
  })

  it('carries the clicked row transition names into the destination shell', () => {
    render(
      <PostTransitionLink
        href="/blog/a-post"
        coverTransitionName="cover-p01"
        titleTransitionName="title-p01"
      >
        Read post
      </PostTransitionLink>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Read post' }), {
      detail: 1,
    })

    expect(
      document.documentElement.style.getPropertyValue(
        '--post-cover-transition-name',
      ),
    ).toBe('cover-p01')
    expect(
      document.documentElement.style.getPropertyValue(
        '--post-title-transition-name',
      ),
    ).toBe('title-p01')
  })

  it('navigates without a morph when activated from the keyboard', () => {
    document.documentElement.style.setProperty(
      '--post-cover-transition-name',
      'stale-cover',
    )
    document.documentElement.style.setProperty(
      '--post-title-transition-name',
      'stale-title',
    )

    render(
      <PostTransitionLink
        href="/blog/a-post"
        coverTransitionName="cover-p01"
        titleTransitionName="title-p01"
      >
        Read with keyboard
      </PostTransitionLink>,
    )

    fireEvent.click(screen.getByRole('link', { name: 'Read with keyboard' }))

    expect(
      document.documentElement.style.getPropertyValue(
        '--post-cover-transition-name',
      ),
    ).toBe('')
    expect(
      document.documentElement.style.getPropertyValue(
        '--post-title-transition-name',
      ),
    ).toBe('')
  })

  it.each([
    ['Command-click', { metaKey: true }],
    ['Control-click', { ctrlKey: true }],
    ['Shift-click', { shiftKey: true }],
    ['Alt-click', { altKey: true }],
    ['middle-click', { button: 1 }],
  ] satisfies Array<[string, MouseEventInit]>)(
    'leaves %s native when Next does not navigate',
    (_label, eventInit) => {
      render(
        <PostTransitionLink
          href="/blog/a-post"
          coverTransitionName="cover-p01"
          titleTransitionName="title-p01"
        >
          Open post elsewhere
        </PostTransitionLink>,
      )

      const handled = fireEvent.click(
        screen.getByRole('link', { name: 'Open post elsewhere' }),
        eventInit,
      )

      expect(
        document.documentElement.style.getPropertyValue(
          '--post-cover-transition-name',
        ),
      ).toBe('')
      expect(
        document.documentElement.style.getPropertyValue(
          '--post-title-transition-name',
        ),
      ).toBe('')
      expect(handled).toBe(true)
    },
  )
})
