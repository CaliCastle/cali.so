// import { AnimatePresence, motion } from 'framer-motion'
// import Image from 'next/image'
// import React from 'react'
// import Balancer from 'react-wrap-balancer'
//
// import { Tooltip } from '~/components/ui/Tooltip'
// import { usePostStore } from '~/lib/store'
//
// const MAX_OTHERS = 7
// const MAX_AVATARS = 8
//
// const animationProps = {
//   initial: { width: 0, transformOrigin: 'left', opacity: 0 },
//   animate: { width: 'auto', height: 'auto', opacity: 1 },
//   exit: { width: 0, opacity: 0 },
//   transition: {
//     type: 'spring',
//     damping: 18,
//     mass: 1,
//     stiffness: 200,
//     restSpeed: 0.01,
//   },
// }
// export function LiveAvatars() {
//   const others = usePostStore((state) => state.liveblocks.others)
//   const hasMore = others.length > MAX_OTHERS
//   const shownOthers = hasMore ? others.slice(0, MAX_OTHERS) : others
//
//   const [tooltipOpen, setTooltipOpen] = React.useState(false)
//
//   return (
//     <Tooltip.Provider disableHoverableContent>
//       <Tooltip.Root
//         open={tooltipOpen}
//         onOpenChange={setTooltipOpen}
//         delayDuration={0.1}
//       >
//         <Tooltip.Trigger asChild>
//           <div className="pointer-events-auto flex h-10 select-none place-content-center place-items-center -space-x-2">
//             <AnimatePresence>
//               {hasMore && (
//                 <motion.div key="more" className="" {...animationProps}>
//                   <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-bold ring-2 ring-zinc-100 dark:bg-zinc-700 dark:text-zinc-200 dark:ring-zinc-900">
//                     <span className="-translate-x-px">
//                       +{others.length - MAX_OTHERS}
//                     </span>
//                   </span>
//                 </motion.div>
//               )}
//               {shownOthers.map((other) => (
//                 <motion.div
//                   key={other.connectionId}
//                   className="flex items-center justify-center"
//                   {...animationProps}
//                 >
//                   <Image
//                     src={`/avatars/avatar_${
//                       (other.connectionId % MAX_AVATARS) + 1
//                     }.png`}
//                     alt=""
//                     width={32}
//                     height={32}
//                     className="block h-8 w-8 rounded-full ring-2 ring-zinc-100 dark:ring-zinc-900"
//                     priority
//                     unoptimized
//                   />
//                 </motion.div>
//               ))}
//             </AnimatePresence>
//           </div>
//         </Tooltip.Trigger>
//         <AnimatePresence>
//           {tooltipOpen && (
//             <Tooltip.Portal forceMount>
//               <Tooltip.Content asChild>
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.96 }}
//                   animate={{ opacity: 1, scale: 1 }}
//                   exit={{ opacity: 0, scale: 0.95 }}
//                 >
//                   <Balancer>
//                     其他 <b>{others.length}</b> 个小伙伴也在阅读
//                   </Balancer>
//                 </motion.div>
//               </Tooltip.Content>
//             </Tooltip.Portal>
//           )}
//         </AnimatePresence>
//       </Tooltip.Root>
//     </Tooltip.Provider>
//   )
// }
