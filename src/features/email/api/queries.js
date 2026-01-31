// Query Key Factory für Email
// Ermöglicht konsistente Cache-Keys und einfache Invalidierung

export const emailKeys = {
  all: ['email'],
  // Email accounts (from Supabase)
  accounts: () => [...emailKeys.all, 'accounts'],
  permissions: () => [...emailKeys.all, 'permissions'],
  aiSettings: () => [...emailKeys.all, 'aiSettings'],
  // JMAP data
  mailboxes: (accountId) => [...emailKeys.all, 'mailboxes', accountId],
  emails: (accountId, mailboxId) => [...emailKeys.all, 'emails', accountId, mailboxId],
  emailDetail: (accountId, emailId) => [...emailKeys.all, 'detail', accountId, emailId],
  search: (accountId, query) => [...emailKeys.all, 'search', accountId, query],
  unreadCount: (accountId) => [...emailKeys.all, 'unread', accountId],
}
