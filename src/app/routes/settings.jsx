import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const SettingsPage = lazy(() => import('../../features/settings/SettingsPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsRoute,
})

function SettingsRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('settings') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <SettingsPage />
    </Suspense>
  )
}
