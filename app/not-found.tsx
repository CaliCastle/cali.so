'use client'

import Spline from '@splinetool/react-spline'
import { motion } from 'framer-motion'
import Link from 'next/link'

import { url } from '~/lib'

export default function NotFoundPage() {
  return (
    <main className="h-screen">
      <div className="absolute inset-0 h-full w-full">
        <Spline scene={url('macbook.splinecode').href} />
      </div>

      <div className="pointer-events-none absolute inset-0 flex h-full w-full flex-col items-center justify-center">
        <motion.h1
          className="pointer-events-none select-none text-[35vmin] font-bold text-white mix-blend-overlay"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          404
        </motion.h1>
        <Link
          href="/"
          className="pointer-events-auto select-none text-xl font-bold text-white mix-blend-difference hover:underline"
        >
          返回主页
        </Link>
      </div>
    </main>
  )
}
