import { useState, useEffect, useCallback } from 'react'
import { FloppyDisk, Check, Eye, EyeSlash } from '@phosphor-icons/react'
import { supabase } from '../../../../lib/supabase'
import { useMjSettings } from '../hooks/useMjSettings'
import { HolidayManager } from './HolidayManager'

export function EinstellungenView({ theme, pharmacyId, profiles }) {
  const { settings, loading, fetchSettings, updateSettings } = useMjSettings({ pharmacyId })
  const [form, setForm] = useState({ default_hourly_rate: '', monthly_limit: '' })
  const [saved, setSaved] = useState(false)
  const [shifts, setShifts] = useState([])
  const [shiftsLoading, setShiftsLoading] = useState(false)

  const fetchShifts = useCallback(async () => {
    if (!pharmacyId) return
    setShiftsLoading(true)
    const { data } = await supabase
      .from('mj_shifts')
      .select('*')
      .eq('pharmacy_id', pharmacyId)
      .order('start_time')
    setShifts(data || [])
    setShiftsLoading(false)
  }, [pharmacyId])

  const toggleShiftActive = async (shiftId, active) => {
    const { error } = await supabase
      .from('mj_shifts')
      .update({ active })
      .eq('id', shiftId)
    if (!error) {
      setShifts(prev => prev.map(s => s.id === shiftId ? { ...s, active } : s))
    }
  }

  useEffect(() => {
    if (pharmacyId) {
      fetchSettings()
      fetchShifts()
    }
  }, [pharmacyId, fetchSettings, fetchShifts])

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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#DC2626]" />
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

      {/* Schichten verwalten */}
      <div className={`${theme.surface} border ${theme.border} rounded-xl p-4 ${theme.cardShadow}`}>
        <h3 className={`text-sm font-semibold ${theme.textPrimary} mb-4`}>Schichten verwalten</h3>
        <p className={`text-xs ${theme.textMuted} mb-3`}>
          Deaktivierte Schichten werden im Dienstplan ausgeblendet, bestehende Einträge bleiben erhalten.
        </p>
        {shiftsLoading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#DC2626]" />
          </div>
        ) : shifts.length === 0 ? (
          <p className={`text-sm ${theme.textMuted}`}>Keine Schichten vorhanden</p>
        ) : (
          <div className="space-y-2">
            {shifts.map(shift => (
              <div
                key={shift.id}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                  shift.active ? theme.border : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-medium ${shift.active ? theme.textPrimary : theme.textMuted + ' line-through'}`}>
                    {shift.name}
                  </span>
                  <span className={`text-xs ${theme.textMuted}`}>
                    {shift.start_time?.slice(0, 5)} – {shift.end_time?.slice(0, 5)} ({shift.hours}h)
                  </span>
                </div>
                <button
                  onClick={() => toggleShiftActive(shift.id, !shift.active)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    shift.active
                      ? 'text-green-700 bg-green-50 hover:bg-green-100'
                      : 'text-gray-500 bg-gray-100 hover:bg-gray-200'
                  }`}
                  title={shift.active ? 'Schicht ausblenden' : 'Schicht einblenden'}
                >
                  {shift.active ? <Eye size={14} /> : <EyeSlash size={14} />}
                  {shift.active ? 'Sichtbar' : 'Ausgeblendet'}
                </button>
              </div>
            ))}
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
