import { useState, useCallback, useMemo } from 'react'
import { useTheme, useStaff, useAuth, usePhotosContext } from '../../context'
import { supabase } from '../../lib/supabase'
import {
  detectRotationWithAI,
  rotateImageByDegrees,
  compressImage,
  getEnhancedImage,
  rotateImage,
} from '../../lib/imageProcessing'
import { useContactsQuery } from './api/useContactsQuery'
import { useCreateContact } from './api/useCreateContact'
import { useUpdateContact } from './api/useUpdateContact'
import { useDeleteContact } from './api/useDeleteContact'
import { useContactFilters } from './hooks/useContactFilters'
import { useContactForm, formToContactPayload } from './hooks/useContactForm'
import ContactsSettingsSection from './ContactsSettingsSection'
import ContactDetailModal from './ContactDetailModal'
import ContactFormModal from './ContactFormModal'
import * as contactScan from './scan'
import { Icons } from '../../shared/ui'

const CONTACT_TYPE_LABELS = {
  business: 'Geschäftlich',
  supplier: 'Lieferant',
  customer: 'Kunde',
  employee: 'Mitarbeiter',
  other: 'Sonstige',
}

/**
 * ContactsPage - Wrapper-Komponente die TanStack Query Hooks verwendet
 * Wird für die /contacts Route und als eigenständige Komponente verwendet
 */
