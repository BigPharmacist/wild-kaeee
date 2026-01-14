import { useCallback } from 'react'

export default function useContactDuplicates({
  supabase,
  fetchContacts,
  contactsApi,
}) {
  const {
    setContactSaveMessage,
    setOcrError,
    setEditingContact,
    setContactForm,
    setDuplicateDialogOpen,
    duplicateCheckResult,
  } = contactsApi

  const checkContactDuplicates = useCallback(async (ocrData) => {
    const checks = []

    if (ocrData.email?.trim()) {
      const { data: emailMatches } = await supabase
        .from('contacts')
        .select('*')
        .ilike('email', ocrData.email.trim())
        .eq('status', 'aktiv')
      if (emailMatches?.length > 0) {
        checks.push({ type: 'email', matches: emailMatches, field: ocrData.email })
      }
    }

    const phoneToCheck = ocrData.phone?.trim() || ocrData.mobile?.trim()
    if (phoneToCheck) {
      const normalizedPhone = phoneToCheck.replace(/[\s\-\/]/g, '')
      const { data: phoneMatches } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'aktiv')
        .or(`phone.ilike.%${normalizedPhone}%,mobile.ilike.%${normalizedPhone}%`)
      if (phoneMatches?.length > 0) {
        checks.push({ type: 'phone', matches: phoneMatches, field: phoneToCheck })
      }
    }

    if (ocrData.company?.trim()) {
      const { data: companyMatches } = await supabase
        .from('contacts')
        .select('*')
        .ilike('company', ocrData.company.trim())
        .eq('status', 'aktiv')

      const differentPerson = companyMatches?.filter((c) =>
        c.first_name?.toLowerCase() !== ocrData.firstName?.toLowerCase() ||
        c.last_name?.toLowerCase() !== ocrData.lastName?.toLowerCase()
      )
      if (differentPerson?.length > 0) {
        checks.push({ type: 'company', matches: differentPerson, field: ocrData.company })
      }
    }

    return checks
  }, [supabase])

  const openContactFormWithOcrData = useCallback((ocrData, predecessorId = null, transitionDate = null) => {
    setEditingContact({ id: null })
    setContactSaveMessage('')
    setOcrError('')
    setContactForm({
      firstName: ocrData.firstName || '',
      lastName: ocrData.lastName || '',
      company: ocrData.company || '',
      position: ocrData.position || '',
      email: ocrData.email || '',
      phone: ocrData.phone || '',
      mobile: ocrData.mobile || '',
      fax: ocrData.fax || '',
      website: ocrData.website || '',
      street: ocrData.street || '',
      postalCode: ocrData.postalCode || '',
      city: ocrData.city || '',
      country: 'DE',
      contactType: 'business',
      tags: [],
      notes: '',
      shared: true,
      businessCardUrl: '',
      businessCardUrlEnhanced: '',
      status: 'aktiv',
      predecessorId,
      transitionDate,
    })
    setDuplicateDialogOpen(false)
  }, [setContactForm, setContactSaveMessage, setDuplicateDialogOpen, setEditingContact, setOcrError])

  const handleDuplicateUpdate = useCallback((existingContact) => {
    setEditingContact(existingContact)
    setContactSaveMessage('')
    setOcrError('')
    const ocrData = duplicateCheckResult?.ocrData || {}
    setContactForm({
      firstName: ocrData.firstName || existingContact.first_name || '',
      lastName: ocrData.lastName || existingContact.last_name || '',
      company: ocrData.company || existingContact.company || '',
      position: ocrData.position || existingContact.position || '',
      email: ocrData.email || existingContact.email || '',
      phone: ocrData.phone || existingContact.phone || '',
      mobile: ocrData.mobile || existingContact.mobile || '',
      fax: ocrData.fax || existingContact.fax || '',
      website: ocrData.website || existingContact.website || '',
      street: ocrData.street || existingContact.street || '',
      postalCode: ocrData.postalCode || existingContact.postal_code || '',
      city: ocrData.city || existingContact.city || '',
      country: existingContact.country || 'DE',
      contactType: existingContact.contact_type || 'business',
      tags: existingContact.tags || [],
      notes: existingContact.notes || '',
      shared: existingContact.shared ?? true,
      businessCardUrl: '',
      businessCardUrlEnhanced: '',
      status: existingContact.status || 'aktiv',
      predecessorId: existingContact.predecessor_id || null,
      transitionDate: existingContact.transition_date || null,
    })
    setDuplicateDialogOpen(false)
  }, [duplicateCheckResult, setContactForm, setContactSaveMessage, setDuplicateDialogOpen, setEditingContact, setOcrError])

  const handleNewRepresentative = useCallback(async (predecessorContact) => {
    const today = new Date().toISOString().split('T')[0]

    await supabase
      .from('contacts')
      .update({ status: 'inaktiv' })
      .eq('id', predecessorContact.id)

    const ocrData = duplicateCheckResult?.ocrData || {}
    openContactFormWithOcrData(ocrData, predecessorContact.id, today)

    await fetchContacts()
  }, [duplicateCheckResult, fetchContacts, openContactFormWithOcrData, supabase])

  const handleCreateNewContact = useCallback(() => {
    const ocrData = duplicateCheckResult?.ocrData || {}
    openContactFormWithOcrData(ocrData)
  }, [duplicateCheckResult, openContactFormWithOcrData])

  return {
    checkContactDuplicates,
    openContactFormWithOcrData,
    handleDuplicateUpdate,
    handleNewRepresentative,
    handleCreateNewContact,
  }
}
