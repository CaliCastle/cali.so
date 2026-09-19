import 'server-only'

const phonePath = 'M6.08418 11.9158C8.23978 14.0713 11.0787 15.5432 14.2579 15.9883C14.75 16.0572 15.2109 15.726 15.3356 15.245L15.9651 12.8182C16.0879 12.3447 15.8501 11.8518 15.403 11.6532L12.5339 10.3789C12.1126 10.1918 11.618 10.3169 11.3364 10.6818L10.4574 11.8206C9.57378 11.3015 8.76398 10.6737 8.04518 9.95481C7.32618 9.23601 6.6984 8.42621 6.1794 7.54261L7.31819 6.6636C7.68309 6.3819 7.80818 5.88741 7.62108 5.46611L6.34679 2.597C6.14819 2.1499 5.65528 1.9121 5.18178 2.0349L2.75499 2.6644C2.27409 2.7892 1.94279 3.25001 2.01169 3.74211C2.45679 6.92121 3.92858 9.76021 6.08418 11.9158Z'

export function ResumeContact({ phone }: { phone?: string }) {
  return (
    <div className="resume-contact">
      <a href="mailto:hi@cali.so">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
          <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M1.75 5.64296L8.565 9.54C8.84 9.673 9.16 9.673 9.434 9.54L16.25 5.64239V5.25C16.25 4.14543 15.3546 3.25 14.25 3.25H3.75C2.64543 3.25 1.75 4.14543 1.75 5.25V5.64296Z" fill="currentColor" fillOpacity="0.3" stroke="none" />
            <path d="M1.75 5.75L8.517 9.483C8.818 9.649 9.182 9.649 9.483 9.483L16.25 5.75" />
            <path d="M3.75 14.75L14.25 14.75C15.3546 14.75 16.25 13.8546 16.25 12.75V5.25C16.25 4.14543 15.3546 3.25 14.25 3.25L3.75 3.25C2.64543 3.25 1.75 4.14543 1.75 5.25L1.75 12.75C1.75 13.8546 2.64543 14.75 3.75 14.75Z" />
          </g>
        </svg>
        <span>hi@cali.so ↗</span>
      </a>
      {phone && (
        <a href={`tel:${phone.replace(/[ -]/g, '')}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true" focusable="false">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" stroke="currentColor">
              <path d={phonePath} fill="currentColor" fillOpacity="0.3" stroke="none" />
              <path d={phonePath} />
            </g>
          </svg>
          <span>{phone}</span>
        </a>
      )}
      <a href="https://github.com/CaliCastle" rel="noreferrer">GitHub ↗</a>
      <a href="https://beta.zolplay.com" rel="noreferrer">Zolplay ↗</a>
    </div>
  )
}
