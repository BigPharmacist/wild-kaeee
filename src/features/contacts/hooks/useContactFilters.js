import { useState, useMemo } from 'react'

/**
 * Hook für Kontakt-Filterung und Ansichtsmodus
 *
 * @param {Array} contacts - Array of contact objects
 * @returns {Object} Filter state and filtered contacts
 */
export function useContactFilters(contacts = []) {
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState('cards') // 'cards' | 'list'
  const [showInactive, setShowInactive] = useState(false)

  const filteredContacts = useMemo(() => {
    if (!search.trim()) return contacts

    const term = search.toLowerCase()
    return contacts.filter((contact) =>
      (contact.first_name || '').toLowerCase().includes(term) ||
      (contact.last_name || '').toLowerCase().includes(term) ||
      (contact.company || '').toLowerCase().includes(term) ||
      (contact.position || '').toLowerCase().includes(term) ||
      (contact.email || '').toLowerCase().includes(term) ||
      (contact.phone || '').toLowerCase().includes(term) ||
      (contact.mobile || '').toLowerCase().includes(term) ||
      (contact.street || '').toLowerCase().includes(term) ||
      (contact.postal_code || '').toLowerCase().includes(term) ||
      (contact.city || '').toLowerCase().includes(term) ||
      (contact.notes || '').toLowerCase().includes(term)
    )
  }, [contacts, search])

  return {
    // Search
    search,
    setSearch,

    // View mode
    viewMode,
    setViewMode,

    // Inactive filter
    showInactive,
    setShowInactive,

    // Computed
    filteredContacts,
  }
}
