import { createRootRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'

const AuthenticatedLayout = lazy(() => import('../../features/dashboard/AuthenticatedLayout'))

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><LoadingSpinner /></div>}>
      <AuthenticatedLayout />
    </Suspense>
  )
}
