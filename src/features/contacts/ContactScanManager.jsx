import { useRef, useEffect, useCallback, lazy } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { supabase } from '../../lib/supabase'
import {
  detectRotationWithAI,
  rotateImageByDegrees,
  compressImage,
  getEnhancedImage,
  rotateImage,
} from '../../lib/imageProcessing'
import { useNavigation, useStaff, useTheme, useContactsContext, usePhotosContext, useHeaderActions } from '../../context'
import { contactScan } from '../contacts'
import { Icons } from '../../shared/ui'

const ContactDetailModal = lazy(() => import('./ContactDetailModal'))
const ContactFormModal = lazy(() => import('./ContactFormModal'))

/**
 * ContactScanManager - Global component for contact scan flow + modals
 * Rendered in AuthenticatedLayout so header scan works from any route
 */
export default function ContactScanManager() {
  const { setSettingsTab } = useNavigation()
  const { currentStaff } = useStaff()
  const { theme } = useTheme()
  const routerNavigate = useNavigate()
  const { setHeaderActions } = useHeaderActions()

  const {
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
    duplicateCheckResult,
    duplicateDialogOpen,
    selectedContact,
    selectedContactCardView,
    selectedCardUrl,
    selectedCardHasEnhanced,
    selectedCardHasOriginal,
    contactFormCardView,
    contactTypeLabels,
    setSelectedContact,
    setSelectedContactCardView,
    setContactFormCardView,
    fetchContacts,
    openContactModal,
    closeContactModal,
    handleContactInput,
    deleteContact,
    saveContact,
    contactScanApi,
  } = useContactsContext()

  const {
    mistralApiKey,
    googleApiKey,
    fetchMistralApiKey,
    fetchGoogleApiKey,
    photoUploading,
    cameraInputRef,
    handleCameraCapture,
  } = usePhotosContext()

  const {
    checkContactDuplicates,
    openContactFormWithOcrData,
    handleDuplicateUpdate,
    handleNewRepresentative,
    handleCreateNewContact,
  } = contactScan.useContactDuplicates({
    supabase,
    fetchContacts,
    contactsApi: contactScanApi,
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
    contactsApi: contactScanApi,
  })

  const businessCardScanRef = useRef(null)

  // Populate HeaderActionsContext for DashboardHeader
  useEffect(() => {
    setHeaderActions({
      businessCardScanRef,
      cameraInputRef,
      photoUploading,
      businessCardScanning,
      handleCameraCapture,
      BusinessCardScanInput: contactScan.BusinessCardScanInput,
      handleBusinessCardScan,
    })
    return () => setHeaderActions(null)
  }, [photoUploading, businessCardScanning, handleCameraCapture, handleBusinessCardScan, setHeaderActions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContactCardChange = useCallback((event) => {
    const file = event.target.files?.[0]
    if (!file) return
    contactScanApi.setContactCardFile(file)
    contactScanApi.setContactCardPreview(URL.createObjectURL(file))
    contactScanApi.setContactCardEnhancedFile(null)
    contactScanApi.setContactCardEnhancedPreview('')
    contactScanApi.setContactCardEnhancing(false)
    contactScanApi.setContactCardRotation(0)
  }, [contactScanApi])

  return (
    <>
      <contactScan.BusinessCardScanOverlay theme={theme} show={businessCardScanning} />

      <ContactDetailModal
        theme={theme}
        selectedContact={selectedContact}
        selectedCardUrl={selectedCardUrl}
        selectedCardHasEnhanced={selectedCardHasEnhanced}
        selectedCardHasOriginal={selectedCardHasOriginal}
        selectedContactCardView={selectedContactCardView}
        selectedCardNeedsConfirmation={selectedCardHasEnhanced && !selectedContact?.business_card_enhanced_confirmed}
        contactTypeLabels={contactTypeLabels}
        onClose={() => setSelectedContact(null)}
        onEdit={() => {
          openContactModal(selectedContact)
          setSelectedContact(null)
        }}
        onEditInStaff={() => {
          setSettingsTab('staff')
          setSelectedContact(null)
          routerNavigate({ to: '/settings' })
        }}
        onSelectCardView={setSelectedContactCardView}
        CloseIcon={Icons.X}
      />

      <contactScan.ContactDuplicateDialog
        theme={theme}
        duplicateDialogOpen={duplicateDialogOpen}
        duplicateCheckResult={duplicateCheckResult}
        onClose={() => contactScanApi.setDuplicateDialogOpen(false)}
        onDuplicateUpdate={handleDuplicateUpdate}
        onNewRepresentative={handleNewRepresentative}
        onCreateNewContact={handleCreateNewContact}
      />

      <ContactFormModal
        theme={theme}
        editingContact={editingContact}
        contactForm={contactForm}
        contactSaveLoading={contactSaveLoading}
        contactSaveMessage={contactSaveMessage}
        contactCardPreview={contactCardPreview}
        contactCardEnhancedPreview={contactCardEnhancedPreview}
        contactCardRotation={contactCardRotation}
        contactCardEnhancing={contactCardEnhancing}
        contactScanStatus={
          <contactScan.BusinessCardScanStatusBanner
            businessCardScanning={businessCardScanning}
            ocrError={ocrError}
            theme={theme}
          />
        }
        contactFormCardView={contactFormCardView}
        onClose={closeContactModal}
        onDelete={() => {
          deleteContact(editingContact.id)
          closeContactModal()
        }}
        onSubmit={(event) => {
          event.preventDefault()
          saveContact({
            currentStaffId: currentStaff?.id,
            rotateImage,
            contactCardRotation,
            contactCardFile,
            contactCardEnhancedFile,
          })
        }}
        onContactInput={handleContactInput}
        onCardFileChange={handleContactCardChange}
        onResetCard={() => {
          const hasOriginal = contactCardPreview || contactForm.businessCardUrl
          const hasEnhanced = contactCardEnhancedPreview || contactForm.businessCardUrlEnhanced
          const hasBoth = hasOriginal && hasEnhanced

          if (hasBoth) {
            if (contactFormCardView === 'enhanced') {
              contactScanApi.setContactCardEnhancedFile(null)
              contactScanApi.setContactCardEnhancedPreview('')
              handleContactInput('businessCardUrlEnhanced', '')
              setContactFormCardView('original')
            } else {
              contactScanApi.setContactCardFile(null)
              contactScanApi.setContactCardPreview('')
              contactScanApi.setContactCardRotation(0)
              handleContactInput('businessCardUrl', '')
              setContactFormCardView('enhanced')
            }
          } else {
            contactScanApi.setContactCardFile(null)
            contactScanApi.setContactCardPreview('')
            contactScanApi.setContactCardEnhancedFile(null)
            contactScanApi.setContactCardEnhancedPreview('')
            contactScanApi.setContactCardEnhancing(false)
            contactScanApi.setContactCardRotation(0)
            handleContactInput('businessCardUrl', '')
            handleContactInput('businessCardUrlEnhanced', '')
          }
        }}
        onRotateLeft={() => contactScanApi.setContactCardRotation((r) => (r - 90 + 360) % 360)}
        onRotateRight={() => contactScanApi.setContactCardRotation((r) => (r + 90) % 360)}
        onSelectFormCardView={setContactFormCardView}
        onConfirmEnhanced={async () => {
          handleContactInput('businessCardEnhancedConfirmed', true)
          if (editingContact?.id) {
            await supabase
              .from('contacts')
              .update({ business_card_enhanced_confirmed: true })
              .eq('id', editingContact.id)
            fetchContacts()
          }
        }}
        PhotoIcon={Icons.Photo}
        CloseIcon={Icons.X}
        deleteIcon={(
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        )}
      />
    </>
  )
}
