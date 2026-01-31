# Kaeee App - Langfristige Architektur-Refactoring

## Status-Übersicht

| Phase | Status | Beschreibung |
|-------|--------|--------------|
| Phase 0 | ✅ Abgeschlossen | Foundation - TanStack Query + Router installiert |
| Phase 1 | ✅ Abgeschlossen | Tasks-Feature Migration |
| Phase 2 | ✅ Abgeschlossen | PharmacyContext Split |
| Phase 3 | 🔄 In Arbeit | Weitere Features migrieren (Calendar ✅) |
| Phase 4 | ⏳ Ausstehend | Routing komplett |
| Phase 5 | ⏳ Ausstehend | App.jsx Decomposition |
| Phase 6 | ⏳ Ausstehend | Performance & Polish |

---

## Aktuelle Probleme (Ursprungszustand)

| Problem | Impact | Status |
|---------|--------|--------|
| App.jsx: 4.486 Zeilen | Jede State-Änderung löst Re-Renders aus | ⏳ |
| PharmacyContext: 59 Properties | Pharmacy + Staff vermischt | ✅ Gelöst |
| useTasks: 16 useState | Keine Trennung von Concerns | ✅ Gelöst |
| Keine URL-Navigation | Browser-History funktioniert nicht | 🔄 Teilweise |
| Kein Request-Caching | Doppelte API-Calls | 🔄 Teilweise |

---

## Phase 0: Foundation ✅

**Ziel:** Infrastruktur einrichten ohne bestehenden Code zu brechen

### Erledigt
- [x] TanStack Query installiert (`@tanstack/react-query` ^5.90.20)
- [x] TanStack Router installiert (`@tanstack/react-router` ^1.157.16)
- [x] ReactQueryDevtools installiert (`@tanstack/react-query-devtools` ^5.91.2)
- [x] QueryClientProvider in `src/lib/queryClient.js`
- [x] Router-Instanz in `src/app/router.js`
- [x] Catch-all Route für Backward-Compatibility
- [x] DevTools eingebunden

### Neue Dateien
```
src/
├── lib/
│   └── queryClient.js          # QueryClient mit Default-Optionen
└── app/
    ├── router.js               # Router-Instanz
    └── routes/
        ├── __root.jsx          # Root Layout
        ├── index.jsx           # / → App.jsx
        └── $.jsx               # Catch-all → App.jsx
```

### QueryClient Konfiguration
```javascript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,      // 30 Sekunden
      gcTime: 5 * 60 * 1000,  // 5 Minuten
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
```

---

## Phase 1: Tasks-Feature Migration ✅

**Ziel:** Komplettes Feature auf neue Architektur migrieren

### Erledigt
- [x] Query-Key Factory erstellt (`taskKeys`)
- [x] `useTasksQuery` mit TanStack Query + Realtime Subscription
- [x] `useCreateTask` Mutation mit optimistischem Update
- [x] `useUpdateTask` Mutation (inkl. Complete, Uncomplete, Order)
- [x] `useDeleteTask` Mutation mit Rollback
- [x] `useTaskFilters` Hook (lokaler Filter-State)
- [x] `useTaskForm` Hook (Form State Management)
- [x] `TasksPage` Wrapper-Komponente
- [x] `/tasks` Route mit URL-Parametern

### Neue Struktur
```
src/features/tasks/
├── api/
│   ├── index.js                # Re-exports
│   ├── queries.js              # taskKeys Factory
│   ├── useTasksQuery.js        # useQuery + Realtime
│   ├── useCreateTask.js        # useMutation + parseTaskInput
│   ├── useUpdateTask.js        # useMutation (update/complete/order)
│   └── useDeleteTask.js        # useMutation mit optimistischem Delete
├── hooks/
│   ├── index.js                # Re-exports
│   ├── useTaskFilters.js       # Filter/Sort/Group State
│   └── useTaskForm.js          # Form State + Validation
├── TasksPage.jsx               # NEU - Wrapper mit TanStack Query
├── TasksView.jsx               # Unverändert (Props-basiert)
├── TaskFormModal.jsx           # Unverändert
├── TaskCompleteModal.jsx       # Unverändert
├── useTasks.js                 # Legacy (noch von App.jsx genutzt)
└── index.js                    # Aktualisierte Exports
```

### URL-Parameter für /tasks
```
/tasks                      # Alle Tasks
/tasks?project=abc          # Nach Projekt gefiltert
/tasks?priority=A           # Nach Priorität gefiltert
/tasks?assignee=uuid        # Nach Bearbeiter gefiltert
/tasks?due=today            # Heute fällig
/tasks?due=week             # Diese Woche fällig
/tasks?due=overdue          # Überfällig
/tasks?completed=true       # Erledigte anzeigen
```

