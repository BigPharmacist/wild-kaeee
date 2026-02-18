import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const PlanView = lazyWithRetry(() => import('../../features/plan/PlanView'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/plan',
  component: PlanRoute,
})

function PlanRoute() {
  const { setActiveView, setPlanungTab } = useNavigation()
  useEffect(() => {
    setActiveView('planung')
    setPlanungTab('timeline')
  }, [setActiveView, setPlanungTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <PlanView />
    </Suspense>
  )
}
