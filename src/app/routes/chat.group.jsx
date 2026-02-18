import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { useNavigation } from '../../context'
import { Route as rootRoute } from './__root'

const ChatPage = lazyWithRetry(() => import('../../features/chat/ChatPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/chat/group',
  component: ChatGroupRoute,
})

function ChatGroupRoute() {
  const { setActiveView, setChatTab } = useNavigation()

  useEffect(() => {
    setActiveView('chat')
    setChatTab('group')
  }, [setActiveView, setChatTab])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <ChatPage directChatUserId={null} />
    </Suspense>
  )
}