---

## Phase 2: PharmacyContext Split ✅

**Ziel:** Zwei Domains trennen für bessere Performance

### Erledigt
- [x] PharmacyContext auf 14 Properties reduzieren
- [x] StaffContext mit 28 Properties erstellen
- [x] Selektor-Hooks erstellen
- [x] main.jsx mit StaffProvider aktualisiert
- [x] App.jsx auf getrennte Contexts umgestellt
- [x] ChatContext.jsx auf useStaff umgestellt
- [x] TasksPage.jsx auf useStaff umgestellt

### Neue Context-Struktur
```
src/context/
├── PharmacyContext.jsx     # 14 Props - nur Apotheken-Daten
├── StaffContext.jsx        # 28 Props - nur Mitarbeiter-Daten
├── selectors.js            # Feinkörnige Selektor-Hooks
└── index.js                # Aktualisierte Exports
```

### Selektor-Hooks
```javascript
// src/context/selectors.js
useCurrentUser()        // → currentStaff
usePharmacyList()       // → { pharmacies, loading, pharmacyLookup }
useStaffList()          // → { staff, filteredStaff, loading, showExited }
useStaffLookup()        // → { getStaffById, getStaffByAuthId }
usePharmacyLookup()     // → { getPharmacyById }
```

### Provider-Hierarchie (main.jsx)
```jsx
<QueryClientProvider client={queryClient}>
  <ThemeProvider>
    <AuthProvider>
      <PharmacyProvider>
        <StaffProvider>          {/* NEU */}
          <ContactsProvider>
            <EmailProvider>
              <PhotosProvider>
                <NavigationProvider>
                  <ChatProvider>
                    <RouterProvider router={router} />
                  </ChatProvider>
                </NavigationProvider>
              </PhotosProvider>
            </EmailProvider>
          </ContactsProvider>
        </StaffProvider>
      </PharmacyProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
```

---

## Phase 3: Weitere Features migrieren (In Arbeit)

### 1. Calendar ✅

**Erledigt:**
- [x] Query-Key Factories (`calendarKeys`, `eventKeys`)
- [x] `useCalendarsQuery` mit Realtime Subscription
- [x] `useCalendarEventsQuery` mit Date-Range-Berechnung
- [x] `useDashboardEventsQuery` für Dashboard-Widget
- [x] Calendar Mutations (Create, Update, Delete)
- [x] Event Mutations (Create, Update, Delete)
- [x] Permission Mutations (Add, Remove)
- [x] `useCalendarView` Hook (View-State)
- [x] `useEventForm` Hook (Event-Formular)
- [x] `useCalendarForm` Hook (Kalender-Formular)
- [x] `CalendarPage` Wrapper-Komponente
- [x] `/calendar` Route
- [x] `/calendar/notdienst` Route

**Neue Struktur:**
```
src/features/calendar/
├── api/
│   ├── index.js                    # Re-exports
│   ├── queries.js                  # calendarKeys, eventKeys
│   ├── useCalendarsQuery.js        # Calendars + Permissions
│   ├── useCalendarEventsQuery.js   # Events + Dashboard
│   ├── useCalendarMutations.js     # Calendar CRUD
│   └── useEventMutations.js        # Event CRUD
├── hooks/
│   ├── index.js                    # Re-exports
│   ├── useCalendarView.js          # Date, Mode, Selection
│   ├── useEventForm.js             # Event Form State
│   └── useCalendarForm.js          # Calendar Form State
├── CalendarPage.jsx                # NEU - Wrapper
├── CalendarView.jsx                # Unverändert
├── NotdienstplanungView.jsx        # Unverändert
├── useCalendar.js                  # Legacy
└── index.js                        # Aktualisierte Exports
```

### 2. Contacts ⏳

**Geplant:**
- [ ] Query-Key Factory
- [ ] `useContactsQuery` mit Realtime
- [ ] Contact Mutations
- [ ] Business-Card-Scanning als separater Hook
- [ ] `ContactsPage` Wrapper
- [ ] `/contacts` Route
- [ ] `/contacts/:id` Route

### 3. Chat ⏳

**Geplant:**
- [ ] Query-Key Factory
- [ ] `useChatMessagesQuery` (Initial Load)
- [ ] Realtime bleibt Supabase Subscriptions
- [ ] Message Mutations
- [ ] `ChatPage` Wrapper
- [ ] `/chat/group` Route
- [ ] `/chat/dm/:userId` Route

### 4. Email ⏳

