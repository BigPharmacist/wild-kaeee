// Komponenten
export { default as ContactsPage } from './ContactsPage'
export { default as ContactsSettingsSection } from './ContactsSettingsSection'
export { default as ContactFormModal } from './ContactFormModal'
export { default as ContactDetailModal } from './ContactDetailModal'

// TanStack Query API
export * from './api'

// Hooks
export * from './hooks'

// Legacy (für App.jsx Kompatibilität)
export { default as useContacts } from './useContacts'

// Scan Sub-Feature
export * as contactScan from './scan'
