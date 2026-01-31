import { createRoute } from '@tanstack/react-router'
import App from '../../App'
import { Route as rootRoute } from './__root'

// Catch-all Route: Alle Pfade rendern App.jsx
// Dies ermöglicht die schrittweise Migration einzelner Routes
export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '$',
  component: App,
})
