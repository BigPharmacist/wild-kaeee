// Query Key Factory für Calendar
export const calendarKeys = {
  all: ['calendars'],
  lists: () => [...calendarKeys.all, 'list'],
  list: (userId) => [...calendarKeys.lists(), userId],
  details: () => [...calendarKeys.all, 'detail'],
  detail: (id) => [...calendarKeys.details(), id],
  permissions: (calendarId) => [...calendarKeys.all, 'permissions', calendarId],
}

export const eventKeys = {
  all: ['calendar-events'],
  lists: () => [...eventKeys.all, 'list'],
  list: (filters) => [...eventKeys.lists(), filters],
  dashboard: () => [...eventKeys.all, 'dashboard'],
  details: () => [...eventKeys.all, 'detail'],
  detail: (id) => [...eventKeys.details(), id],
}
