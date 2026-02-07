import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const BotendienstPage = lazy(() => import('../../features/botendienst/BotendienstPage'))

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
