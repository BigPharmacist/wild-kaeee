/**
 * Selektor-Hooks für feinkörnigen Context-Zugriff
 * Reduziert unnötige Re-Renders durch gezielte Datenauswahl
 */

import { useStaff } from './StaffContext'
import { usePharmacy } from './PharmacyContext'

/**
 * Aktuell eingeloggter Benutzer (Staff-Eintrag)
 */
export function useCurrentUser() {
  const { currentStaff } = useStaff()
  return currentStaff
}

/**
 * Pharmacy-Liste für Dropdowns und Übersichten
 */
export function usePharmacyList() {
  const { pharmacies, pharmaciesLoading, pharmacyLookup } = usePharmacy()
  return { pharmacies, loading: pharmaciesLoading, pharmacyLookup }
}

/**
 * Staff-Liste mit Filter-Optionen
 */
export function useStaffList() {
  const { staff, filteredStaff, staffLoading, showExited, setShowExited } = useStaff()
  return { staff, filteredStaff, loading: staffLoading, showExited, setShowExited }
}

/**
 * Staff-Lookup by ID
 */
export function useStaffLookup() {
  const { staff, staffByAuthId } = useStaff()

  const getStaffById = (id) => staff?.find(s => s.id === id)
  const getStaffByAuthId = (authId) => staffByAuthId?.[authId]

  return { getStaffById, getStaffByAuthId, staff }
}

/**
 * Pharmacy-Lookup by ID
 */
export function usePharmacyLookup() {
  const { pharmacies, pharmacyLookup } = usePharmacy()

  const getPharmacyById = (id) => pharmacyLookup?.[id] || pharmacies?.find(p => p.id === id)

  return { getPharmacyById, pharmacies }
}
