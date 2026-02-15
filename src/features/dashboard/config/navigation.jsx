import { House, Pill, CalendarDots, ChatCircle, GearSix, Files, CheckSquare, Moped, DotsThree } from '@phosphor-icons/react'
import { Icons } from '../../../shared/ui'

/**
 * Navigation items configuration
 */
export const navItems = [
  { id: 'dashboard', icon: () => <House size={20} weight="regular" />, label: 'Dashboard', shortLabel: 'Home' },
  { id: 'post', icon: () => <Icons.PostHorn />, label: 'Post', shortLabel: 'Post' },
  { id: 'planung', icon: () => <CalendarDots size={20} weight="regular" />, label: 'Planung', shortLabel: 'Plan' },
  { id: 'tasks', icon: () => <CheckSquare size={20} weight="regular" />, label: 'Aufgaben', shortLabel: 'Tasks' },
  { id: 'chat', icon: () => <ChatCircle size={20} weight="regular" />, label: 'Chat', shortLabel: 'Chat' },
  { id: 'botendienst', icon: () => <Moped size={20} weight="regular" />, label: 'Botendienst', shortLabel: 'Boten' },
  { id: 'pharma', icon: () => <Pill size={20} weight="regular" />, label: 'Pharma-Info', shortLabel: 'Pharma' },
  { id: 'dokumente', icon: () => <Files size={20} weight="regular" />, label: 'Dokumente', shortLabel: 'Doku' },
  { id: 'settings', icon: () => <GearSix size={20} weight="regular" />, label: 'Einstellungen', shortLabel: 'Settings' },
]

/**
 * Misc navigation item (separate, above avatar)
 */
export const miscNavItem = { id: 'misc', icon: () => <DotsThree size={20} weight="bold" />, label: 'Sonstiges', shortLabel: 'Sonst.' }

/**
 * Creates the secondary navigation map based on dynamic data
 */
export function createSecondaryNavMap({
  projects = [],
  staff = [],
  session,
  currentStaff,
  chatLastMessages = {},
}) {
  return {
    ...(currentStaff?.is_admin ? {
      tasks: [
        { id: 'all', label: 'Alle Aufgaben' },
        ...(projects.length > 0 ? [{ id: 'divider' }] : []),
        ...projects.map(p => ({
          id: `project-${p.id}`,
          label: p.name,
          color: p.color,
        })),
      ],
    } : {}),
    pharma: [
      { id: 'amk', label: 'AMK' },
      { id: 'recall', label: 'Rückrufe' },
      { id: 'rhb', label: 'Rote Hand' },
      { id: 'lav', label: 'LAV' },
    ],
    planung: [
      { id: 'calendar', label: 'Kalender', route: '/calendar' },
      { id: 'notdienstplanung', label: 'Notdienstplanung', route: '/calendar/notdienst' },
      { id: 'timeline', label: 'Dienstplan', route: '/plan' },
    ],
    chat: [
      ...staff
        .filter((s) => s.auth_user_id && s.auth_user_id !== session?.user?.id)
        .map((s) => ({ id: s.auth_user_id, label: s.first_name || 'Unbekannt', avatar: s.avatar_url }))
        .sort((a, b) => {
          const tA = chatLastMessages[a.id] || ''
          const tB = chatLastMessages[b.id] || ''
          if (tA && tB) return tB.localeCompare(tA)
          if (tA) return -1
          if (tB) return 1
          return a.label.localeCompare(b.label)
        }),
      { id: 'divider' },
      { id: 'group', label: 'Alle (Gruppe)' },
    ],
    botendienst: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'map', label: 'Karte' },
      { id: 'customers', label: 'Kunden' },
      { id: 'history', label: 'Verlauf' },
      { id: 'minijobber', label: 'Minijobber' },
      { id: 'divider' },
      { id: 'driver', label: 'Fahrer-Modus' },
    ],
    post: [
      { id: 'email', label: 'Email' },
      { id: 'fax', label: 'Fax' },
      { id: 'gesund', label: 'Gesund.de' },
    ],
    dokumente: [
      { id: 'briefe', label: 'Briefe', route: '/dokumente' },
      { id: 'word', label: 'Word', route: '/dokumente' },
      { id: 'alle', label: 'Alle Dokumente', route: '/dokumente' },
      { id: 'vertraege', label: 'Verträge', route: '/dokumente' },
      { id: 'sonstiges', label: 'Sonstiges', route: '/dokumente' },
      { id: 'divider' },
      { id: 'rechnungen', label: 'Rechnungen', route: '/rechnungen' },
      { id: 'divider' },
      { id: 'archiv', label: 'Archiv', route: '/archiv' },
    ],
    misc: [
      { id: 'ocr', label: 'OCR' },
      { id: 'visitenkarten', label: 'Visitenkarten' },
      { id: 'colors', label: 'Farben' },
      { id: 'scan', label: 'Scannen', route: '/scan' },
    ],
    settings: [
      ...(currentStaff?.is_admin ? [{ id: 'pharmacies', label: 'Apotheken' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'staff', label: 'Kollegium' }] : []),
      { id: 'contacts', label: 'Kontakte' },
      ...(currentStaff?.is_admin ? [{ id: 'email', label: 'E-Mail' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'ai-chat', label: 'KI-Chat' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'news', label: 'News' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'admin', label: 'Admin' }] : []),
    ],
  }
}

export default { navItems, miscNavItem, createSecondaryNavMap }
