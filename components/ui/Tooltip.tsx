'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { clsxm } from '@zolplay/utils'
import { AnimatePresence, motion } from 'framer-motion'
import * as React from 'react'

const { Provider, Root, Trigger, Portal } = TooltipPrimitive

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={clsxm(
      'z-50 overflow-hidden rounded-md bg-gradient-to-b from-zinc-50/50 to-white/95 px-3 py-1.5 text-xs font-medium text-zinc-900 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur transition dark:from-zinc-900/50 dark:to-zinc-800/95 dark:text-zinc-200 dark:ring-white/10',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName

export const Tooltip = {
  Root,
  Trigger,
  Content: TooltipContent,
  Provider,
  Portal,
} as const

type ElegantTooltipProps = {
  children: React.ReactNode
  content: React.ReactNode
}
export function ElegantTooltip({ children, content }: ElegantTooltipProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Tooltip.Provider disableHoverableContent delayDuration={0.2}>
      <Tooltip.Root open={open} onOpenChange={setOpen}>
        <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
        <AnimatePresence>
          {open && (
            <Tooltip.Portal forceMount>
              <Tooltip.Content asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {content}
                </motion.div>
              </Tooltip.Content>
            </Tooltip.Portal>
          )}
        </AnimatePresence>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}
