import { useState, useEffect } from 'react'
import { FloppyDisk, Check } from '@phosphor-icons/react'
import { useMjSettings } from '../hooks/useMjSettings'
import { HolidayManager } from './HolidayManager'

export function EinstellungenView({ theme, pharmacyId, profiles }) {
  const { settings, loading, fetchSettings, updateSettings } = useMjSettings({ pharmacyId })
  const [form, setForm] = useState({ default_hourly_rate: '', monthly_limit: '' })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (pharmacyId) fetchSettings()
  }, [pharmacyId, fetchSettings])

  useEffect(() => {
    if (settings) {
      setForm({
        default_hourly_rate: String(settings.default_hourly_rate || '12.41'),
        monthly_limit: String(settings.monthly_limit || '538.00'),
      })
    }
  }, [settings])

  const handleSave = async () => {
    const success = await updateSettings({
      default_hourly_rate: parseFloat(form.default_hourly_rate),
      monthly_limit: parseFloat(form.monthly_limit),
    })
    if (success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      {/* General Settings */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow}`}>
        <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-4`}>Allgemeine Einstellungen</h3>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F59E0B]" />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                  Standard-Stundenlohn (&euro;)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.default_hourly_rate}
                  onChange={(e) => setForm({ ...form, default_hourly_rate: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                />
                <p className={`mt-1 text-xs ${theme.textMuted}`}>
                  Wird als Standard beim Anlegen neuer Minijobber verwendet
                </p>
              </div>
              <div>
                <label className={`block text-sm font-medium ${theme.textSecondary} mb-1.5`}>
                  Minijob-Grenze (&euro;/Monat)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={form.monthly_limit}
                  onChange={(e) => setForm({ ...form, monthly_limit: e.target.value })}
                  className={`w-full px-4 py-2.5 rounded-lg border ${theme.input}`}
                />
                <p className={`mt-1 text-xs ${theme.textMuted}`}>
                  Maximaler monatlicher Verdienst für Minijob (aktuell 538 &euro;)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSave}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg ${theme.accent} text-white text-sm font-medium`}
              >
                {saved ? <Check size={18} /> : <FloppyDisk size={18} />}
                {saved ? 'Gespeichert' : 'Speichern'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Holiday Manager */}
      <HolidayManager
        theme={theme}
        pharmacyId={pharmacyId}
      />

      {/* Info */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow}`}>
        <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-2`}>Übersicht</h3>
        <div className="text-sm space-y-1">
          <p className={theme.textSecondary}>
            Aktive Minijobber: <span className={`font-medium ${theme.textPrimary}`}>{profiles.filter(p => p.active).length}</span>
          </p>
          <p className={theme.textSecondary}>
            Inaktive Minijobber: <span className={`font-medium ${theme.textPrimary}`}>{profiles.filter(p => !p.active).length}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
