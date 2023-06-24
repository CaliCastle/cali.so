'use client'

import { clsxm } from '@zolplay/utils'
import { motion, useScroll, type Variants } from 'framer-motion'
import React from 'react'

interface HeadingNode {
  _type: 'span'
  text: string
  _key: string
}

interface Node {
  _type: 'block'
  style: 'h1' | 'h2' | 'h3' | 'h4'
  _key: string
  children?: HeadingNode[]
}

const parseOutline = (nodes: Node[]) => {
  return nodes
    .filter((node) => node._type === 'block' && node.style.startsWith('h'))
    .map((node) => {
      return {
        style: node.style,
        text:
          node.children?.[0] !== undefined ? node.children[0].text ?? '' : '',
        id: node._key,
      }
    })
}

const listVariants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      when: 'beforeChildren',
      staggerChildren: 0.08,
      delay: 0.255,
      type: 'spring',
      stiffness: 150,
      damping: 20,
    },
  },
} satisfies Variants
const itemVariants = {
  hidden: {
    opacity: 0,
    y: 5,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
  },
} satisfies Variants

export function BlogPostTableOfContents({ headings }: { headings: Node[] }) {
  const outline = parseOutline(headings)
  const { scrollY } = useScroll()
  const [highlightedHeadingId, setHighlightedHeadingId] = React.useState<
    string | null
  >(null)

  React.useEffect(() => {
    const handleScroll = () => {
      const articleElement = document.querySelector<HTMLElement>(
        'article[data-postid]'
      )
      const outlineYs = outline.map((node) => {
        const el = document.querySelector<HTMLAnchorElement>(
          `article ${node.style}:where([id="${node.id}"]) > a`
        )
        if (!el) return 0

        return el.getBoundingClientRect().top
      })

      if (articleElement) {
        if (scrollY.get() > articleElement.scrollHeight) {
          setHighlightedHeadingId(null)
        } else {
          const idx = outlineYs.findIndex((y) => y > 0)
          if (idx === -1) {
            setHighlightedHeadingId(outline[outline.length - 1]?.id ?? null)
          } else {
            setHighlightedHeadingId(outline[idx]?.id ?? null)
          }
        }
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [outline, scrollY])

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      variants={listVariants}
      className="group pointer-events-auto flex flex-col space-y-2 text-zinc-500"
    >
      {outline.map((node) => (
        <motion.li
          key={node.id}
          variants={itemVariants}
          className={clsxm(
            'text-[12px] font-medium leading-[18px] transition-colors duration-300',
            node.style === 'h3' && 'ml-1',
            node.style === 'h4' && 'ml-2',
            node.id === highlightedHeadingId
              ? 'text-zinc-900 dark:text-zinc-200'
              : 'hover:text-zinc-700 dark:hover:text-zinc-400 group-hover:[&:not(:hover)]:text-zinc-400 dark:group-hover:[&:not(:hover)]:text-zinc-600'
          )}
          aria-label={node.id === highlightedHeadingId ? '当前位置' : undefined}
        >
          <a href={`#${node.id}`} className="block w-full">
            {node.text}
          </a>
        </motion.li>
      ))}
    </motion.ul>
  )
}
