import { notFound } from 'next/navigation'

export async function loadMdx(slug: string) {
  try {
    const { default: Content, meta } = (await import(
      `~/app/posts/(content)/${slug}.mdx`
    )) as MDXComponent

    return { Content, meta }
  } catch (error) {
    console.error(error)
    notFound()
  }
}
