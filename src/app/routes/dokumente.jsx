import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const DokumentePage = lazy(() => import('../../features/dokumente/DokumentePage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dokumente',
  component: DokumenteRoute,
})

function DokumenteRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('dokumente') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <DokumentePage />
    </Suspense>
  )
}
