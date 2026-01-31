import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { useTheme, useStaff, useAuth } from '../../context'
import { Route as calendarRoute } from './calendar'

const NotdienstplanungView = lazy(() => import('../../features/calendar/NotdienstplanungView'))

export const Route = createRoute({
  getParentRoute: () => calendarRoute,
  path: 'notdienst',
  component: NotdienstRoute,
})

function NotdienstRoute() {
  const { theme } = useTheme()
  const { staff } = useStaff()
  const { session } = useAuth()

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
