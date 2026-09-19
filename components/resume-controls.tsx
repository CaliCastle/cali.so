'use client'

import { useEffect, useState } from 'react'

import { localize, type Locale } from '~/lib/locale-route'

export function ResumeUnlockForm({ locale, error, available }: {
  locale: Locale
  error?: string
  available: boolean
}) {
  const [visible, setVisible] = useState(false)
  const [pending, setPending] = useState(false)
  const message = error ?? (!available
    ? localize(locale, '暂时无法访问，请稍后再试。', 'Access is temporarily unavailable. Please try again later.')
    : undefined)

  useEffect(() => {
    const reset = () => setPending(false)
    window.addEventListener('pageshow', reset)
    return () => window.removeEventListener('pageshow', reset)
  }, [])

  return (
    <form action="/api/resume/unlock" method="post" className="resume-form" onSubmit={() => setPending(true)}>
      <input type="hidden" name="locale" value={locale} />
      <label htmlFor="resume-passphrase" className="text-sm font-medium">
        {localize(locale, '访问口令', 'Passphrase')}
      </label>
      <div className="resume-input-wrap">
        <input
          id="resume-passphrase"
          name="passphrase"
          type={visible ? 'text' : 'password'}
          autoComplete="current-password"
          autoCapitalize="none"
          spellCheck={false}
          required
          maxLength={256}
          disabled={!available}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? 'resume-form-message' : undefined}
        />
        <button
          type="button"
          className="resume-reveal"
          aria-label={localize(locale, '显示口令', 'Show passphrase')}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          disabled={!available}
        >
          {visible ? localize(locale, '隐藏', 'Hide') : localize(locale, '显示', 'Show')}
        </button>
      </div>
      <p id="resume-form-message" className="resume-form-message" role={error ? 'alert' : undefined}>
        {message}
      </p>
      <button type="submit" className="resume-submit" disabled={pending || !available} aria-busy={pending}>
        <span>{pending ? localize(locale, '正在打开…', 'Opening…') : localize(locale, '继续', 'Continue')}</span>
        <span aria-hidden="true">↗</span>
      </button>
    </form>
  )
}

export function ResumePrintButton({ locale }: { locale: Locale }) {
  useEffect(() => {
    // Recheck the server session when restoring a document from browser history.
    const refresh = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload()
    }
    window.addEventListener('pageshow', refresh)
    return () => window.removeEventListener('pageshow', refresh)
  }, [])

  return (
    <button type="button" className="resume-text-control" onClick={() => window.print()}>
      {localize(locale, '打印 / 存为 PDF', 'Print / save PDF')}
    </button>
  )
}