**Geplant:**
- [ ] JMAP-Integration beibehalten
- [ ] Caching-Layer mit TanStack Query
- [ ] `/email` Route
- [ ] `/email/:accountId` Route

### Pattern für Real-time Features
```javascript
// TanStack Query für Initial Load + Cache
const { data: messages } = useQuery({
  queryKey: ['chat', chatId],
  queryFn: () => fetchMessages(chatId),
})

// Supabase Subscription invalidiert den Cache
useEffect(() => {
  const channel = supabase
    .channel(`chat_${chatId}`)
    .on('postgres_changes', { event: '*', table: 'chat_messages' }, () => {
      queryClient.invalidateQueries({ queryKey: ['chat', chatId] })
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [chatId, queryClient])
```

---

## Phase 4: Routing komplett (Ausstehend)

### Aktuelle Routes
```
/                           # Dashboard (catch-all → App.jsx)
/tasks                      # Tasks ✅
/tasks?project=X            # Gefiltert ✅
/calendar                   # Kalender ✅
/calendar/notdienst         # Notdienstplanung ✅
```

### Geplante Routes
```
/chat/group                 # Gruppenchat
/chat/dm/:userId            # Direktnachricht
/contacts                   # Kontakte
/contacts/:id               # Kontakt-Detail
/email                      # E-Mail
/email/:accountId           # Account-spezifisch
/settings                   # Einstellungen
/settings/pharmacies        # Apotheken
/settings/staff             # Mitarbeiter
/settings/contacts          # Kontakt-Einstellungen
/botendienst                # Botendienst
/botendienst/driver/:token  # Fahrer-Ansicht (public)
```

### NavigationContext ersetzen
```javascript
// Vorher: NavigationContext
const { activeView, setActiveView } = useNavigation()
setActiveView('tasks')

// Nachher: TanStack Router
const navigate = useNavigate()
navigate({ to: '/tasks', search: { project: 'abc' } })
```

---

## Phase 5: App.jsx Decomposition (Ausstehend)

### Ziel-Struktur
```javascript
// src/App.jsx - Final (< 50 Zeilen)
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { queryClient } from './lib/queryClient'
import { router } from './app/router'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}
```

### Root Layout mit Providern
```javascript
// src/app/routes/__root.jsx
function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PharmacyProvider>
          <StaffProvider>
            <Outlet />
          </StaffProvider>
        </PharmacyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
```

### Dashboard Layout
```javascript
// src/app/routes/_dashboard.jsx
function DashboardLayout() {
  return (
    <div className="flex h-screen">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
```

---

## Phase 6: Performance & Polish (Ausstehend)

### React 19 Features
```javascript
// use() Hook für Data Loading
function TaskList() {
  const tasks = use(tasksPromise)
  return <ul>{tasks.map(...)}</ul>
}

// useTransition für non-blocking Updates
const [isPending, startTransition] = useTransition()
function handleFilter(value) {
  startTransition(() => setFilter(value))
}
```

### Route-basiertes Code Splitting
```javascript
export const Route = createFileRoute('/archiv')({
  component: lazy(() => import('@/features/archiv/ArchivView')),
})
```

### Prefetching bei Hover
```javascript
<Link to="/tasks" preload="intent">Tasks</Link>
```

---

## Erfolgsmetriken

| Metrik | Ursprung | Aktuell | Ziel | Status |
|--------|----------|---------|------|--------|
| App.jsx Zeilen | 4.486 | 4.486 | < 50 | ⏳ |
| PharmacyContext Props | 59 | 14 | 14 | ✅ |
| StaffContext Props | - | 28 | 28 | ✅ |
| useTasks useState | 16 | 2 | 2 | ✅ |
| URL-Navigation | 0% | 20% | 100% | 🔄 |
| Request-Deduplizierung | 0% | 30% | 100% | 🔄 |
| Browser-History | ❌ | 🔄 | ✅ | 🔄 |

---

## Risiko-Mitigation

### Inkrementelles Deployment
- Jede Phase separat deploybar
- Catch-all Route als Fallback
- Alte und neue Navigation koexistieren temporär

### Testing
- Playwright E2E Tests vor jeder Migration
- Query-DevTools für Cache-Debugging
- Performance-Messungen (Lighthouse)

### Rollback-Strategie
- Git-Branch pro Phase
- Feature-Flags falls nötig
- Legacy-Hooks bleiben erhalten bis Migration komplett

---

## Nächste Schritte

1. **Phase 3 fortsetzen:** Contacts-Feature migrieren
2. **Phase 3 fortsetzen:** Chat-Feature migrieren
3. **Phase 3 fortsetzen:** Email-Feature migrieren
4. **Phase 4 starten:** Restliche Routes implementieren
