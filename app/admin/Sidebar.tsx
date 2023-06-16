'use client'

import { clsxm } from '@zolplay/utils'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
  DashboardIcon,
  HomeIcon,
  NewCommentIcon,
  SubscriberIcon,
  TiltedSendIcon,
} from '~/assets'

import logo from './../apple-icon.png'

const navigation = [
  { name: '仪表盘', href: '', icon: DashboardIcon },
  { name: '评论', href: '/comments', icon: NewCommentIcon },
  { name: '订阅', href: '/subscribers', icon: SubscriberIcon },
  { name: 'Newsletters', href: '/newsletters', icon: TiltedSendIcon },
]

export function Sidebar() {
  const pathname = usePathname()
  function isActive(href: string) {
    return pathname === `/admin${href}`
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
      {/* Sidebar component, swap this element with another sidebar if you like */}
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 shrink-0 items-center">
          <Image className="h-8 w-auto" src={logo} alt="" />
        </div>
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className="-mx-2 space-y-1">
                {navigation.map((item) => (
                  <li key={item.name}>
                    <Link
                      prefetch={false}
                      href={`/admin${item.href}`}
                      className={clsxm(
                        isActive(item.href)
                          ? 'bg-gray-50 text-indigo-600 dark:bg-slate-800 dark:text-white'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white',
                        'group flex items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                      )}
                    >
                      <item.icon
                        className={clsxm(
                          isActive(item.href)
                            ? 'text-indigo-600 dark:text-slate-300'
                            : 'text-gray-400 group-hover:text-indigo-600 dark:text-slate-600 dark:group-hover:text-slate-300',
                          'h-5 w-5 shrink-0'
                        )}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </li>

            <li className="-mx-6 mt-auto">
              <Link
                href="/"
                className="flex items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900 hover:bg-gray-50 dark:text-slate-50 dark:hover:bg-slate-800"
              >
                <HomeIcon className="h-5 w-5" aria-hidden="true" />
                返回前台
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
}
