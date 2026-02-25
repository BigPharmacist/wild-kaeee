import { useState } from 'react'
import { Plus, PencilSimple, Eye, EyeSlash, User } from '@phosphor-icons/react'
import { MjStatusBadge } from '../shared/MjStatusBadge'
import { MjHoursDisplay } from '../shared/MjHoursDisplay'
import { getStaffColor } from '../shared/staffColors'
import { MitarbeiterDetailModal } from './MitarbeiterDetailModal'
import { MonthlyConditionsView } from './MonthlyConditionsView'

const jobTypeColors = {
  Autobote: 'bg-blue-100 text-blue-700',
  Fahrradbote: 'bg-green-100 text-green-700',
  Sonstiges: 'bg-gray-100 text-gray-700',
}

export function MitarbeiterList({ theme, pharmacyId, staff, profilesHook }) {
  const { profiles, loading, fetchProfiles, createProfile, updateProfile, toggleActive } = profilesHook
  const [showModal, setShowModal] = useState(false)
  const [editingProfile, setEditingProfile] = useState(null)
  const [showRateHistory, setShowRateHistory] = useState(null)
  const [showInactive, setShowInactive] = useState(false)

  const handleCreate = () => {
    setEditingProfile(null)
    setShowModal(true)
  }

  const handleEdit = (profile) => {
    setEditingProfile(profile)
    setShowModal(true)
  }

  const handleSave = async (staffData, profileData) => {
    if (editingProfile) {
      const result = await updateProfile(editingProfile.id, editingProfile.staff_id, staffData, profileData)
      if (result) setShowModal(false)
    } else {
      const result = await createProfile(staffData, profileData)
      if (result) setShowModal(false)
    }
  }

  const handleToggleActive = async (profile) => {
    await toggleActive(profile.id, !profile.active)
  }

  const handleShowInactive = async () => {
    const next = !showInactive
    setShowInactive(next)
    await fetchProfiles(next)
  }

  const displayProfiles = showInactive ? profiles : profiles.filter(p => p.active)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className={`text-lg font-semibold ${theme.textPrimary}`}>
            Minijobber ({displayProfiles.length})
          </h3>
          <button
            onClick={handleShowInactive}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
              showInactive
                ? 'bg-gray-200 text-gray-700'
                : `${theme.textMuted} hover:bg-gray-100`
            }`}
          >
            {showInactive ? <EyeSlash size={14} /> : <Eye size={14} />}
            {showInactive ? 'Inaktive ausblenden' : 'Inaktive anzeigen'}
          </button>
        </div>
        <button
          onClick={handleCreate}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white font-medium text-sm`}
        >
          <Plus size={18} weight="bold" />
          Minijobber anlegen
        </button>
      </div>

      {/* Loading */}
      {loading && profiles.length === 0 && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 flex items-center justify-center`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
        </div>
      )}

      {/* Empty State */}
      {!loading && displayProfiles.length === 0 && (
        <div className={`${theme.surface} border ${theme.border} rounded-xl p-12 text-center`}>
          <User size={48} className={theme.textMuted} />
          <p className={`mt-3 ${theme.textMuted}`}>Noch keine Minijobber angelegt</p>
          <button
            onClick={handleCreate}
            className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg ${theme.accent} text-white text-sm font-medium`}
          >
            <Plus size={16} weight="bold" />
            Ersten Minijobber anlegen
          </button>
        </div>
      )}

      {/* Cards Grid */}
      {displayProfiles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProfiles.map((profile) => {
            const name = profile.staff
              ? `${profile.staff.first_name} ${profile.staff.last_name}`
              : 'Unbekannt'
            const initials = profile.initials || name.split(' ').map(n => n[0]).join('').toUpperCase()

            const staffColor = profile.active ? getStaffColor(profile.staff_id) : null
            const colorHex = staffColor?.bg.match(/#[0-9A-Fa-f]+/)?.[0]

            return (
              <div
                key={profile.id}
                className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow} ${
                  !profile.active ? 'opacity-60' : ''
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                      style={colorHex
                        ? { backgroundColor: colorHex + '1A', color: colorHex }
                        : { backgroundColor: 'rgb(245 158 11 / 0.1)', color: '#F59E0B' }
                      }
                    >
                      {initials}
                    </div>
                    <div>
                      <p className={`font-semibold ${theme.textPrimary}`}>{name}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        jobTypeColors[profile.job_type] || jobTypeColors.Sonstiges
                      }`}>
                        {profile.job_type}
                      </span>
                    </div>
                  </div>
                  <MjStatusBadge active={profile.active} size="xs" />
                </div>

                {/* Card Body */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Stundenlohn</span>
                    <span className={theme.textPrimary}>{parseFloat(profile.hourly_rate).toFixed(2).replace('.', ',')} &euro;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Pauschale</span>
                    <span className={theme.textPrimary}>{parseFloat(profile.monthly_payment).toFixed(2).replace('.', ',')} &euro;</span>
                  </div>
                  <div className="flex justify-between">
                    <span className={theme.textSecondary}>Stundensaldo</span>
                    <MjHoursDisplay hours={profile.hours_balance} showSign className={`font-medium ${theme.textPrimary}`} />
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(profile)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    <PencilSimple size={14} />
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setShowRateHistory(profile)}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm ${theme.textSecondary} hover:bg-gray-100`}
                  >
                    Konditionen
                  </button>
                  <button
                    onClick={() => handleToggleActive(profile)}
                    className={`px-3 py-2 rounded-lg text-sm ${
                      profile.active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {profile.active ? 'Deaktivieren' : 'Aktivieren'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modals */}
      <MitarbeiterDetailModal
        theme={theme}
        isOpen={showModal}
        profile={editingProfile}
        onClose={() => setShowModal(false)}
        onSave={handleSave}
      />

      {showRateHistory && (
        <MonthlyConditionsView
          theme={theme}
          isOpen={!!showRateHistory}
          profile={showRateHistory}
          pharmacyId={pharmacyId}
          onClose={() => setShowRateHistory(null)}
        />
      )}
    </div>
  )
}
