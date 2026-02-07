import { House, Pill, CalendarDots, CalendarBlank, ChatCircle, GearSix, Files, Archive, CheckSquare, Moped, Barcode, DotsThree } from '@phosphor-icons/react'
import { Icons } from '../../../shared/ui'

/**
 * Navigation items configuration
 * Extracted from App.jsx
 */
export const navItems = [
  { id: 'dashboard', icon: () => <House size={20} weight="regular" />, label: 'Dashboard' },
  { id: 'scan', icon: () => <Barcode size={20} weight="regular" />, label: 'Scannen' },
  { id: 'apo', icon: () => <Pill size={20} weight="regular" />, label: 'Apo' },
  { id: 'tasks', icon: () => <CheckSquare size={20} weight="regular" />, label: 'Tasks' },
  { id: 'plan', icon: () => <CalendarDots size={20} weight="regular" />, label: 'Team' },
  { id: 'calendar', icon: () => <CalendarBlank size={20} weight="regular" />, label: 'Kalender' },
  { id: 'chat', icon: () => <ChatCircle size={20} weight="regular" />, label: 'Chat' },
  { id: 'botendienst', icon: () => <Moped size={20} weight="regular" />, label: 'Botendienst' },
  { id: 'post', icon: () => <Icons.PostHorn />, label: 'Post' },
  { id: 'dokumente', icon: () => <Files size={20} weight="regular" />, label: 'Dokumente' },
  { id: 'archiv', icon: () => <Archive size={20} weight="regular" />, label: 'Archiv' },
  { id: 'settings', icon: () => <GearSix size={20} weight="regular" />, label: 'Einstellungen' },
]

/**
 * Misc navigation item (separate, above avatar)
 */
export const miscNavItem = { id: 'misc', icon: () => <DotsThree size={20} weight="bold" />, label: 'Sonstiges' }

/**
 * Creates the secondary navigation map based on dynamic data
 */
export function createSecondaryNavMap({
  projects = [],
  staff = [],
  session,
  archivDocumentTypes = [],
  archivSavedViews = [],
  currentStaff,
}) {
  return {
    tasks: [
      { id: 'all', label: 'Alle Aufgaben' },
      ...(projects.length > 0 ? [{ id: 'divider' }] : []),
      ...projects.map(p => ({
        id: `project-${p.id}`,
        label: p.name,
        color: p.color,
      })),
    ],
    apo: [
      { id: 'amk', label: 'AMK' },
      { id: 'recall', label: 'Rückrufe' },
      { id: 'rhb', label: 'Rote Hand' },
      { id: 'lav', label: 'LAV' },
    ],
    plan: [
      { id: 'timeline', label: 'Zeitplan' },
    ],
    calendar: [
      { id: 'calendars', label: 'Kalender' },
      { id: 'notdienstplanung', label: 'Notdienstplanung' },
    ],
    chat: [
      { id: 'group', label: 'Gruppenchat' },
      ...staff
        .filter((s) => s.auth_user_id && s.auth_user_id !== session?.user?.id)
        .map((s) => ({ id: s.auth_user_id, label: s.first_name || 'Unbekannt' })),
    ],
    botendienst: [
      { id: 'overview', label: 'Übersicht' },
      { id: 'map', label: 'Karte' },
      { id: 'customers', label: 'Kunden' },
      { id: 'history', label: 'Verlauf' },
      { id: 'divider' },
      { id: 'driver', label: 'Fahrer-Modus' },
    ],
    post: [
      { id: 'email', label: 'Email' },
      { id: 'fax', label: 'Fax' },
      { id: 'gesund', label: 'Gesund.de' },
    ],
    dokumente: [
      { id: 'briefe', label: 'Briefe' },
      { id: 'word', label: 'Word' },
      { id: 'alle', label: 'Alle Dokumente' },
      { id: 'rechnungen', label: 'Rechnungen' },
      { id: 'vertraege', label: 'Verträge' },
      { id: 'sonstiges', label: 'Sonstiges' },
    ],
    archiv: [
      { id: 'alle', label: 'Alle Dokumente' },
      // Dokumenttypen dynamisch hinzufügen
      ...archivDocumentTypes.map(dt => ({
        id: `type-${dt.id}`,
        label: dt.name,
      })),
      // Saved Views als Trenner und Liste
      ...(archivSavedViews.length > 0 ? [
        { id: 'divider', label: '─────────', disabled: true },
        ...archivSavedViews.map(sv => ({
          id: `view-${sv.id}`,
          label: `⭐ ${sv.name}`,
        })),
      ] : []),
    ],
    rechnungen: [
      { id: 'alt', label: 'Alt' },
      { id: 'neu', label: 'Neu' },
    ],
    misc: [
      { id: 'uploads', label: 'Uploads' },
      { id: 'ocr', label: 'OCR' },
      { id: 'visitenkarten', label: 'Visitenkarten' },
      { id: 'colors', label: 'Farben' },
      { id: 'card-enhance', label: 'Karten-Test' },
    ],
    settings: [
      { id: 'pharmacies', label: 'Apotheken' },
      { id: 'staff', label: 'Kollegium' },
      { id: 'contacts', label: 'Kontakte' },
      { id: 'email', label: 'E-Mail' },
      { id: 'ai-chat', label: 'KI-Chat' },
      ...(currentStaff?.is_admin ? [{ id: 'news', label: 'News' }] : []),
      ...(currentStaff?.is_admin ? [{ id: 'admin', label: 'Admin' }] : []),
    ],
  }
}

export default { navItems, miscNavItem, createSecondaryNavMap }
