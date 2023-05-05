import type React from 'react'

declare global {
  namespace JSX {
    type ElementType =
      | keyof JSX.IntrinsicElements
      | ((props: any) => Promise<React.ReactNode> | React.ReactNode)
  }
}

type NewsletterFormData = {
  email: string
}
