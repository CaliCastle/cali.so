import { clsxm } from '@zolplay/utils'

export function Prose({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={clsxm(className, 'prose dark:prose-invert')}>
      {children}
    </div>
  )
}
