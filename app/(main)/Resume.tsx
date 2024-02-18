import Image, { type StaticImageData } from 'next/image'
import React from 'react'

import { BriefcaseIcon } from '~/assets'
import DifyLogo from '~/assets/company/dify-logo.png'
import MiraclePlusLogo from '~/assets/company/MiraclePlusLogo.jpg'
import ImperialLogo from '~/assets/company/Shield_of_Imperial_College_London.svg'

type Resume = {
  company: string
  title: string
  start: string | { label: string; dateTime: number }
  end: string | { label: string; dateTime: number }
  logo: StaticImageData
}
const resume: Resume[] = [
  {
    company: '帝国理工学院 物理',
    title: '学生',
    logo: ImperialLogo,
    start: '2022',
    end: '2026',
    // end: {
    //   label: '2026',
    //   dateTime: new Date().getFullYear(),
    // },
  },
  {
    company: '奇绩创坛',
    title: '数据分析实习生',
    logo: MiraclePlusLogo,
    start: '2023年7月',
    end: '2023年9月',
  },
  {
    company: 'Dify.AI',
    title: '开发者关系',
    logo: DifyLogo,
    start: '2024年1月',
    end: '至今',
  },
]

function getRoleDate(date: Resume['start'] | Resume['end'], label = true) {
  if (typeof date === 'string') {
    return date
  }

  if (label) {
    return date.label
  } else {
    return String(date.dateTime)
  }
}

export function Resume() {
  return (
    <div className="rounded-2xl border border-zinc-100 p-6 dark:border-zinc-700/40">
      <h2 className="flex items-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        <BriefcaseIcon className="h-5 w-5 flex-none" />
        <span className="ml-2">工作经历</span>
      </h2>
      <ol className="mt-6 space-y-4">
        {resume.map((role, roleIndex) => (
          <li key={roleIndex} className="flex gap-4">
            <div className="relative mt-1 flex h-10 w-10 flex-none items-center justify-center rounded-full shadow-md shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0">
              <Image
                src={role.logo}
                alt={role.company}
                className="h-8 w-8 rounded-full"
                unoptimized
              />
            </div>
            <dl className="flex flex-auto flex-wrap gap-x-2">
              <dt className="sr-only">公司</dt>
              <dd className="w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {role.company}
              </dd>
              <dt className="sr-only">职位</dt>
              <dd className="text-xs text-zinc-500 dark:text-zinc-400">
                {role.title}
              </dd>
              <dt className="sr-only">日期</dt>
              <dd
                className="ml-auto text-xs text-zinc-500/80 dark:text-zinc-400/80"
                aria-label={`${getRoleDate(role.start)} 到 ${getRoleDate(
                  role.end
                )}`}
              >
                <time dateTime={getRoleDate(role.start, false)}>
                  {getRoleDate(role.start)}
                </time>{' '}
                <span aria-hidden="true">—</span>{' '}
                <time dateTime={getRoleDate(role.end, false)}>
                  {getRoleDate(role.end)}
                </time>
              </dd>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  )
}
