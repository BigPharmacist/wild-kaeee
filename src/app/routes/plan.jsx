import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const PlanView = lazy(() => import('../../features/plan/PlanView'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  component: PlanRoute,
})

function PlanRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('plan') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <PlanView />
    </Suspense>
  )
}
