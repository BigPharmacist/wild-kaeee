import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const ArchivPage = lazyWithRetry(() => import('../../features/archiv/ArchivPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/archiv',
  component: ArchivRoute,
})

function ArchivRoute() {
  const { setActiveView, setDokumenteTab } = useNavigation()
  useEffect(() => {
    setActiveView('dokumente')
    setDokumenteTab('archiv')
  }, [setActiveView, setDokumenteTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ArchivPage />
    </Suspense>
  )
}
