import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const MiscPage = lazyWithRetry(() => import('../../features/photos/MiscPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/misc',
  component: MiscRoute,
})

function MiscRoute() {
  const { setActiveView, secondaryTab, setSecondaryTab } = useNavigation()
  useEffect(() => {
    setActiveView('misc')
    // If navigating to /misc with scan tab selected, reset to ocr (scan has its own route)
    if (secondaryTab === 'scan') setSecondaryTab('ocr')
  }, [setActiveView]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <MiscPage />
    </Suspense>
  )
}
