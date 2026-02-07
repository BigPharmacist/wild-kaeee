import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const ScanPage = lazy(() => import('../../features/scan/ScanPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/scan',
  component: ScanRoute,
})

function ScanRoute() {
  const { setActiveView, setSecondaryTab } = useNavigation()
  useEffect(() => {
    setActiveView('misc')
    setSecondaryTab('scan')
  }, [setActiveView, setSecondaryTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ScanPage />
    </Suspense>
  )
}
