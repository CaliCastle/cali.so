type MdxFrontMatter = {
  title: string
  publishedAt: string
  tags: string[]
  image?: string
  summary?: string
}
type MDXComponent = {
  default: React.FC
  meta: MdxFrontMatter
}

declare module '*.mdx' {
  export default MDXComponent
  export const meta: MdxFrontMatter
}
