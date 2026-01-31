import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'

const ContactsPage = lazy(() => import('../../features/contacts/ContactsPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/contacts',
  component: ContactsRoute,
})

function ContactsRoute() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ContactsPage />
    </Suspense>
  )
}
