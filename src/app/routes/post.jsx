import { createRoute } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const PostPage = lazyWithRetry(() => import('../../features/post/PostPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/post',
  component: PostRoute,
})

function PostRoute() {
  const { setActiveView } = useNavigation()
  useEffect(() => { setActiveView('post') }, [setActiveView])

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <PostPage />
    </Suspense>
  )
}
