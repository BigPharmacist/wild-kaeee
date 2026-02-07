import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const MiscPage = lazy(() => import('../../features/photos/MiscPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/misc',
  component: MiscRoute,
})

function MiscRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('misc') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <MiscPage />
    </Suspense>
  )
}
