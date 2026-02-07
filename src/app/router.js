import { createRouter } from '@tanstack/react-router'
import { Route as rootRoute } from './routes/__root'
import { Route as indexRoute } from './routes/index'
import { Route as tasksRoute } from './routes/tasks'
import { Route as calendarRoute } from './routes/calendar'
import { Route as calendarNotdienstRoute } from './routes/calendar.notdienst'
import { Route as contactsRoute } from './routes/contacts'
import { Route as chatGroupRoute } from './routes/chat.group'
import { Route as chatDmRoute } from './routes/chat.dm.$userId'
import { Route as emailRoute } from './routes/email'
import { Route as emailAccountRoute } from './routes/email.$accountId'
import { Route as planRoute } from './routes/plan'
import { Route as scanRoute } from './routes/scan'
import { Route as botendienstRoute } from './routes/botendienst'
import { Route as dokumenteRoute } from './routes/dokumente'
import { Route as rechnungenRoute } from './routes/rechnungen'
import { Route as archivRoute } from './routes/archiv'
import { Route as apoRoute } from './routes/apo'
import { Route as postRoute } from './routes/post'
import { Route as miscRoute } from './routes/misc'
import { Route as settingsRoute } from './routes/settings'

const routeTree = rootRoute.addChildren([
  indexRoute,
  tasksRoute,
  calendarRoute,
  calendarNotdienstRoute,
  contactsRoute,
  chatGroupRoute,
  chatDmRoute,
  emailRoute,
  emailAccountRoute,
  planRoute,
  scanRoute,
  botendienstRoute,
  dokumenteRoute,
  rechnungenRoute,
  archivRoute,
  apoRoute,
  postRoute,
  miscRoute,
  settingsRoute,
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
