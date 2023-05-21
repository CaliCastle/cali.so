'use client'

import { QueryClient, QueryClientProvider } from 'react-query'

const queryClient = new QueryClient()

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}
