import type { PropsWithChildren } from 'react'

export function PhotoStack({ children }: PropsWithChildren) {
  return <figure className="post-figure photo-stack">{children}</figure>
}

export function PhotoStackFrames({ children }: PropsWithChildren) {
  return <div className="photo-stack__frames">{children}</div>
}

export function PhotoStackCaption({ children }: PropsWithChildren) {
  return <figcaption className="post-figcaption">{children}</figcaption>
}
