export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const { default: Blog, meta } = await import(
    `../(content)/${params.slug}.mdx`
  )
  if (!Blog) {
    throw new Error(`Could not find blog post for slug: ${params.slug}`)
  }

  console.log(meta)

  return <Blog />
}
