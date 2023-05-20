import { clsxm } from '@zolplay/utils'
import Image, { type ImageProps } from 'next/image'

type BleedThroughImageProps = ImageProps & {
  dimensions: {
    width: number
    height: number
  }
  lqip?: string
}
export function BleedThroughImage({
  dimensions,
  lqip,
  className,
  alt,
  ...props
}: BleedThroughImageProps) {
  return (
    <div className="relative">
      <div className="not-prose absolute z-10 h-full w-full opacity-80 blur-2xl saturate-150 after:absolute after:inset-0 after:block after:bg-white/50 dark:opacity-70 dark:after:bg-black/50">
        <Image
          width={dimensions.width}
          height={dimensions.height}
          unoptimized
          {...props}
          alt=""
        />
      </div>
      <Image
        width={dimensions.width}
        height={dimensions.height}
        unoptimized
        placeholder={lqip ? 'blur' : 'empty'}
        blurDataURL={lqip}
        className={clsxm('relative z-20', className)}
        {...props}
        alt={alt ?? ''}
      />
    </div>
  )
}
