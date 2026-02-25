import { useState, useEffect } from 'react'
import { X, User, Check } from '@phosphor-icons/react'
import { staffColors, getStaffColorIndex } from '../shared/staffColors'

const jobTypes = ['Autobote', 'Fahrradbote', 'Sonstiges']

export function MitarbeiterDetailModal({ theme, isOpen, profile, onClose, onSave }) {
  const [staffForm, setStaffForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    street: '',
    postal_code: '',
    city: '',
    employed_since: '',
  })
  const [profileForm, setProfileForm] = useState({
    hourly_rate: '12.41',
    monthly_payment: '538.00',
    initial_balance: '0',
    job_type: 'Autobote',
    initials: '',
    color_index: null,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.staff) {
      setStaffForm({
        first_name: profile.staff.first_name || '',
        last_name: profile.staff.last_name || '',
        email: profile.staff.email || '',
        mobile: profile.staff.mobile || '',
        street: profile.staff.street || '',
        postal_code: profile.staff.postal_code || '',
        city: profile.staff.city || '',
        employed_since: profile.staff.employed_since || '',
      })
      setProfileForm({
        hourly_rate: String(profile.hourly_rate || '12.41'),
        monthly_payment: String(profile.monthly_payment || '538.00'),
        initial_balance: String(profile.initial_balance || '0'),
        job_type: profile.job_type || 'Autobote',
        initials: profile.initials || '',
        color_index: profile.color_index ?? getStaffColorIndex(profile.staff_id),
      })
    } else {
      setStaffForm({
        first_name: '', last_name: '', email: '', mobile: '',
        street: '', postal_code: '', city: '', employed_since: '',
      })
      setProfileForm({
        hourly_rate: '12.41', monthly_payment: '538.00', initial_balance: '0',
        job_type: 'Autobote', initials: '', color_index: null,
      })
    }
  }, [profile, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    const staffData = { ...staffForm }
    const profileData = {
      hourly_rate: parseFloat(profileForm.hourly_rate),
      monthly_payment: parseFloat(profileForm.monthly_payment),
      initial_balance: Number.isFinite(parseFloat(profileForm.initial_balance))
        ? parseFloat(profileForm.initial_balance)
        : 0,
      job_type: profileForm.job_type,
      initials: profileForm.initials || null,
      color_index: profileForm.color_index,
    }

    if (profile) {
      profileData.staff_id = profile.staff_id
    }

    await onSave(staffData, profileData)
    setSaving(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F59E0B]/10 flex items-center justify-center">
              <User size={20} className="text-[#F59E0B]" />
            </div>
            <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
              {profile ? 'Minijobber bearbeiten' : 'Neuer Minijobber'}
            </h2>
          </div>
          <button onClick={onClose} className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}>
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Vorname *</label>
              <input
                type="text"
                value={staffForm.first_name}
                onChange={(e) => setStaffForm({ ...staffForm, first_name: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Nachname *</label>
              <input
                type="text"
                value={staffForm.last_name}
                onChange={(e) => setStaffForm({ ...staffForm, last_name: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>E-Mail</label>
              <input
                type="email"
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Mobilnr.</label>
              <input
                type="tel"
                value={staffForm.mobile}
                onChange={(e) => setStaffForm({ ...staffForm, mobile: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Straße</label>
            <input
              type="text"
              value={staffForm.street}
              onChange={(e) => setStaffForm({ ...staffForm, street: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>PLZ</label>
              <input
                type="text"
                value={staffForm.postal_code}
                onChange={(e) => setStaffForm({ ...staffForm, postal_code: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div className="col-span-2">
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Ort</label>
              <input
                type="text"
                value={staffForm.city}
                onChange={(e) => setStaffForm({ ...staffForm, city: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Angestellt seit</label>
            <input
              type="date"
              value={staffForm.employed_since}
              onChange={(e) => setStaffForm({ ...staffForm, employed_since: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 pt-4">
            <p className={`text-sm font-semibold ${theme.textPrimary} mb-3`}>Vertragsdaten</p>
          </div>

          {/* Contract Data */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Stundenlohn (&euro;) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={profileForm.hourly_rate}
                onChange={(e) => setProfileForm({ ...profileForm, hourly_rate: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Monatl. Pauschale (&euro;) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={profileForm.monthly_payment}
                onChange={(e) => setProfileForm({ ...profileForm, monthly_payment: e.target.value })}
                required
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Anfangssaldo (Std.)</label>
            <input
              type="number"
              step="0.01"
              value={profileForm.initial_balance}
              onChange={(e) => setProfileForm({ ...profileForm, initial_balance: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
            />
            <p className={`text-xs ${theme.textMuted} mt-1`}>Startwert für das Stundenkonto (kann negativ sein).</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Berufstyp</label>
              <select
                value={profileForm.job_type}
                onChange={(e) => setProfileForm({ ...profileForm, job_type: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              >
                {jobTypes.map(jt => (
                  <option key={jt} value={jt}>{jt}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>Kürzel (max. 3)</label>
              <input
                type="text"
                maxLength={3}
                value={profileForm.initials}
                onChange={(e) => setProfileForm({ ...profileForm, initials: e.target.value.toUpperCase() })}
                placeholder="z.B. MKR"
                className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
              />
            </div>
          </div>

          {/* Color Picker */}
          <div>
            <label className={`block text-sm font-medium ${theme.textSecondary} mb-2`}>Dienstplan-Farbe</label>
            <div className="flex flex-wrap gap-2">
              {staffColors.map((color, idx) => {
                const hex = color.bg.match(/#[0-9A-Fa-f]+/)?.[0] || '#888'
                const isSelected = profileForm.color_index === idx
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setProfileForm({ ...profileForm, color_index: idx })}
                    className={`w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center ${
                      isSelected ? 'border-gray-800 scale-110' : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                    title={`Farbe ${idx + 1}`}
                  >
                    {isSelected && <Check size={16} className="text-white" weight="bold" />}
                  </button>
                )
              })}
            </div>
          </div>

          {profile && (
            <p className={`text-xs ${theme.textMuted}`}>
              Bezahlte Stunden: {(parseFloat(profileForm.monthly_payment) / parseFloat(profileForm.hourly_rate) || 0).toFixed(2).replace('.', ',')} Std./Monat
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg ${theme.textSecondary} hover:bg-gray-100`}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving || !staffForm.first_name || !staffForm.last_name}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white disabled:opacity-50`}
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <Check size={18} />
              )}
              {profile ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
