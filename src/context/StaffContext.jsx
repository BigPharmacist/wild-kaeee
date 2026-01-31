import { createContext, useContext, useEffect, useMemo } from 'react'
import { useStaff as useStaffHook } from '../features/settings/useStaff'
import { useAuth } from './AuthContext'
import { usePharmacyData } from './PharmacyContext'

const StaffContext = createContext(null)

export function StaffProvider({ children }) {
  const { session } = useAuth()
  const { pharmacies } = usePharmacyData()

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
  } = useStaffHook({ session, pharmacies })

  // Daten laden wenn Session vorhanden
  useEffect(() => {
    if (session) {
      fetchStaff()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const value = useMemo(() => ({
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
    <StaffContext.Provider value={value}>
      {children}
    </StaffContext.Provider>
  )
}

export function useStaff() {
  const context = useContext(StaffContext)
  if (!context) {
    throw new Error('useStaff must be used within StaffProvider')
  }
  return context
}
