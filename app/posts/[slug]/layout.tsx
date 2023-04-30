// const PostLayout = ({ post }: { post: Post }) => {
//   useLiveReload()
//
//   return (
//     <>
//       <Head>
//         <title>{post.title}</title>
//       </Head>
//
//       <article className="mx-auto max-w-2xl py-16">
//         <div className="mb-6 text-center">
//           <Link
//             href="/"
//             className="text-center text-sm font-bold uppercase text-blue-700"
//           >
//             Home
//           </Link>
//         </div>
//         <div className="mb-6 text-center">
//           <h1 className="mb-1 text-3xl font-bold">{post.title}</h1>
//           <time dateTime={post.date} className="text-sm text-slate-600">
//             {dayjs(post.date).format('MMMM D, YYYY')}
//           </time>
//           <p>{post.readingTime.text}</p>
//         </div>
//         <Mdx {...post.body} />
//       </article>
//     </>
//   )
// }
export default function BlogPostLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <article>{children}</article>
}
