'use client'

import React from 'react'

import { NavigationBar } from '~/components/layouts/NavigationBar'
import { Container } from '~/components/ui/Container'

export function Footer() {
  return (
    <footer className="mt-32">
      <Container.Outer>
        <div className="border-t border-zinc-100 pb-16 pt-10 dark:border-zinc-700/40">
          <Container.Inner>
            <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">
                &copy; 1995 - {new Date().getFullYear()} Cali Castle.
              </p>
              <NavigationBar.Footer />
            </div>
          </Container.Inner>
        </div>
      </Container.Outer>
    </footer>
  )
}
