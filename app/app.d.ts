/* eslint-disable @typescript-eslint/no-explicit-any */
import { type Component, type ReactNode } from 'react'

type ReactJSXElementConstructor<Props> =
  | ((props: Props) => ReactNode | Promise<ReactNode>)
  | (new (props: Props) => Component<Props, any>)

declare global {
  namespace React.JSX {
    type ElementType = string | ReactJSXElementConstructor<any>
  }
}
