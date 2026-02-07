import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { useNavigation, useTheme, useStaff, useAuth } from '../../context'
import { Route as rootRoute } from './__root'

const CalendarPage = lazy(() => import('../../features/calendar/CalendarPage'))
const NotdienstplanungView = lazy(() => import('../../features/calendar/NotdienstplanungView'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarRoute,
})

function CalendarRoute() {
  const { setActiveView, secondaryTab } = useNavigation()
  const { theme } = useTheme()
  const { staff } = useStaff()
  const { session } = useAuth()

  useEffect(() => {
    setActiveView('calendar')
  }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      {secondaryTab === 'notdienstplanung' ? (
        <NotdienstplanungView theme={theme} staff={staff} session={session} />
      ) : (
        <CalendarPage />
      )}
    </Suspense>
  )
}
