// Query Key Factory für Contacts
// Ermöglicht konsistente Cache-Keys und einfache Invalidierung

export const contactKeys = {
  all: ['contacts'],
  lists: () => [...contactKeys.all, 'list'],
  list: (filters) => [...contactKeys.lists(), filters],
  details: () => [...contactKeys.all, 'detail'],
  detail: (id) => [...contactKeys.details(), id],
}
