export default function BlockedPage() {
  return (
    <main className="flex h-full w-full flex-col items-center justify-center bg-zinc-200 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-200">
      <h1 className="mb-4 text-4xl font-black tracking-tighter">
        我已禁止你的访问权限
      </h1>
      <span className="text-sm">
        如果你认为你不应该被禁，请联系我的邮箱{' '}
        <a href="mailto:hi@cali.so" className="font-bold underline">
          hi@cali.so
        </a>
      </span>
    </main>
  )
}

export const revalidate = 3600 // 1 hour
