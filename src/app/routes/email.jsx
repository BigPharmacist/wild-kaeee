import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'

const EmailPage = lazy(() => import('../../features/email/EmailPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/email',
  component: EmailRoute,
})

function EmailRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <EmailPage />
    </Suspense>
  )
}
