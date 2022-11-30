import Head from 'next/head'
import dayjs from 'dayjs'
import { allPosts, Post } from 'contentlayer/generated'
import Link from 'next/link'

export async function getStaticProps() {
  const posts = allPosts.sort((a, b) => {
    return dayjs(b.date).diff(dayjs(a.date))
  })
  return { props: { posts } }
}

function PostCard(post: Post) {
  return (
    <div className="mb-6">
      {/* <Image
        src={post.image}
        alt="post.title"
        width={1870}
        height={1250}
        unoptimized
      /> */}
      <time dateTime={post.date} className="block text-sm text-slate-600">
        {dayjs(post.date).format('MMMM D, YYYY')} | {post.readingTime.text}
      </time>
      <h2 className="text-lg">
        <Link href={post.url} className="text-blue-700 hover:text-blue-900">
          {post.title}
        </Link>
      </h2>
    </div>
  )
}

export default function Home({ posts }: { posts: Post[] }) {
  return (
    <div className="mx-auto max-w-2xl py-16 text-center">
      <Head>
        <title>Blog posts</title>
      </Head>

      <h1 className="mb-8 text-3xl font-bold">Blog posts</h1>

      {posts.map((post, idx) => (
        <PostCard key={idx} {...post} />
      ))}
    </div>
  )
}
