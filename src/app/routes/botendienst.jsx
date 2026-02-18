import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const BotendienstPage = lazyWithRetry(() => import('../../features/botendienst/BotendienstPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/botendienst',
  component: BotendienstRoute,
})

function BotendienstRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('botendienst') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <BotendienstPage />
    </Suspense>
  )
}
