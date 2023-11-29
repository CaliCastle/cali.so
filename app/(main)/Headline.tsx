'use client'

import { motion } from 'framer-motion'
import Balancer from 'react-wrap-balancer'

// import { PeekabooLink } from '~/components/links/PeekabooLink'
import { SocialLink } from '~/components/links/SocialLink'

function Developer() {
  return (
    <span className="group">
      <span className="font-mono">&lt;</span>开发捏
      <span className="font-mono">/&gt;</span>
      <span className="invisible inline-flex text-zinc-300 before:content-['|'] group-hover:visible group-hover:animate-typing dark:text-zinc-500" />
    </span>
  ) 
}

function Physicist() {
  return (
    <span>
      臭学物理的
    </span>  
  )
}

function Dreamer() {
  return (
    <span className="group">
      <span>空想家（未来的创始人）</span>
    </span>
  )
}

// <SparkleIcon className="mr-1 inline-flex transform-gpu transition-transform duration-500 group-hover:rotate-180" /> 

/* function Founder() {
  return (
    <span className="group">
      <UserSecurityIcon className="mr-1 inline-flex group-hover:fill-zinc-600/20 dark:group-hover:fill-zinc-200/20" />
      <span>创始人</span>
    </span>
  )
} */

export function Headline() {
  return (
    <div className="max-w-2xl">
      <motion.h1
        className="text-4xl font-bold tracking-tight text-zinc-800 dark:text-zinc-100 sm:text-5xl"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          damping: 25,
          stiffness: 100,
          duration: 0.3,
        }}
      >
        <Developer />，<Physicist />，
        <br />
        <Dreamer />
      </motion.h1>
      <motion.p
        className="mt-6 text-base text-zinc-600 dark:text-zinc-400"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          damping: 30,
          stiffness: 85,
          duration: 0.3,
          delay: 0.1,
        }}
      >
        <Balancer>
          我是孙霄逸，你也可以叫我✨马克✨。之前一直很烦恼怎么向别人展示自己，个人网站就挺好的。我会在这里分享我的一些想法和作品。如果你想了解更多关于我的信息，可以四处看看，探索一下。
        </Balancer>
      </motion.p>
      <motion.div
        className="mt-6 flex gap-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          type: 'spring',
          damping: 50,
          stiffness: 90,
          duration: 0.35,
          delay: 0.25,
        }}
      >
        <SocialLink
          href="https://marksun.co.uk/twitter"
          aria-label="我的推特"
          platform="twitter"
        />
        {/* <SocialLink
          href="https://cali.so/youtube"
          aria-label="我的 YouTube"
          platform="youtube"
        /> */}
        <SocialLink
          href="https://marksun.co.uk/bilibili"
          aria-label="我的 Bilibili"
          platform="bilibili"
        />
        <SocialLink
          href="https://marksun.co.uk/github"
          aria-label="我的 GitHub"
          platform="github"
        />
        <SocialLink
          href="https://marksun.co.uk/tg"
          aria-label="我的 Telegram"
          platform="telegram"
        />
        {/* <SocialLink href="/feed.xml" platform="rss" aria-label="RSS 订阅" /> */}
        <SocialLink
          href="mailto:sxy.hj156@gmail.com"
          aria-label="我的邮箱"
          platform="mail"
        />
      </motion.div>
    </div>
  )
}
