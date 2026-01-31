import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 Sekunden
      gcTime: 5 * 60 * 1000, // 5 Minuten (ehemals cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
