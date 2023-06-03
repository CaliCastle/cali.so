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
    <div className="group relative">
      <div className="not-prose absolute z-10 hidden h-full w-full scale-[0.96] transform-gpu opacity-80 blur-2xl saturate-150 transition-transform after:absolute after:inset-0 after:block after:bg-white/50 group-hover:scale-105 dark:opacity-70 dark:after:bg-black/50 md:block">
        <Image
          width={dimensions.width}
          height={dimensions.height}
          unoptimized
          aria-hidden={true}
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
        className={clsxm('relative z-20 rounded-xl md:rounded-3xl', className)}
        {...props}
        alt={alt ?? ''}
      />
    </div>
  )
}
