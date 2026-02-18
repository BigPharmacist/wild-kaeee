import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const CalendarPage = lazyWithRetry(() => import('../../features/calendar/CalendarPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarRoute,
})

function CalendarRoute() {
  const { setActiveView, setPlanungTab } = useNavigation()

  useEffect(() => {
    setActiveView('planung')
    setPlanungTab('calendar')
  }, [setActiveView, setPlanungTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <CalendarPage />
    </Suspense>
  )
}
