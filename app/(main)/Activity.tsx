'use client'

import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'
import { useQuery } from 'react-query'

import { Tooltip } from '~/components/ui/Tooltip'

const appLabels: { [app: string]: string } = {
  slack: 'Slack',
  arc: 'Arc',
  craft: 'Craft',
  tower: 'Tower',
  vscode: 'VS Code',
  webstorm: 'WebStorm',
  linear: 'Linear',
  figma: 'Figma',
  telegram: 'Telegram',
  wechat: '微信',
  discord: 'Discord',
  cron: 'Cron',
  mail: '邮件',
  safari: 'Safari',
  music: 'Apple Music',
  finder: '访达',
  messages: '信息',
  live: 'Ableton Live',
  screenflow: 'ScreenFlow',
  resolve: 'DaVinci Resolve',
}
export function Activity() {
  const { data } = useQuery<{ app: string }>(
    'activity',
    () => fetch('/api/activity').then((res) => res.json()),
    {
      refetchInterval: 5000,
      enabled:
        typeof window === 'undefined'
          ? false
          : new URL(window.location.href).hostname === 'cali.so',
    }
  )
  const [open, setOpen] = React.useState(false)

  if (!data) {
    return null
  }

  const { app } = data

  return (
    <Tooltip.Provider disableHoverableContent>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>
          <div className="pointer-events-auto relative flex items-center">
            <motion.div
              className="absolute left-1 top-1 h-6 w-6 select-none rounded-[6px] bg-zinc-500/10 dark:bg-zinc-200/10"
              animate={{ opacity: [0, 0.65, 0], scale: [1, 1.4, 1] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
              }}
            />
            <Image
              width={32}
              height={32}
              src={`/apps/${app}.png`}
              alt={app}
              priority
              fetchPriority="high"
              unoptimized
              className="pointer-events-none select-none"
            />
          </div>
        </Tooltip.Trigger>
        <AnimatePresence>
          {open && (
            <Tooltip.Portal forceMount>
              <Tooltip.Content asChild>
                <motion.div
                    className="mt-1"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  Cali 在使用 {appLabels[app] ?? app}
                </motion.div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </AnimatePresence>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
