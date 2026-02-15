import { useState, useEffect } from 'react'
import { supabase, supabaseUrl } from '../../lib/supabase'

const roleOrder = ['ApothekerIn', 'PTA', 'PKA', 'FahrerIn', 'Sonst.']

const emptyForm = {
  firstName: '',
  lastName: '',
  street: '',
  postalCode: '',
  city: '',
  mobile: '',
  email: '',
  role: '',
  pharmacyId: '',
  authUserId: '',
  isAdmin: false,
  avatarUrl: '',
  employedSince: '',
  exitDate: '',
}

export function useStaff({ session, pharmacies }) {
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffMessage, setStaffMessage] = useState('')
  const [editingStaff, setEditingStaff] = useState(null)
  const [staffForm, setStaffForm] = useState(emptyForm)
  const [staffSaveLoading, setStaffSaveLoading] = useState(false)
  const [staffSaveMessage, setStaffSaveMessage] = useState('')
  const [staffInviteLoading, setStaffInviteLoading] = useState(false)
  const [staffInviteMessage, setStaffInviteMessage] = useState('')
  const [staffAvatarFile, setStaffAvatarFile] = useState(null)
  const [staffAvatarPreview, setStaffAvatarPreview] = useState('')
  const [currentStaff, setCurrentStaff] = useState(null)
  const [showExited, setShowExited] = useState(false)
  const [staffViewMode, setStaffViewMode] = useState('cards') // 'cards' | 'table'

  const fetchStaff = async () => {
    setStaffLoading(true)
    const { data, error } = await supabase
      .from('staff')
      .select('id, first_name, last_name, street, postal_code, city, mobile, email, role, pharmacy_id, auth_user_id, is_admin, avatar_url, employed_since, exit_date, created_at')

    if (error) {
      setStaffMessage(error.message)
      setStaff([])
    } else {
      setStaffMessage('')
      const sorted = (data || []).sort((a, b) => {
        const rA = roleOrder.indexOf(a.role)
        const rB = roleOrder.indexOf(b.role)
        const orderA = rA === -1 ? roleOrder.length : rA
        const orderB = rB === -1 ? roleOrder.length : rB
        if (orderA !== orderB) return orderA - orderB
        return (a.last_name || '').localeCompare(b.last_name || '')
      })
      setStaff(sorted)
      if (session?.user?.id) {
        const matched = (data || []).find((member) => member.auth_user_id === session.user.id)
        setCurrentStaff(matched || null)
      }
    }
    setStaffLoading(false)
  }

  // Update currentStaff when staff or session changes
  useEffect(() => {
    if (session?.user?.id && staff.length > 0) {
      const matched = staff.find((member) => member.auth_user_id === session.user.id)
      setCurrentStaff(matched || null)
    }
  }, [staff, session])

  const openStaffModal = (member = null) => {
    const fallbackPharmacyId = pharmacies[0]?.id || ''
    setEditingStaff(member || { id: null })
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffForm({
      firstName: member?.first_name || '',
      lastName: member?.last_name || '',
      street: member?.street || '',
      postalCode: member?.postal_code || '',
      city: member?.city || '',
      mobile: member?.mobile || '',
      email: member?.email || '',
      role: member?.role || '',
      pharmacyId: member?.pharmacy_id || fallbackPharmacyId,
      authUserId: member?.auth_user_id || '',
      isAdmin: member?.is_admin || false,
      avatarUrl: member?.avatar_url || '',
      employedSince: member?.employed_since || '',
      exitDate: member?.exit_date || '',
    })
    setStaffAvatarFile(null)
    setStaffAvatarPreview(member?.avatar_url || '')
  }

  const closeStaffModal = () => {
    setEditingStaff(null)
    setStaffSaveMessage('')
    setStaffInviteMessage('')
    setStaffAvatarFile(null)
    setStaffAvatarPreview('')
  }

  const handleStaffInput = (field, value) => {
    setStaffForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleStaffAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setStaffAvatarFile(file)
    setStaffAvatarPreview(URL.createObjectURL(file))
  }

  const linkCurrentUser = () => {
    if (!session?.user?.id) return
    setStaffForm((prev) => ({
      ...prev,
      authUserId: session.user.id,
      email: prev.email || session.user.email || '',
    }))
  }

  const handleStaffSubmit = async (e) => {
    e.preventDefault()
    if (!editingStaff) return
    if (!staffForm.firstName.trim() || !staffForm.lastName.trim()) {
      setStaffSaveMessage('Bitte Vor- und Nachnamen eingeben.')
      return
    }
    if (!staffForm.role) {
      setStaffSaveMessage('Bitte Beruf wählen.')
      return
    }
    if (!staffForm.pharmacyId) {
      setStaffSaveMessage('Bitte Apotheke zuordnen.')
      return
    }

    setStaffSaveLoading(true)
    const payload = {
      first_name: staffForm.firstName.trim(),
      last_name: staffForm.lastName.trim(),
      street: staffForm.street.trim(),
      postal_code: staffForm.postalCode.trim(),
      city: staffForm.city.trim(),
      mobile: staffForm.mobile.trim(),
      email: staffForm.email.trim(),
      role: staffForm.role,
      pharmacy_id: staffForm.pharmacyId,
      auth_user_id: staffForm.authUserId || null,
      is_admin: staffForm.isAdmin,
      avatar_url: staffForm.avatarUrl || null,
      employed_since: staffForm.employedSince || null,
      exit_date: staffForm.exitDate || null,
    }

    const uploadAvatar = async (staffId) => {
      if (!staffAvatarFile) return null
      const fileExt = staffAvatarFile.name.split('.').pop() || 'jpg'
      const filePath = `staff/${staffId}/${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase
        .storage
        .from('avatars')
        .upload(filePath, staffAvatarFile, { upsert: true })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const { data } = supabase
        .storage
        .from('avatars')
        .getPublicUrl(filePath)
      return data.publicUrl
    }

    let saveError = null
    let savedId = editingStaff.id
    if (editingStaff.id) {
      const { error } = await supabase
        .from('staff')
        .update(payload)
        .eq('id', editingStaff.id)
      saveError = error
    } else {
      const { data, error } = await supabase
        .from('staff')
        .insert(payload)
        .select('id')
        .single()
      saveError = error
      savedId = data?.id
    }

    if (saveError) {
      setStaffSaveMessage(saveError.message)
      setStaffSaveLoading(false)
      return
    }

    if (staffAvatarFile && savedId) {
      try {
        const avatarUrl = await uploadAvatar(savedId)
        if (avatarUrl) {
          await supabase
            .from('staff')
            .update({ avatar_url: avatarUrl })
            .eq('id', savedId)
        }
      } catch (error) {
        setStaffSaveMessage(error.message || 'Avatar konnte nicht gespeichert werden.')
        setStaffSaveLoading(false)
        return
      }
    }

    await fetchStaff()
    setStaffSaveLoading(false)
    closeStaffModal()
  }

  const handleSendInvite = async () => {
    if (!staffForm.email.trim()) {
      setStaffInviteMessage('Bitte E-Mail-Adresse eingeben')
      return
    }
    setStaffInviteLoading(true)
    setStaffInviteMessage('')
    try {
      // Wenn Staff noch nicht gespeichert → zuerst speichern
      let staffId = editingStaff?.id
      if (!staffId) {
        if (!staffForm.firstName.trim() || !staffForm.lastName.trim()) {
          throw new Error('Bitte Vor- und Nachname eingeben')
        }
        if (!staffForm.pharmacyId) {
          throw new Error('Bitte Apotheke zuordnen')
        }
        const { data: newStaff, error: saveError } = await supabase
          .from('staff')
          .insert({
            first_name: staffForm.firstName.trim(),
            last_name: staffForm.lastName.trim(),
            street: staffForm.street.trim(),
            postal_code: staffForm.postalCode.trim(),
            city: staffForm.city.trim(),
            mobile: staffForm.mobile.trim(),
            email: staffForm.email.trim(),
            role: staffForm.role,
            pharmacy_id: staffForm.pharmacyId,
            is_admin: staffForm.isAdmin,
            employed_since: staffForm.employedSince || null,
            exit_date: staffForm.exitDate || null,
          })
          .select('id')
          .single()
        if (saveError) throw new Error(saveError.message)
        staffId = newStaff.id
        setEditingStaff(prev => ({ ...prev, id: staffId }))
      }

      const response = await fetch(`${supabaseUrl}/functions/v1/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          email: staffForm.email.trim(),
          staffId,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Einladung fehlgeschlagen')
      }
      setStaffInviteMessage('Einladung wurde gesendet!')
      await fetchStaff()
    } catch (error) {
      setStaffInviteMessage(error.message)
    }
    setStaffInviteLoading(false)
  }

  // Hilfsfunktion: Prüft ob Mitarbeiter ausgeschieden ist
  const isExited = (member) => {
    if (!member?.exit_date) return false
    return new Date(member.exit_date) < new Date()
  }

  // Aktive und ausgeschiedene Staff getrennt
  const activeStaff = staff.filter((member) => !isExited(member))
  const exitedStaff = staff.filter((member) => isExited(member))
  const filteredStaff = activeStaff

  // Lookup-Objekt: { auth_user_id: staffMember }
  const staffByAuthId = Object.fromEntries(
    staff
      .filter((member) => member.auth_user_id)
      .map((member) => [member.auth_user_id, member])
  )

  return {
    // State
    staff,
    filteredStaff,
    exitedStaff,
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
    // Actions
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
  }
}
