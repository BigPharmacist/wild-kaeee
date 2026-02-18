import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const ApoPage = lazyWithRetry(() => import('../../features/apo/ApoPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/apo',
  component: ApoRoute,
})

function ApoRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('pharma') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ApoPage />
    </Suspense>
  )
}
