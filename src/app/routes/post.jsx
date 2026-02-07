import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'
import { useNavigation } from '../../context'

const PostPage = lazy(() => import('../../features/post/PostPage'))

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
