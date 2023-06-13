import { type IconProps } from '~/assets'

export function SubscriberIcon(props: IconProps = {}) {
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
        d="M10 15H7C4.79086 15 3 16.7909 3 19C3 20.1046 3.89543 21 5 21H13M14 15.6662L16.3412 18.0049C17.4672 16.0359 19.0256 14.3483 20.8987 13.0692L21 13M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
