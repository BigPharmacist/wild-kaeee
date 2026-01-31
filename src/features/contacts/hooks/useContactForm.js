import { useState, useCallback, useMemo } from 'react'

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

/**
 * Convert contact object to form state
 */
function contactToForm(contact) {
  if (!contact) return { ...DEFAULT_CONTACT_FORM }

  return {
    firstName: contact.first_name || '',
    lastName: contact.last_name || '',
    company: contact.company || '',
    position: contact.position || '',
    email: contact.email || '',
    phone: contact.phone || '',
    mobile: contact.mobile || '',
    fax: contact.fax || '',
    website: contact.website || '',
    street: contact.street || '',
    postalCode: contact.postal_code || '',
    city: contact.city || '',
    country: contact.country || 'DE',
    contactType: contact.contact_type || 'business',
    tags: contact.tags || [],
    notes: contact.notes || '',
    shared: contact.shared ?? true,
    businessCardUrl: contact.business_card_url || '',
    businessCardUrlEnhanced: contact.business_card_url_enhanced || '',
    businessCardEnhancedConfirmed: contact.business_card_enhanced_confirmed ?? false,
    status: contact.status || 'aktiv',
    predecessorId: contact.predecessor_id || null,
    transitionDate: contact.transition_date || null,
  }
}

/**
 * Convert form state to contact database payload
 */
export function formToContactPayload(form, ownerId) {
  return {
    owner_id: ownerId,
    first_name: form.firstName.trim(),
    last_name: form.lastName.trim(),
    company: form.company.trim(),
    position: form.position.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    mobile: form.mobile.trim(),
    fax: form.fax.trim(),
    website: form.website.trim(),
    street: form.street.trim(),
    postal_code: form.postalCode.trim(),
    city: form.city.trim(),
    country: form.country.trim() || 'DE',
    contact_type: form.contactType,
    tags: form.tags,
    notes: form.notes.trim(),
    shared: form.shared,
    business_card_url: form.businessCardUrl || null,
    business_card_url_enhanced: form.businessCardUrlEnhanced || null,
    business_card_enhanced_confirmed: form.businessCardEnhancedConfirmed ?? false,
    status: form.status || 'aktiv',
    predecessor_id: form.predecessorId || null,
    transition_date: form.transitionDate || null,
  }
}

/**
 * Hook für Kontakt-Formular State und Business Card State
 */
export function useContactForm() {
  // Form State
  const [editingContact, setEditingContact] = useState(null)
  const [contactForm, setContactForm] = useState({ ...DEFAULT_CONTACT_FORM })
  const [saveError, setSaveError] = useState('')

  // Business Card State
  const [cardFile, setCardFile] = useState(null)
  const [cardPreview, setCardPreview] = useState('')
  const [cardEnhancedFile, setCardEnhancedFile] = useState(null)
  const [cardEnhancedPreview, setCardEnhancedPreview] = useState('')
  const [cardRotation, setCardRotation] = useState(0)
  const [cardEnhancing, setCardEnhancing] = useState(false)
  const [formCardView, setFormCardView] = useState('enhanced') // 'enhanced' | 'original'

  // OCR State
  const [ocrResult, setOcrResult] = useState(null)
  const [ocrError, setOcrError] = useState('')
  const [scanning, setScanning] = useState(false)

  // Duplicate Check State
  const [duplicateCheckResult, setDuplicateCheckResult] = useState(null)
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false)

  // Reset business card state
  const resetCardState = useCallback(() => {
    setCardFile(null)
    setCardPreview('')
    setCardEnhancedFile(null)
    setCardEnhancedPreview('')
    setCardRotation(0)
    setCardEnhancing(false)
    setOcrResult(null)
    setOcrError('')
    setScanning(false)
    setFormCardView('enhanced')
  }, [])

  // Open modal for new or existing contact
  const openModal = useCallback((contact = null) => {
    if (contact && contact.id) {
      // Editing existing contact
      setEditingContact(contact)
      setContactForm(contactToForm(contact))
      setCardPreview(contact.business_card_url || '')
      setCardEnhancedPreview(contact.business_card_url_enhanced || '')
      setFormCardView(contact.business_card_url_enhanced ? 'enhanced' : 'original')
    } else {
      // New contact
      setEditingContact({ id: null })
      setContactForm({ ...DEFAULT_CONTACT_FORM })
    }
    setCardFile(null)
    setCardEnhancedFile(null)
    setCardRotation(0)
    setCardEnhancing(false)
    setSaveError('')
    setOcrError('')
  }, [])

  // Close modal and reset state
  const closeModal = useCallback(() => {
    setEditingContact(null)
    setContactForm({ ...DEFAULT_CONTACT_FORM })
    resetCardState()
    setSaveError('')
    setOcrError('')
  }, [resetCardState])

  // Handle form input changes
  const handleInput = useCallback((field, value) => {
    setContactForm((prev) => ({ ...prev, [field]: value }))
  }, [])

  // Rotate card left (counter-clockwise)
  const rotateLeft = useCallback(() => {
    setCardRotation((prev) => (prev - 90 + 360) % 360)
  }, [])

  // Rotate card right (clockwise)
  const rotateRight = useCallback(() => {
    setCardRotation((prev) => (prev + 90) % 360)
  }, [])

  // API for Business Card Scan Hooks (compatibility with existing scan hooks)
  const scanApi = useMemo(() => ({
    // Card state setters
    setContactCardFile: setCardFile,
    setContactCardPreview: setCardPreview,
    setContactCardEnhancedFile: setCardEnhancedFile,
    setContactCardEnhancedPreview: setCardEnhancedPreview,
    setContactCardRotation: setCardRotation,
    setContactCardEnhancing: setCardEnhancing,
    setContactFormCardView: setFormCardView,

    // OCR state setters
    setBusinessCardScanning: setScanning,
    setBusinessCardOcrResult: setOcrResult,
    setOcrError,

    // Duplicate state
    setDuplicateCheckResult,
    setDuplicateDialogOpen,
    duplicateCheckResult,

    // Form setters
    setEditingContact,
    setContactForm,
    setContactSaveMessage: setSaveError,

    // Modal controls
    openModal,
  }), [openModal, duplicateCheckResult])

  return {
    // Form State
    editingContact,
    contactForm,
    saveError,
    setSaveError,
    openModal,
    closeModal,
    handleInput,
    setContactForm,

    // Card State
    cardFile,
    setCardFile,
    cardPreview,
    setCardPreview,
    cardEnhancedFile,
    setCardEnhancedFile,
    cardEnhancedPreview,
    setCardEnhancedPreview,
    cardRotation,
    setCardRotation,
    cardEnhancing,
    setCardEnhancing,
    formCardView,
    setFormCardView,

    // Card actions
    resetCardState,
    rotateLeft,
    rotateRight,

    // OCR State
    ocrResult,
    setOcrResult,
    ocrError,
    setOcrError,
    scanning,
    setScanning,

    // Duplicate State
    duplicateCheckResult,
    setDuplicateCheckResult,
    duplicateDialogOpen,
    setDuplicateDialogOpen,

    // API for Scan Hooks
    scanApi,

    // Utilities
    formToContactPayload,
  }
}
