import { type IconProps } from '~/assets'

export function UsersIcon(props: IconProps = {}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        d="M17 3.53516C18.1956 4.22677 19 5.51947 19 7.00004C19 8.48061 18.1956 9.77331 17 10.4649M21 20.7325C21.5978 20.3867 22 19.7403 22 19C22 17.5195 21.1956 16.2268 20 15.5352M14 7C14 9.20914 12.2091 11 10 11C7.79086 11 6 9.20914 6 7C6 4.79086 7.79086 3 10 3C12.2091 3 14 4.79086 14 7ZM6 15H14C16.2091 15 18 16.7909 18 19C18 20.1046 17.1046 21 16 21H4C2.89543 21 2 20.1046 2 19C2 16.7909 3.79086 15 6 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
