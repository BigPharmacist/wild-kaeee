import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30 Sekunden
      gcTime: 5 * 60 * 1000, // 5 Minuten (ehemals cacheTime)
      retry: (failureCount, error) => {
        // Bei Netzwerkfehlern bis zu 3x versuchen
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          return failureCount < 3
        }
        // Bei anderen Fehlern nur 1x
        return failureCount < 1
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      // Bei Reconnect automatisch neu laden
      refetchOnReconnect: true,
    },
    mutations: {
      retry: (failureCount, error) => {
        // Mutationen bei Netzwerkfehlern 2x versuchen
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('NetworkError')) {
          return failureCount < 2
        }
        return false
      },
    },
  },
})
