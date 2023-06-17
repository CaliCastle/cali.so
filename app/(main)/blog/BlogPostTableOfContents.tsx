import { clsxm } from '@zolplay/utils'

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

export function BlogPostTableOfContents({ headings }: { headings: Node[] }) {
  const outline = parseOutline(headings)

  return (
    <ul className="group pointer-events-auto flex flex-col space-y-2 text-zinc-500">
      {outline.map((node) => (
        <li
          key={node.id}
          className={clsxm(
            'text-[12px] font-medium leading-[18px] transition-[color,opacity] duration-300 will-change-[color,opacity] hover:text-zinc-900 hover:opacity-90 dark:hover:text-zinc-200 group-hover:[&:not(:hover)]:opacity-60',
            node.style === 'h3' && 'ml-1',
            node.style === 'h4' && 'ml-2'
          )}
        >
          <a href={`#${node.id}`} className="block w-full">
            {node.text}
          </a>
        </li>
      ))}
    </ul>
  )
}
