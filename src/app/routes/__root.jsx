import { createRootRoute } from '@tanstack/react-router'
import { Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'

const AuthenticatedLayout = lazyWithRetry(() => import('../../features/dashboard/AuthenticatedLayout'))

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
