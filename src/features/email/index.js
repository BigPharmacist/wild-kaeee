// Components
export { default as EmailAccountModal } from './EmailAccountModal'
export { default as EmailComposeModal } from './EmailComposeModal'
export { default as EmailDetailPane } from './EmailDetailPane'
export { default as EmailListPane } from './EmailListPane'
export { default as EmailMailboxSidebar } from './EmailMailboxSidebar'
export { default as EmailSettingsSection } from './EmailSettingsSection'
export { default as EmailView } from './EmailView'
export { default as EmailPage } from './EmailPage'

// Legacy Hooks (für Backward-Compatibility)
export { default as useEmailAttachments } from './useEmailAttachments'
export { default as useEmailCompose } from './useEmailCompose'
export { default as useEmailSettings } from './useEmailSettings'
export { default as useJmapMail } from './useJmapMail'
export { default as useEmailUnreadCount } from './useEmailUnreadCount'

// TanStack Query API
export * from './api'

// Utils
export { formatEmailDate, getEmailBodyHtml } from './emailUtils'
