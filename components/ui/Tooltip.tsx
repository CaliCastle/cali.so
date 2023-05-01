'use client'

import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { clsxm } from '@zolplay/utils'
import * as React from 'react'

const TooltipProvider = TooltipPrimitive.Provider

const TooltipRoot = TooltipPrimitive.Root

const TooltipTrigger = TooltipPrimitive.Trigger

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
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Provider: TooltipProvider,
} as const
