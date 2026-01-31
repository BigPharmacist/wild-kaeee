import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as tasksRoute } from './routes/tasks'
import { Route as calendarRoute } from './routes/calendar'
import { Route as calendarNotdienstRoute } from './routes/calendar.notdienst'
import { Route as contactsRoute } from './routes/contacts'
import { Route as catchAllRoute } from './routes/$'

// Build route tree: calendar has notdienst as child
const calendarRouteWithChildren = calendarRoute.addChildren([calendarNotdienstRoute])

const routeTree = rootRoute.addChildren([
  indexRoute,
  tasksRoute,
  calendarRouteWithChildren,
  contactsRoute,
  catchAllRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
