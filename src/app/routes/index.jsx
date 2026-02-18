import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const DashboardHomePage = lazyWithRetry(() => import('../../features/dashboard/DashboardHomePage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: IndexRoute,
})

function IndexRoute() {
  const { setActiveView } = useNavigation()

  useEffect(() => {
    setActiveView('dashboard')
  }, [setActiveView])

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DashboardHomePage />
    </Suspense>
  )
}
