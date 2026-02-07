import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const DashboardHomePage = lazy(() => import('../../features/dashboard/DashboardHomePage'))

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
