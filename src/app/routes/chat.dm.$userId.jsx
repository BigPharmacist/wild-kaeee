import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'

const ChatPage = lazy(() => import('../../features/chat/ChatPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/dm/$userId',
  component: ChatDmRoute,
})

function ChatDmRoute() {
  const { userId } = Route.useParams()

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ChatPage directChatUserId={userId} />
    </Suspense>
  )
}
