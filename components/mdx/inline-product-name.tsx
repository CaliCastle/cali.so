import { ClaudeMark } from '~/components/product-marks'

type InlineProduct = 'Codex' | 'Claude Code'

export function InlineProductName({ product }: { product: InlineProduct }) {
  return (
    <span className="inline-product-name" data-inline-product={product}>
      {product === 'Codex' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          aria-hidden
          className="inline-product-logo inline-product-logo-codex"
          src="/images/codex.svg"
          alt=""
          width={14}
          height={14}
        />
      ) : (
        <ClaudeMark className="inline-product-logo" />
      )}
      <span>{product}</span>
    </span>
  )
}
