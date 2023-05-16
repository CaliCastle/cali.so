import { type IconProps } from '~/assets'

export function ScriptIcon(props: IconProps = {}) {
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
        d="M9 11L11 9L9 7M14 11H16M5 15.1707V9.4C5 7.15979 5 6.03969 5.43597 5.18404C5.81947 4.43139 6.43139 3.81947 7.18404 3.43597C8.03968 3 9.15979 3 11.4 3H13.6C15.8402 3 16.9603 3 17.816 3.43597C18.5686 3.81947 19.1805 4.43139 19.564 5.18404C20 6.03969 20 7.15979 20 9.4V14.6C20 16.8402 20 17.9603 19.564 18.816C19.1805 19.5686 18.5686 20.1805 17.816 20.564C16.9603 21 15.8402 21 13.6 21H6C4.34315 21 3 19.6569 3 18C3 16.3431 4.34315 15 6 15H16C14.3431 15 13 16.3431 13 18C13 19.6569 14.3431 21 16 21"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
