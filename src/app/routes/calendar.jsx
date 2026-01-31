import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'

const CalendarPage = lazy(() => import('../../features/calendar/CalendarPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/calendar',
  component: CalendarRoute,
})

function CalendarRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <CalendarPage />
    </Suspense>
  )
}
