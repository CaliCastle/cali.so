import { type IconProps } from '~/assets'

export function EyeCloseIcon(props: IconProps = {}) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M21 3L17.2929 6.70712M3 21L6.70713 17.2929M17.2929 6.70712C15.8674 5.71248 14.0762 5 12 5C6.5 5 3 10 3 12C3 13.245 4.35633 15.6526 6.70713 17.2929M17.2929 6.70712L14.1213 9.87868M14.1213 9.87868C13.5784 9.33579 12.8284 9 12 9C10.3431 9 9 10.3431 9 12C9 12.8284 9.33579 13.5784 9.87868 14.1213M14.1213 9.87868L9.87868 14.1213M9.87868 14.1213L6.70713 17.2929M10 18.7735C10.6322 18.919 11.2999 19 12 19C17.5 19 21 14 21 12C21 11.2821 20.5491 10.1778 19.7166 9.05684M13 14.8293C13.8524 14.528 14.528 13.8524 14.8293 13"
        stroke="currentCOlor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
