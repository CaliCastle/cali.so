// 'use client'
//
// import { Portal } from '@headlessui/react'
// import { clsxm } from '@zolplay/utils'
// import { AnimatePresence, motion } from 'framer-motion'
// import { useAtom } from 'jotai/index'
// import { atomWithStorage } from 'jotai/utils'
// import React, { Fragment } from 'react'
// import Balancer from 'react-wrap-balancer'
//
// import { CloudIcon, CursorClickIcon, CursorIcon, UFOIcon } from '~/assets'
// import { Tooltip } from '~/components/ui/Tooltip'
// import { usePresenceStore } from '~/lib/store'
//
// const enabledMultiplayerAtom = atomWithStorage(
//   '__cali_so.enabled_multiplayer',
//   false
// )
//
// export function Multiplayer() {
//   const [enabledMultiplayer, setEnabledMultiplayer] = useAtom(
//     enabledMultiplayerAtom
//   )
//   const {
//     liveblocks: { enterRoom, leaveRoom, connection },
//     roomId,
//   } = usePresenceStore()
//   React.useEffect(() => {
//     if (roomId && enabledMultiplayer) {
//       enterRoom(roomId)
//     }
//
//     return () => {
//       if (roomId) {
//         leaveRoom(roomId)
//       }
//     }
//   }, [enabledMultiplayer, enterRoom, leaveRoom, roomId])
//
//   const [tooltipOpen, setTooltipOpen] = React.useState(false)
//
//   return (
//     <>
//       <Tooltip.Provider disableHoverableContent>
//         <Tooltip.Root
//           open={tooltipOpen}
//           onOpenChange={setTooltipOpen}
//           delayDuration={0.1}
//         >
//           {roomId && (
//             <Tooltip.Trigger asChild>
//               <button
//                 type="button"
//                 className={clsxm(
//                   'hidden items-center justify-center rounded-lg outline-offset-2 transition active:transition-none md:inline-flex',
//                   'group rounded-full bg-gradient-to-b from-zinc-50/70 to-white/95 px-3 py-2 text-zinc-500 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md transition dark:from-zinc-900/70 dark:to-zinc-800/90 dark:text-zinc-400 dark:ring-white/10 dark:hover:ring-white/20',
//                   'pointer-events-auto h-10 w-10',
//                   connection === 'open' &&
//                     'from-zinc-50/80 to-yellow-100/80 shadow-yellow-200/40 dark:to-yellow-950/90 dark:shadow-yellow-500/20 dark:ring-yellow-500/20'
//                 )}
//                 onClick={() => setEnabledMultiplayer((prev) => !prev)}
//               >
//                 {connection === 'closed' && <CursorIcon />}
//                 {connection === 'open' && <CursorClickIcon />}
//                 {connection === 'connecting' && <CloudIcon />}
//                 {connection === 'failed' && <UFOIcon />}
//               </button>
//             </Tooltip.Trigger>
//           )}
//           <AnimatePresence>
//             {tooltipOpen && (
//               <Tooltip.Portal forceMount>
//                 <Tooltip.Content asChild>
//                   <motion.div
//                     initial={{ opacity: 0, scale: 0.96 }}
//                     animate={{ opacity: 1, scale: 1 }}
//                     exit={{ opacity: 0, scale: 0.95 }}
//                   >
//                     <Balancer>
//                       {connection === 'open' && '已显示多人光标'}
//                       {connection === 'closed' && '点击显示多人光标'}
//                       {connection === 'connecting' && '连接中...'}
//                       {connection === 'failed' && '连接失败'}
//                     </Balancer>
//                   </motion.div>
//                 </Tooltip.Content>
//               </Tooltip.Portal>
//             )}
//           </AnimatePresence>
//         </Tooltip.Root>
//       </Tooltip.Provider>
//
//       {enabledMultiplayer && <Cursors />}
//     </>
//   )
// }
//
// function useLiveCursors() {
//   const setCursor = usePresenceStore((state) => state.setCursor)
//
//   React.useEffect(() => {
//     const scroll = {
//       x: window.scrollX,
//       y: window.scrollY,
//     }
//
//     let lastPosition: { x: number; y: number } | null = null
//
//     function transformPosition(
//       cursor: { x: number; y: number },
//       down?: boolean
//     ) {
//       return {
//         x: cursor.x / window.innerWidth,
//         y: cursor.y,
//         isDown: down,
//       }
//     }
//
//     function onPointerMove(event: PointerEvent) {
//       const position = {
//         x: event.pageX,
//         y: event.pageY,
//       }
//       lastPosition = position
//       setCursor(transformPosition(position))
//     }
//
//     function onPointerLeave() {
//       lastPosition = null
//       setCursor(null)
//     }
//
//     function onPointerDown(event: PointerEvent) {
//       const position = {
//         x: event.pageX,
//         y: event.pageY,
//       }
//       lastPosition = position
//       setCursor(transformPosition(position, true))
//     }
//
//     function onPointerUp() {
//       if (lastPosition) {
//         setCursor(transformPosition(lastPosition))
//       }
//     }
//
//     function onDocumentScroll() {
//       if (lastPosition) {
//         const offsetX = window.scrollX - scroll.x
//         const offsetY = window.scrollY - scroll.y
//         const position = {
//           x: lastPosition.x + offsetX,
//           y: lastPosition.y + offsetY,
//         }
//         lastPosition = position
//         setCursor(transformPosition(position))
//       }
//       scroll.x = window.scrollX
//       scroll.y = window.scrollY
//     }
//
//     document.addEventListener('scroll', onDocumentScroll)
//     document.addEventListener('pointermove', onPointerMove)
//     document.addEventListener('pointerleave', onPointerLeave)
//     document.addEventListener('pointerdown', onPointerDown)
//     document.addEventListener('pointerup', onPointerUp)
//
//     return () => {
//       document.removeEventListener('scroll', onDocumentScroll)
//       document.removeEventListener('pointermove', onPointerMove)
//       document.removeEventListener('pointerleave', onPointerLeave)
//       document.removeEventListener('pointerdown', onPointerDown)
//       document.removeEventListener('pointerup', onPointerUp)
//     }
//   }, [setCursor])
//
//   const others = usePresenceStore((state) => state.liveblocks.others)
//
//   const cursors = []
//
//   for (const { connectionId, presence } of others) {
//     if (presence.cursor) {
//       const { x, y, isDown } = presence.cursor as {
//         x: number
//         y: number
//         isDown?: boolean
//       }
//       cursors.push({
//         x: x * window.innerWidth,
//         y,
//         isDown,
//         connectionId,
//       })
//     }
//   }
//
//   return cursors
// }
//
// const COLORS = [
//   '#64748b',
//   '#ef4444',
//   '#f97316',
//   '#f59e0b',
//   '#eab308',
//   '#84cc16',
//   '#22c55e',
//   '#10b981',
//   '#14b8a6',
//   '#06b6d4',
//   '#0ea5e9',
//   '#3b82f6',
//   '#6366f1',
//   '#8b5cf6',
//   '#a855f7',
//   '#d946ef',
//   '#ec4899',
//   '#f43f5e',
// ]
// function Cursors() {
//   const cursors = useLiveCursors()
//
//   return (
//     <Portal as={Fragment}>
//       {cursors.map(({ x, y, isDown, connectionId }) => (
//         <Cursor
//           key={connectionId}
//           color={COLORS[connectionId % COLORS.length]!}
//           x={x}
//           y={y}
//           isDown={isDown}
//         />
//       ))}
//     </Portal>
//   )
// }
//
// type CursorProps = {
//   color: string
//   x: number
//   y: number
//   isDown?: boolean
// }
//
// function Cursor({ color, x, y, isDown }: CursorProps) {
//   return (
//     <>
//       <motion.span
//         className="pointer-events-none absolute left-0 top-0 flex select-none rounded-full opacity-60 will-change-transform"
//         animate={{
//           x,
//           y,
//         }}
//         transition={{
//           type: 'spring',
//           stiffness: 500,
//           damping: 30,
//           duration: 0.1,
//         }}
//       >
//         <span className="absolute left-0 top-0 block h-40 w-40 origin-center -translate-x-[calc(50%-6px)] -translate-y-[calc(50%-6px)] transform-gpu bg-[radial-gradient(50%_50%_at_50%_50%,rgba(25,25,25,0.05)_0%,rgba(25,25,25,0)_100%)] dark:bg-[radial-gradient(50%_50%_at_50%_50%,rgba(222,222,222,0.04)_0%,rgba(222,222,222,0)_100%)]" />
//         <AnimatePresence>
//           {isDown && (
//             <motion.span
//               className="absolute h-2 w-2 rounded-full"
//               style={{ backgroundColor: color }}
//               initial={{ scale: 1, opacity: 0 }}
//               animate={{
//                 scale: 2,
//                 opacity: 0.5,
//                 transition: { duration: 0.1 },
//               }}
//               exit={{ scale: 1, opacity: 0 }}
//             />
//           )}
//         </AnimatePresence>
//         <CursorIcon
//           className="block h-4 w-4"
//           style={{
//             color,
//           }}
//         />
//       </motion.span>
//     </>
//   )
// }
