import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { useTheme, useStaff, useAuth, useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const NotdienstplanungView = lazy(() => import('../../features/calendar/NotdienstplanungView'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar/notdienst',
  component: NotdienstRoute,
})

function NotdienstRoute() {
  const { theme } = useTheme()
  const { staff } = useStaff()
  const { session } = useAuth()
  const { setActiveView, setPlanungTab } = useNavigation()

  useEffect(() => {
    setActiveView('planung')
    setPlanungTab('notdienstplanung')
  }, [setActiveView, setPlanungTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <NotdienstplanungView
        theme={theme}
        staff={staff}
        session={session}
      />
    </Suspense>
  )
}
