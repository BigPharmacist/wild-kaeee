import { createContext, useContext, useEffect, useMemo } from 'react'
import { usePharmacies } from '../features/settings/usePharmacies'
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

  // Daten laden wenn Session vorhanden
  useEffect(() => {
    if (session) {
      fetchPharmacies()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  const value = useMemo(() => ({
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
  }), [
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
  ])

  return (
    <PharmacyContext.Provider value={value}>
      {children}
    </PharmacyContext.Provider>
  )
}

/**
 * Hook für vollständigen Pharmacy-Context Zugriff
 */
export function usePharmacy() {
  const context = useContext(PharmacyContext)
  if (!context) {
    throw new Error('usePharmacy must be used within PharmacyProvider')
  }
  return context
}

/**
 * Leichtgewichtiger Hook nur für Pharmacy-Daten (ohne Modal-State)
 * Verwendet von StaffContext und anderen Contexts
 */
export function usePharmacyData() {
  const context = useContext(PharmacyContext)
  if (!context) {
    throw new Error('usePharmacyData must be used within PharmacyProvider')
  }
  return {
    pharmacies: context.pharmacies,
    pharmaciesLoading: context.pharmaciesLoading,
    pharmacyLookup: context.pharmacyLookup,
  }
}
