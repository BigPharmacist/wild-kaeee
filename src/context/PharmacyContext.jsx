import { createContext, useContext, useEffect, useMemo } from 'react'
import { usePharmacies } from '../features/settings/usePharmacies'
import { useStaff } from '../features/settings/useStaff'
import { useAuth } from './AuthContext'

const PharmacyContext = createContext(null)

export function PharmacyProvider({ children }) {
  const { session } = useAuth()

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
    openCreateModal: openPharmacyCreateModal,
    openEditModal,
    closeEditModal,
    handleEditSubmit,
  } = usePharmacies()

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
    staffByAuthId,
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
    toggleTrackingEnabled,
  } = useStaff({ session, pharmacies })

  // Daten laden wenn Session vorhanden
  useEffect(() => {
    if (session) {
      fetchPharmacies()
      fetchStaff()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const value = useMemo(() => ({
    // Pharmacies
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

    // Staff
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
    staffByAuthId,
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
    toggleTrackingEnabled,
  }), [
    // Pharmacies
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
    // Staff
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
    staffByAuthId,
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
    toggleTrackingEnabled,
  ])

  return (
    <PharmacyContext.Provider value={value}>
      {children}
    </PharmacyContext.Provider>
  )
}

export function usePharmacy() {
  const context = useContext(PharmacyContext)
  if (!context) {
    throw new Error('usePharmacy must be used within PharmacyProvider')
  }
  return context
}
