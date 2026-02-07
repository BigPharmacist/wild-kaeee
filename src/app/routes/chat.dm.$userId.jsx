import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const ChatPage = lazy(() => import('../../features/chat/ChatPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/dm/$userId',
  component: ChatDmRoute,
})

function ChatDmRoute() {
  const { userId } = Route.useParams()
  const { setActiveView, setChatTab } = useNavigation()

  useEffect(() => {
    setActiveView('chat')
    setChatTab(userId)
  }, [setActiveView, setChatTab, userId])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ChatPage directChatUserId={userId} />
    </Suspense>
  )
}
