import { useState, useCallback } from 'react'
import { supabase } from '../../../../lib/supabase'

export function useMjProfiles({ pharmacyId }) {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchProfiles = useCallback(async () => {
    if (!pharmacyId) return
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase
      .from('mj_profiles')
      .select('*, staff:staff!mj_profiles_staff_id_fkey(id, first_name, last_name, email, mobile, street, postal_code, city, employed_since, exit_date)')
      .eq('pharmacy_id', pharmacyId)
      .order('created_at', { ascending: true })

    if (err) {
      console.error('Fehler beim Laden der Minijobber:', err)
      setError(err.message)
    } else {
      setProfiles(data || [])
    }
    setLoading(false)
  }, [pharmacyId])

  const createProfile = useCallback(async (staffData, profileData) => {
    if (!pharmacyId) return null
    setError(null)

    // First create or update staff entry
    let staffId = profileData.staff_id
    if (!staffId) {
      const { data: newStaff, error: staffErr } = await supabase
        .from('staff')
        .insert({
          pharmacy_id: pharmacyId,
          first_name: staffData.first_name,
          last_name: staffData.last_name,
          email: staffData.email || null,
          mobile: staffData.mobile || null,
          street: staffData.street || null,
          postal_code: staffData.postal_code || null,
          city: staffData.city || null,
          role: 'Minijobber',
          employed_since: staffData.employed_since || null,
        })
        .select()
        .single()

      if (staffErr) {
        console.error('Fehler beim Anlegen des Mitarbeiters:', staffErr)
        setError(staffErr.message)
        return null
      }
      staffId = newStaff.id
    }

    // Create mj_profile
    const { data, error: err } = await supabase
      .from('mj_profiles')
      .insert({
        pharmacy_id: pharmacyId,
        staff_id: staffId,
        hourly_rate: profileData.hourly_rate,
        monthly_payment: profileData.monthly_payment,
        job_type: profileData.job_type || 'Autobote',
        initials: profileData.initials || null,
        active: true,
      })
      .select('*, staff:staff!mj_profiles_staff_id_fkey(id, first_name, last_name, email, mobile, street, postal_code, city, employed_since, exit_date)')
      .single()

    if (err) {
      console.error('Fehler beim Anlegen des Minijobber-Profils:', err)
      setError(err.message)
      return null
    }

    // Create initial conditions entry for current month
    const now = new Date()
    await supabase.from('mj_monthly_conditions').insert({
      pharmacy_id: pharmacyId,
      staff_id: staffId,
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      hourly_rate: profileData.hourly_rate,
      monthly_payment: profileData.monthly_payment,
    })

    setProfiles(prev => [...prev, data])
    return data
  }, [pharmacyId])

  const updateProfile = useCallback(async (profileId, staffId, staffUpdates, profileUpdates) => {
    setError(null)

    // Update staff if needed
    if (staffUpdates && Object.keys(staffUpdates).length > 0) {
      const { error: staffErr } = await supabase
        .from('staff')
        .update(staffUpdates)
        .eq('id', staffId)

      if (staffErr) {
        console.error('Fehler beim Aktualisieren des Mitarbeiters:', staffErr)
        setError(staffErr.message)
        return null
      }
    }

    // Update profile if needed
    if (profileUpdates && Object.keys(profileUpdates).length > 0) {
      const { error: err } = await supabase
        .from('mj_profiles')
        .update(profileUpdates)
        .eq('id', profileId)

      if (err) {
        console.error('Fehler beim Aktualisieren des Profils:', err)
        setError(err.message)
        return null
      }
    }

    await fetchProfiles()
    return true
  }, [fetchProfiles])

  const toggleActive = useCallback(async (profileId, active) => {
    const { error: err } = await supabase
      .from('mj_profiles')
      .update({ active })
      .eq('id', profileId)

    if (err) {
      console.error('Fehler beim Ändern des Status:', err)
      setError(err.message)
      return false
    }

    setProfiles(prev => prev.map(p =>
      p.id === profileId ? { ...p, active } : p
    ))
    return true
  }, [])

  return {
    profiles,
    loading,
    error,
    fetchProfiles,
    createProfile,
    updateProfile,
    toggleActive,
  }
}
