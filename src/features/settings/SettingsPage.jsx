import { useEffect, lazy } from 'react'
import { useNavigation, useAuth, usePharmacy, useStaff, useTheme, useContactsContext, useEmail, usePhotosContext } from '../../context'

import useNews from '../dashboard/useNews'
import useEnhance from '../photos/hooks/useEnhance'
import { Icons } from '../../shared/ui'

const SettingsView = lazy(() => import('./SettingsView'))
const EmailSettingsSection = lazy(() => import('../email/EmailSettingsSection'))
const ContactsSettingsSection = lazy(() => import('../contacts/ContactsSettingsSection'))
// Modals
const PharmacyModal = lazy(() => import('./modals/PharmacyModal'))
const StaffModal = lazy(() => import('./modals/StaffModal'))
const EmailAccountModal = lazy(() => import('../email/EmailAccountModal'))

export default function SettingsPage() {
  const { theme } = useTheme()
  const { session } = useAuth()
  const { settingsTab } = useNavigation()

  // Pharmacy
  const {
    pharmacies,
    pharmaciesLoading,
    pharmaciesMessage,
    editingPharmacy,
    editForm,
    editLoading,
    editMessage,
    pharmacyLookup,
    fetchPharmacies,
    handleEditInput,
    openPharmacyCreateModal,
    openEditModal,
    closeEditModal,
    handleEditSubmit,
  } = usePharmacy()

  // Staff
  const {
    staff,
    filteredStaff,
    staffLoading,
    staffMessage,
    editingStaff,
    staffForm,
    staffSaveLoading,
    staffSaveMessage,
    staffInviteLoading,
    staffInviteMessage,
    staffAvatarFile,
    staffAvatarPreview,
    currentStaff,
    showExited,
    staffViewMode,
    fetchStaff,
    openStaffModal,
    closeStaffModal,
    handleStaffInput,
    handleStaffAvatarChange,
    linkCurrentUser,
    handleStaffSubmit,
    handleSendInvite,
    setShowExited,
    setStaffViewMode,
    isExited,
  } = useStaff()

  // Email
  const {
    emailAccounts,
    editingEmailAccount,
    emailAccountForm,
    emailAccountSaving,
    emailAccountMessage,
    selectedEmailAccount,
    setEmailAccountForm,
    openEmailAccountModal,
    closeEmailAccountModal,
    handleSaveEmailAccount,
    handleDeleteEmailAccount,
    handleSelectEmailAccount,
    emailPermissions,
    toggleEmailPermission,
    aiSettings,
    setAiSettings,
    saveAiSettings,
    aiSettingsSaving,
    aiSettingsMessage,
  } = useEmail()

  // Contacts
  const {
    contacts,
    contactsLoading,
    contactsMessage,
    contactSearch,
    contactViewMode,
    contactTypeLabels,
    filteredContacts,
    setContactSearch,
    setContactViewMode,
    fetchContacts,
    openContactModal,
    openContactDetail,
  } = useContactsContext()

  // Photos (nur für Enhance)
  const { googleApiKey, fetchGoogleApiKey } = usePhotosContext()

  // Settings-eigene Hooks
  const {
    enhanceFile,
    enhancePreview,
    enhanceResultPreview,
    enhanceLoading,
    enhanceMessage,
    handleEnhanceFileChange,
    runBusinessCardEnhance,
  } = useEnhance({ googleApiKey, fetchGoogleApiKey })

  const {
    allNews,
    fetchAllNews,
    newsLoading,
    createNews,
    updateNews,
    deleteNews,
    newsSaving,
    newsSaveError,
  } = useNews({ session, currentStaff })

  // News für Admin laden
  useEffect(() => {
    if (settingsTab === 'news' && currentStaff?.is_admin) {
      fetchAllNews()
    }
  }, [settingsTab, currentStaff?.is_admin, fetchAllNews])

  return (
    <>
      <SettingsView
        theme={theme}
        settingsTab={settingsTab}
        pharmacies={pharmacies}
        pharmaciesMessage={pharmaciesMessage}
        pharmaciesLoading={pharmaciesLoading}
        fetchPharmacies={fetchPharmacies}
        openCreateModal={openPharmacyCreateModal}
        openEditModal={openEditModal}
        staff={staff}
        filteredStaff={filteredStaff}
        staffMessage={staffMessage}
        staffLoading={staffLoading}
        fetchStaff={fetchStaff}
        openStaffModal={openStaffModal}
        pharmacyLookup={pharmacyLookup}
        showExited={showExited}
        setShowExited={setShowExited}
        isExited={isExited}
        staffViewMode={staffViewMode}
        setStaffViewMode={setStaffViewMode}
        EmailSettingsSection={EmailSettingsSection}
        currentStaff={currentStaff}
        emailAccounts={emailAccounts}
        selectedEmailAccount={selectedEmailAccount}
        handleSelectEmailAccount={handleSelectEmailAccount}
        openEmailAccountModal={openEmailAccountModal}
        handleDeleteEmailAccount={handleDeleteEmailAccount}
        emailPermissions={emailPermissions}
        toggleEmailPermission={toggleEmailPermission}
        aiSettings={aiSettings}
        setAiSettings={setAiSettings}
        saveAiSettings={saveAiSettings}
        aiSettingsSaving={aiSettingsSaving}
        aiSettingsMessage={aiSettingsMessage}
        Icons={Icons}
        enhanceMessage={enhanceMessage}
        fetchGoogleApiKey={fetchGoogleApiKey}
        handleEnhanceFileChange={handleEnhanceFileChange}
        runBusinessCardEnhance={runBusinessCardEnhance}
        enhanceFile={enhanceFile}
        enhanceLoading={enhanceLoading}
        enhancePreview={enhancePreview}
        enhanceResultPreview={enhanceResultPreview}
        ContactsSettingsSection={ContactsSettingsSection}
        contacts={contacts}
        filteredContacts={filteredContacts}
        contactSearch={contactSearch}
        setContactSearch={setContactSearch}
        contactViewMode={contactViewMode}
        setContactViewMode={setContactViewMode}
        contactsLoading={contactsLoading}
        contactsMessage={contactsMessage}
        contactTypeLabels={contactTypeLabels}
        fetchContacts={fetchContacts}
        openContactModal={openContactModal}
        openContactDetail={openContactDetail}
        allNews={allNews}
        fetchAllNews={fetchAllNews}
        newsLoading={newsLoading}
        createNews={createNews}
        updateNews={updateNews}
        deleteNews={deleteNews}
        newsSaving={newsSaving}
        newsSaveError={newsSaveError}
      />

      <PharmacyModal
        theme={theme}
        Icons={Icons}
        editingPharmacy={editingPharmacy}
        editForm={editForm}
        editLoading={editLoading}
        editMessage={editMessage}
        onClose={closeEditModal}
        onSubmit={handleEditSubmit}
        onEditInput={handleEditInput}
      />

      <StaffModal
        theme={theme}
        Icons={Icons}
        editingStaff={editingStaff}
        staffForm={staffForm}
        staffSaveLoading={staffSaveLoading}
        staffSaveMessage={staffSaveMessage}
        staffInviteLoading={staffInviteLoading}
        staffInviteMessage={staffInviteMessage}
        staffAvatarPreview={staffAvatarPreview}
        staffAvatarFile={staffAvatarFile}
        currentStaff={currentStaff}
        pharmacies={pharmacies}
        session={session}
        onClose={closeStaffModal}
        onSubmit={handleStaffSubmit}
        onStaffInput={handleStaffInput}
        onAvatarChange={handleStaffAvatarChange}
        onLinkCurrentUser={linkCurrentUser}
        onSendInvite={handleSendInvite}
      />

      <EmailAccountModal
        theme={theme}
        editingEmailAccount={editingEmailAccount}
        emailAccountForm={emailAccountForm}
        emailAccountMessage={emailAccountMessage}
        emailAccountSaving={emailAccountSaving}
        onClose={closeEmailAccountModal}
        onSave={handleSaveEmailAccount}
        setEmailAccountForm={setEmailAccountForm}
        CloseIcon={Icons.X}
      />
    </>
  )
}
