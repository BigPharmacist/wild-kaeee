import { createRoute, Navigate } from '@tanstack/react-router'
import { Suspense, useEffect } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { lazyWithRetry } from '../../lib/lazyWithRetry'
import { useNavigation, useStaff } from '../../context'
import { Route as rootRoute } from './__root'

const TasksPage = lazyWithRetry(() => import('../../features/tasks/TasksPage'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tasks',
  component: TasksRoute,
  validateSearch: (search) => ({
    project: search.project || null,
    priority: search.priority || null,
    assignee: search.assignee || null,
    due: search.due || null,
    completed: search.completed === 'true',
  }),
})

function TasksRoute() {
  const { project, priority, assignee, due, completed } = Route.useSearch()
  const { setActiveView } = useNavigation()
  const { currentStaff } = useStaff()

  useEffect(() => {
    setActiveView('tasks')
  }, [setActiveView])

  if (!currentStaff?.is_admin) {
    return <Navigate to="/" />
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><LoadingSpinner /></div>}>
      <TasksPage
        initialFilters={{
          projectId: project,
          priority,
          assignee,
          due,
          showCompleted: completed,
        }}
      />
    </Suspense>
  )
}
