import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'

const DEFAULT_CONTACT_FORM = {
  firstName: '',
  lastName: '',
  company: '',
  position: '',
  email: '',
  phone: '',
  mobile: '',
  fax: '',
  website: '',
  street: '',
  postalCode: '',
  city: '',
  country: 'DE',
  contactType: 'business',
  tags: [],
  notes: '',
  shared: true,
  businessCardUrl: '',
  businessCardUrlEnhanced: '',
  businessCardEnhancedConfirmed: false,
  status: 'aktiv',
  predecessorId: null,
  transitionDate: null,
}

const CONTACT_TYPE_LABELS = {
  business: 'Geschäftlich',
  supplier: 'Lieferant',
  customer: 'Kunde',
  employee: 'Mitarbeiter',
  other: 'Sonstige',
}

export default function useContacts({ sessionUserId }) {
  const [contacts, setContacts] = useState([])
  const [contactsLoading, setContactsLoading] = useState(false)
  const [contactsMessage, setContactsMessage] = useState('')
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState(DEFAULT_CONTACT_FORM)
  const [contactSaveLoading, setContactSaveLoading] = useState(false)
  const [contactSaveMessage, setContactSaveMessage] = useState('')
  const [ocrError, setOcrError] = useState('')
  const [contactCardFile, setContactCardFile] = useState(null)
  const [contactCardPreview, setContactCardPreview] = useState('')
  const [contactCardEnhancedFile, setContactCardEnhancedFile] = useState(null)
  const [contactCardEnhancedPreview, setContactCardEnhancedPreview] = useState('')
  const [contactCardRotation, setContactCardRotation] = useState(0)
  const [contactCardEnhancing, setContactCardEnhancing] = useState(false)
  const [businessCardScanning, setBusinessCardScanning] = useState(false)
  const [businessCardOcrResult, setBusinessCardOcrResult] = useState(null)
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)
  const [contactSearch, setContactSearch] = useState('')
  const [contactViewMode, setContactViewMode] = useState('cards')
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedContactCardView, setSelectedContactCardView] = useState('enhanced')
  const [contactFormCardView, setContactFormCardView] = useState('enhanced')

  useEffect(() => {
    if (sessionUserId) return
    setContacts([])
    setContactsLoading(false)
    setContactsMessage('')
    setEditingContact(null)
    setContactForm(DEFAULT_CONTACT_FORM)
    setContactSaveLoading(false)
    setContactSaveMessage('')
    setOcrError('')
    setContactCardFile(null)
    setContactCardPreview('')
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview('')
    setContactCardRotation(0)
    setContactCardEnhancing(false)
    setBusinessCardScanning(false)
    setBusinessCardOcrResult(null)
    setDuplicateCheckResult(null)
    setDuplicateDialogOpen(false)
    setContactSearch('')
    setContactViewMode('cards')
    setSelectedContact(null)
    setSelectedContactCardView('enhanced')
    setContactFormCardView('enhanced')
  }, [sessionUserId])

  const fetchContacts = useCallback(async () => {
    setContactsLoading(true)
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .order('company', { ascending: true })
      .order('last_name', { ascending: true })

    if (error) {
      setContactsMessage(error.message)
      setContacts([])
    } else {
      setContactsMessage('')
      setContacts(data || [])
    }
    setContactsLoading(false)
  }, [])

  const openContactModal = useCallback((contact = null) => {
    setEditingContact(contact || { id: null })
    setContactSaveMessage('')
    setContactForm({
      firstName: contact?.first_name || '',
      lastName: contact?.last_name || '',
      company: contact?.company || '',
      position: contact?.position || '',
      email: contact?.email || '',
      phone: contact?.phone || '',
      mobile: contact?.mobile || '',
      fax: contact?.fax || '',
      website: contact?.website || '',
      street: contact?.street || '',
      postalCode: contact?.postal_code || '',
      city: contact?.city || '',
      country: contact?.country || 'DE',
      contactType: contact?.contact_type || 'business',
      tags: contact?.tags || [],
      notes: contact?.notes || '',
      shared: contact?.shared ?? true,
      businessCardUrl: contact?.business_card_url || '',
      businessCardUrlEnhanced: contact?.business_card_url_enhanced || '',
      businessCardEnhancedConfirmed: contact?.business_card_enhanced_confirmed ?? false,
      status: contact?.status || 'aktiv',
      predecessorId: contact?.predecessor_id || null,
      transitionDate: contact?.transition_date || null,
    })
    setContactCardFile(null)
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview(contact?.business_card_url_enhanced || '')
    setContactCardPreview(contact?.business_card_url || '')
    setContactCardEnhancing(false)
    setContactCardRotation(0)
    setContactFormCardView(contact?.business_card_url_enhanced ? 'enhanced' : 'original')
  }, [])

  const closeContactModal = useCallback(() => {
    setEditingContact(null)
    setContactSaveMessage('')
    setOcrError('')
    setContactCardFile(null)
    setContactCardPreview('')
    setContactCardEnhancedFile(null)
    setContactCardEnhancedPreview('')
    setContactCardEnhancing(false)
    setContactCardRotation(0)
    setContactFormCardView('enhanced')
  }, [])

  const handleContactInput = useCallback((field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  const saveContact = useCallback(async ({ currentStaffId, rotateImage, contactCardRotation, contactCardFile, contactCardEnhancedFile }) => {
    if (!editingContact) return
    if (!contactForm.firstName.trim() && !contactForm.lastName.trim() && !contactForm.company.trim()) {
      setContactSaveMessage('Bitte mindestens Name oder Firma eingeben.')
      return
    }

    if (!currentStaffId) {
      setContactSaveMessage('Kein Mitarbeiter-Profil gefunden.')
      return
    }

    if (contactCardEnhancing) {
      setContactSaveMessage('KI-Verbesserung läuft noch, bitte kurz warten.')
      return
    }

    setContactSaveLoading(true)
    const payload = {
      owner_id: editingContact.owner_id || currentStaffId,
      first_name: contactForm.firstName.trim(),
      last_name: contactForm.lastName.trim(),
      company: contactForm.company.trim(),
      position: contactForm.position.trim(),
      email: contactForm.email.trim(),
      phone: contactForm.phone.trim(),
      mobile: contactForm.mobile.trim(),
      fax: contactForm.fax.trim(),
      website: contactForm.website.trim(),
      street: contactForm.street.trim(),
      postal_code: contactForm.postalCode.trim(),
      city: contactForm.city.trim(),
      country: contactForm.country.trim() || 'DE',
      contact_type: contactForm.contactType,
      tags: contactForm.tags,
      notes: contactForm.notes.trim(),
      shared: contactForm.shared,
      business_card_url: contactForm.businessCardUrl || null,
      business_card_url_enhanced: contactForm.businessCardUrlEnhanced || null,
      business_card_enhanced_confirmed: contactForm.businessCardEnhancedConfirmed ?? false,
      status: contactForm.status || 'aktiv',
      predecessor_id: contactForm.predecessorId || null,
      transition_date: contactForm.transitionDate || null,
    }

    const uploadBusinessCard = async (contactId, file, suffix, contentType = 'image/jpeg') => {
      if (!file) return null
      const fileToUpload = suffix === 'original' && contactCardRotation !== 0
        ? await rotateImage(file, contactCardRotation)
        : file
      const filePath = `${contactId}/${Date.now()}-${suffix}.${contentType === 'image/png' ? 'png' : 'jpg'}`
      const { error: uploadError } = await supabase
        .storage
        .from('business-cards')
        .upload(filePath, fileToUpload, { upsert: true, contentType })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('business-cards')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingContact.id
    if (editingContact.id) {
      const { error } = await supabase
        .from('contacts')
        .update(payload)
        .eq('id', editingContact.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('contacts')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setContactSaveMessage(saveError.message)
      setContactSaveLoading(false)
      return
    }

    if (contactCardFile && savedId) {
      try {
        const originalUrl = await uploadBusinessCard(savedId, contactCardFile, 'original', 'image/jpeg')
        const enhancedUrl = contactCardEnhancedFile
          ? await uploadBusinessCard(savedId, contactCardEnhancedFile, 'enhanced', contactCardEnhancedFile.type || 'image/png')
          : null
        const updatePayload = {
          business_card_url: originalUrl || contactForm.businessCardUrl || null,
          business_card_url_enhanced: enhancedUrl || contactForm.businessCardUrlEnhanced || null,
        }
        await supabase
          .from('contacts')
          .update(updatePayload)
          .eq('id', savedId)
      } catch (error) {
        setContactSaveMessage(error.message || 'Visitenkarte konnte nicht gespeichert werden.')
        setContactSaveLoading(false)
        return
      }
    }

    await fetchContacts()
    setContactSaveLoading(false)
    closeContactModal()
  }, [
    contactCardEnhancing,
    contactForm,
    editingContact,
    fetchContacts,
    closeContactModal,
  ])

  const contactScanApi = useMemo(() => ({
    setContactCardFile,
    setContactCardEnhancedFile,
    setContactCardEnhancedPreview,
    setContactCardPreview,
    setContactCardRotation,
    setContactCardEnhancing,
    setBusinessCardScanning,
    setBusinessCardOcrResult,
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    setEditingContact,
    setContactForm,
    setContactSaveMessage,
    setOcrError,
    setContactFormCardView,
    duplicateCheckResult,
  }), [
    duplicateCheckResult,
    setBusinessCardOcrResult,
    setBusinessCardScanning,
    setContactCardEnhancedFile,
    setContactCardEnhancedPreview,
    setContactCardEnhancing,
    setContactCardFile,
    setContactCardPreview,
    setContactCardRotation,
    setContactForm,
    setContactFormCardView,
    setContactSaveMessage,
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    setEditingContact,
    setOcrError,
  ])

  const deleteContact = useCallback(async (contactId) => {
    if (!window.confirm('Kontakt wirklich löschen?')) return
    const { data: deletedContact, error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId)
      .select('business_card_url, business_card_url_enhanced')
      .single()
    if (error) {
      setContactsMessage(error.message)
      return
    }

    const urlsToDelete = [
      deletedContact?.business_card_url,
      deletedContact?.business_card_url_enhanced,
    ].filter(Boolean)
    const paths = urlsToDelete
      .map((url) => url.match(/business-cards\/(.+)$/))
      .filter(Boolean)
      .map((match) => match[1])
    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from('business-cards').remove(paths)
      if (storageError) {
        setContactsMessage(`Kontakt gelöscht, aber Dateien konnten nicht entfernt werden: ${storageError.message}`)
      }
    }

    await fetchContacts()
  }, [fetchContacts])

  const contactTypeLabels = useMemo(() => CONTACT_TYPE_LABELS, [])

  const filteredContacts = useMemo(() => {
    if (!contactSearch.trim()) return contacts
    const search = contactSearch.toLowerCase()
    return contacts.filter((contact) => (
      (contact.first_name || '').toLowerCase().includes(search) ||
      (contact.last_name || '').toLowerCase().includes(search) ||
      (contact.company || '').toLowerCase().includes(search) ||
      (contact.position || '').toLowerCase().includes(search) ||
      (contact.email || '').toLowerCase().includes(search) ||
      (contact.phone || '').toLowerCase().includes(search) ||
      (contact.mobile || '').toLowerCase().includes(search) ||
      (contact.street || '').toLowerCase().includes(search) ||
      (contact.postal_code || '').toLowerCase().includes(search) ||
      (contact.city || '').toLowerCase().includes(search) ||
      (contact.notes || '').toLowerCase().includes(search)
    ))
  }, [contacts, contactSearch])

  const openContactDetail = useCallback((contact) => {
    setSelectedContact(contact)
    setSelectedContactCardView(contact.business_card_url_enhanced ? 'enhanced' : 'original')
  }, [])

  const getContactCardUrl = useCallback((contact, view = 'enhanced') => {
    if (!contact) return ''
    if (view === 'enhanced' && contact.business_card_url_enhanced) {
      return contact.business_card_url_enhanced
    }
    return contact.business_card_url || contact.business_card_url_enhanced || ''
  }, [])

  const selectedCardUrl = selectedContact
    ? getContactCardUrl(selectedContact, selectedContactCardView)
    : ''
  const selectedCardHasEnhanced = !!selectedContact?.business_card_url_enhanced
  const selectedCardHasOriginal = !!selectedContact?.business_card_url

  return {
    contacts,
    contactsLoading,
    contactsMessage,
    editingContact,
    contactForm,
    contactSaveLoading,
    contactSaveMessage,
    ocrError,
    contactCardFile,
    contactCardPreview,
    contactCardEnhancedFile,
    contactCardEnhancedPreview,
    contactCardRotation,
    contactCardEnhancing,
    businessCardScanning,
    businessCardOcrResult,
    duplicateCheckResult,
    duplicateDialogOpen,
    contactSearch,
    contactViewMode,
    selectedContact,
    selectedContactCardView,
    selectedCardUrl,
    selectedCardHasEnhanced,
    selectedCardHasOriginal,
    contactFormCardView,
    contactTypeLabels,
    filteredContacts,
    setContacts,
    setContactsMessage,
    setContactsLoading,
    setEditingContact,
    setContactForm,
    setContactSaveLoading,
    setContactSaveMessage,
    setOcrError,
    setContactCardFile,
    setContactCardPreview,
    setContactCardEnhancedFile,
    setContactCardEnhancedPreview,
    setContactCardRotation,
    setContactCardEnhancing,
    setBusinessCardScanning,
    setBusinessCardOcrResult,
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    setContactSearch,
    setContactViewMode,
    setSelectedContact,
    setSelectedContactCardView,
    setContactFormCardView,
    fetchContacts,
    openContactModal,
    closeContactModal,
    handleContactInput,
    deleteContact,
    saveContact,
    openContactDetail,
    getContactCardUrl,
    contactScanApi,
  }
}
