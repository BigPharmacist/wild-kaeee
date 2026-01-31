import { createRoute } from '@tanstack/react-router'
import App from '../../App'
import { Route as rootRoute } from './__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: App,
})
