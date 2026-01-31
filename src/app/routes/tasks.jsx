import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { LoadingSpinner } from '../../shared/ui'
import { Route as rootRoute } from './__root'

const TasksPage = lazy(() => import('../../features/tasks/TasksPage'))

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