export default function ContactsPage() {
  const { theme } = useTheme()
  const { currentStaff } = useStaff()
  useAuth() // Ensure auth context is available

  // Photos context for API keys (needed for business card scan)
  const {
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
  } = usePhotosContext()

  // TanStack Query hooks
  const { data: contacts = [], isLoading: contactsLoading, error: queryError, refetch } = useContactsQuery()
  const createMutation = useCreateContact()
  const updateMutation = useUpdateContact()
  const deleteMutation = useDeleteContact()

  // Local filter state
  const {
    search,
    setSearch,
    viewMode,
    setViewMode,
    filteredContacts,
  } = useContactFilters(contacts)

  // Form state
  const {
    editingContact,
    contactForm,
    saveError,
    setSaveError,
    openModal,
    closeModal,
    handleInput,
    setContactForm,
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
    formCardView,
    setFormCardView,
    rotateLeft,
    rotateRight,
    resetCardState,
    ocrError,
    setOcrError,
    scanning,
    duplicateCheckResult,
    duplicateDialogOpen,
    setDuplicateDialogOpen,
    scanApi,
  } = useContactForm()

  // Selected contact for detail view
  const [selectedContact, setSelectedContact] = useState(null)
  const [selectedContactCardView, setSelectedContactCardView] = useState('enhanced')

  // Computed values for detail modal
  const selectedCardUrl = useMemo(() => {
    if (!selectedContact) return ''
    if (selectedContactCardView === 'enhanced' && selectedContact.business_card_url_enhanced) {
      return selectedContact.business_card_url_enhanced
    }
    return selectedContact.business_card_url || selectedContact.business_card_url_enhanced || ''
  }, [selectedContact, selectedContactCardView])

  const selectedCardHasEnhanced = !!selectedContact?.business_card_url_enhanced
  const selectedCardHasOriginal = !!selectedContact?.business_card_url
  const selectedCardNeedsConfirmation = selectedContact?.business_card_url_enhanced && !selectedContact?.business_card_enhanced_confirmed

  // Business card scan hooks
  const {
    checkContactDuplicates,
    openContactFormWithOcrData,
    handleDuplicateUpdate,
    handleNewRepresentative,
    handleCreateNewContact,
  } = contactScan.useContactDuplicates({
    supabase,
    fetchContacts: refetch,
    contactsApi: scanApi,
  })

  const { handleBusinessCardScan } = contactScan.useBusinessCardScan({
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
    detectRotationWithAI,
    rotateImageByDegrees,
    compressImage,
    getEnhancedImage,
    checkContactDuplicates,
    openContactFormWithOcrData,
    contactsApi: scanApi,
  })

  // Error message from query or mutations
  const contactsMessage = queryError?.message || ''

  // Open contact detail modal
  const openContactDetail = useCallback((contact) => {
    setSelectedContact(contact)
    setSelectedContactCardView(contact.business_card_url_enhanced ? 'enhanced' : 'original')
  }, [])

  // Close contact detail modal
  const closeContactDetail = useCallback(() => {
    setSelectedContact(null)
  }, [])

  // Save contact (create or update)
  const saveContact = useCallback(async (e) => {
    e?.preventDefault()

    if (!currentStaff?.id) {
      setSaveError('Kein Mitarbeiter-Profil gefunden.')
      return
    }

    // Validation
    if (!contactForm.firstName.trim() && !contactForm.lastName.trim() && !contactForm.company.trim()) {
      setSaveError('Bitte mindestens Name oder Firma eingeben.')
      return
    }

    if (cardEnhancing) {
      setSaveError('KI-Verbesserung läuft noch, bitte kurz warten.')
      return
    }

    try {
      const payload = formToContactPayload(contactForm, editingContact?.owner_id || currentStaff.id)

      if (editingContact?.id) {
        // Update existing contact
        await updateMutation.mutateAsync({
          contactId: editingContact.id,
          updates: payload,
          cardFile,
          cardEnhancedFile,
          rotateImage,
          cardRotation,
        })
      } else {
        // Create new contact
        await createMutation.mutateAsync({
          contactData: payload,
          cardFile,
          cardEnhancedFile,
          rotateImage,
          cardRotation,
        })
      }

      closeModal()
    } catch (err) {
      setSaveError(err.message || 'Speichern fehlgeschlagen')
    }
  }, [
    contactForm,
    editingContact,
    currentStaff,
    cardFile,
    cardEnhancedFile,
    cardRotation,
    cardEnhancing,
    createMutation,
    updateMutation,
    closeModal,
    setSaveError,
  ])

  // Delete contact
  const deleteContact = useCallback(async () => {
    if (!editingContact?.id) return
    if (!window.confirm('Kontakt wirklich löschen?')) return

    try {
      await deleteMutation.mutateAsync(editingContact.id)
      closeModal()
    } catch (err) {
      setSaveError(err.message || 'Löschen fehlgeschlagen')
    }
  }, [editingContact, deleteMutation, closeModal, setSaveError])

  // Handle card file change
  const handleCardFileChange = useCallback((e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCardFile(file)
      setCardPreview(URL.createObjectURL(file))
      setCardEnhancedFile(null)
      setCardEnhancedPreview('')
      setCardRotation(0)
      setFormCardView('original')
    }
  }, [setCardFile, setCardPreview, setCardEnhancedFile, setCardEnhancedPreview, setCardRotation, setFormCardView])

  // Reset card
  const handleResetCard = useCallback(() => {
    if (formCardView === 'enhanced') {
      // Remove enhanced version
      setCardEnhancedFile(null)
      setCardEnhancedPreview('')
      setFormCardView('original')
      setContactForm(prev => ({ ...prev, businessCardEnhancedConfirmed: false }))
    } else {
      // Remove all cards
      resetCardState()
      setContactForm(prev => ({
        ...prev,
        businessCardUrl: '',
        businessCardUrlEnhanced: '',
        businessCardEnhancedConfirmed: false,
      }))
    }
  }, [formCardView, setCardEnhancedFile, setCardEnhancedPreview, setFormCardView, setContactForm, resetCardState])

  // Confirm enhanced card
  const handleConfirmEnhanced = useCallback(() => {
    setContactForm(prev => ({ ...prev, businessCardEnhancedConfirmed: true }))
  }, [setContactForm])

  // Edit from detail view
  const handleEditFromDetail = useCallback(() => {
    if (selectedContact) {
      openModal(selectedContact)
      closeContactDetail()
    }
  }, [selectedContact, openModal, closeContactDetail])

  return (
    <>
      {/* Contacts List Section */}
      <ContactsSettingsSection
        theme={theme}
        contacts={contacts}
        filteredContacts={filteredContacts}
        contactSearch={search}
        onContactSearchChange={(e) => setSearch(e.target.value)}
        onClearContactSearch={() => setSearch('')}
        contactViewMode={viewMode}
        onChangeViewMode={setViewMode}
        contactsLoading={contactsLoading}
        contactsMessage={contactsMessage}
        currentStaff={currentStaff}
        contactTypeLabels={CONTACT_TYPE_LABELS}
        onRefresh={refetch}
        onAddContact={() => openModal()}
        onOpenContactDetail={openContactDetail}
      />

      {/* Business Card Scan Overlay */}
      {scanning && (
        <contactScan.BusinessCardScanOverlay theme={theme} />
      )}

      {/* Business Card Scan Status Banner */}
      {ocrError && (
        <contactScan.BusinessCardScanStatusBanner
          theme={theme}
          ocrError={ocrError}
          onDismiss={() => setOcrError('')}
        />
      )}

      {/* Contact Form Modal */}
      {editingContact && (
        <ContactFormModal
          theme={theme}
          editingContact={editingContact}
          contactForm={contactForm}
          contactSaveLoading={createMutation.isPending || updateMutation.isPending}
          contactSaveMessage={createMutation.error?.message || updateMutation.error?.message || saveError}
          contactCardPreview={cardPreview}
          contactCardEnhancedPreview={cardEnhancedPreview}
          contactCardRotation={cardRotation}
          contactCardEnhancing={cardEnhancing}
          contactFormCardView={formCardView}
          onClose={closeModal}
          onDelete={deleteContact}
          onSubmit={saveContact}
          onContactInput={handleInput}
          onResetCard={handleResetCard}
          onRotateLeft={rotateLeft}
          onRotateRight={rotateRight}
          onCardFileChange={handleCardFileChange}
          onSelectFormCardView={setFormCardView}
          onConfirmEnhanced={handleConfirmEnhanced}
          PhotoIcon={Icons.Photo}
          CloseIcon={Icons.X}
          deleteIcon={<Icons.Trash />}
          contactScanStatus={
            <contactScan.BusinessCardScanInput
              onScan={handleBusinessCardScan}
              disabled={!currentStaff}
            />
          }
        />
      )}

      {/* Contact Detail Modal */}
      {selectedContact && (
        <ContactDetailModal
          theme={theme}
          selectedContact={selectedContact}
          selectedCardUrl={selectedCardUrl}
          selectedCardHasEnhanced={selectedCardHasEnhanced}
          selectedCardHasOriginal={selectedCardHasOriginal}
          selectedContactCardView={selectedContactCardView}
          selectedCardNeedsConfirmation={selectedCardNeedsConfirmation}
          contactTypeLabels={CONTACT_TYPE_LABELS}
          onClose={closeContactDetail}
          onEdit={handleEditFromDetail}
          onEditInStaff={() => {
            // Navigate to staff settings
            closeContactDetail()
          }}
          onSelectCardView={setSelectedContactCardView}
          CloseIcon={Icons.X}
        />
      )}

      {/* Duplicate Dialog */}
      {duplicateDialogOpen && duplicateCheckResult && (
        <contactScan.ContactDuplicateDialog
          theme={theme}
          duplicateCheckResult={duplicateCheckResult}
          onUpdate={handleDuplicateUpdate}
          onNewRepresentative={handleNewRepresentative}
          onCreateNew={handleCreateNewContact}
          onClose={() => setDuplicateDialogOpen(false)}
        />
      )}
    </>
  )
}
