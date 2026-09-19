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
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
          <path fillRule="evenodd" clipRule="evenodd" d="M4.25 13.25H5.25H5.75V9.75H12.25V13.25H12.75H13.75C14.855 13.25 15.75 12.355 15.75 11.25V7.25C15.75 6.145 14.855 5.25 13.75 5.25H4.25C3.145 5.25 2.25 6.145 2.25 7.25V11.25C2.25 12.355 3.145 13.25 4.25 13.25Z" fill="currentColor" fillOpacity="0.3" stroke="none" />
          <path d="M5.75 5.25V2.75C5.75 2.198 6.198 1.75 6.75 1.75H11.25C11.802 1.75 12.25 2.198 12.25 2.75V5.25" />
          <path d="M5.75 13.25H4.25C3.145 13.25 2.25 12.355 2.25 11.25V7.25C2.25 6.145 3.145 5.25 4.25 5.25H13.75C14.855 5.25 15.75 6.145 15.75 7.25V11.25C15.75 12.355 14.855 13.25 13.75 13.25H12.25" />
          <path d="M12.25 9.75V15.25C12.25 15.802 11.802 16.25 11.25 16.25H6.75C6.198 16.25 5.75 15.802 5.75 15.25V9.75H12.25Z" />
        </g>
      </svg>
      <span>{localize(locale, '打印 / 存为 PDF', 'Print / save PDF')}</span>
    </button>
  )
}
