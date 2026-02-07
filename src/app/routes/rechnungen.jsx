import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const RechnungenPage = lazy(() => import('../../features/rechnungen/RechnungenPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/rechnungen',
  component: RechnungenRoute,
})

function RechnungenRoute() {
  const { setActiveView, setDokumenteTab } = useNavigation()
  useEffect(() => {
    setActiveView('dokumente')
    setDokumenteTab('rechnungen')
  }, [setActiveView, setDokumenteTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <RechnungenPage />
    </Suspense>
  )
}
