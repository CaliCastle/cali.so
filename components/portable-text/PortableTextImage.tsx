'use client'

import { type PortableTextComponentProps } from '@portabletext/react'
import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion } from 'framer-motion'
import Image from 'next/image'
import React from 'react'

import { ClientOnly } from '~/components/ClientOnly'
import { Commentable } from '~/components/Commentable'

export function PortableTextImage({
  value,
}: PortableTextComponentProps<{
  _key: string
  url: string
  dimensions: {
    width: number
    height: number
  }
  lqip?: string
}>) {
  const [isZoomed, setIsZoomed] = React.useState(false)

  return (
    <div data-blockid={value._key} className="group relative pr-3 md:pr-0">
      <ClientOnly>
        <Commentable className="z-30" blockId={value._key} />
      </ClientOnly>

      <Dialog.Root open={isZoomed} onOpenChange={setIsZoomed}>
        {isZoomed && (
          <div
            className="relative"
            style={{
              width: value.dimensions.width,
              height: value.dimensions.height,
            }}
          />
        )}

        <AnimatePresence>
          {!isZoomed && (
            <motion.div className="relative" layoutId={`image_${value._key}`}>
              <Dialog.Trigger>
                <Image
                  src={value.url}
                  width={value.dimensions.width}
                  height={value.dimensions.height}
                  placeholder={value.lqip ? 'blur' : 'empty'}
                  blurDataURL={value.lqip}
                  className="relative z-20 cursor-zoom-in rounded-xl dark:brightness-75 dark:transition-[filter] dark:hover:brightness-100 md:rounded-3xl"
                  alt=""
                  fetchPriority="high"
                />
              </Dialog.Trigger>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isZoomed && (
            <Dialog.Portal forceMount>
              <Dialog.Close className="fixed inset-0 z-50 flex h-screen w-screen cursor-zoom-out items-center justify-center">
                {/* Overlay */}
                <Dialog.Overlay asChild>
                  <motion.div
                    className="absolute inset-0 bg-black/50"
                    initial={{ opacity: 0, backdropFilter: 'blur(0)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(12px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0)' }}
                  />
                </Dialog.Overlay>

                <Dialog.Content className="w-full overflow-hidden">
                  <div className="relative flex aspect-[3/2] items-center justify-center">
                    <div className="relative flex aspect-[3/2] w-full max-w-7xl items-center">
                      <motion.div
                        layoutId={`image_${value._key}`}
                        className="absolute inset-0"
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 30,
                          duration: 0.5,
                        }}
                      >
                        <Image
                          src={value.url}
                          width={value.dimensions.width}
                          height={value.dimensions.height}
                          placeholder={value.lqip ? 'blur' : 'empty'}
                          blurDataURL={value.lqip}
                          className="mx-auto h-full overflow-hidden object-contain"
                          alt=""
                          unoptimized
                        />
                      </motion.div>
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Close>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  )
}
