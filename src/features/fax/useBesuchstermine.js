import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Hook für die Verwaltung von Besuchsterminen aus Fax-Ankündigungen.
 * Erstellt automatisch Kalendertermine aus Faxen mit besuche-Daten.
 */
export default function useBesuchstermine() {
  const [apothekenKalenderId, setApothekenKalenderId] = useState(null)
  const [loading, setLoading] = useState(false)

  // Apotheken-Kalender ID laden
  const fetchApothekenKalender = useCallback(async () => {
    const { data } = await supabase
      .from('calendars')
      .select('id')
      .eq('name', 'Apotheke')
      .single()

    if (data) {
      setApothekenKalenderId(data.id)
    }
    return data?.id || null
  }, [])

  // Prüfen ob bereits ein Termin für dieses Fax existiert
  const getExistingTermin = useCallback(async (faxId) => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('external_id', faxId)
      .eq('external_source', 'fax_besuchsankuendigung')
      .single()

    return data
  }, [])

  // Termin aus Besuchsankündigung erstellen
  const createTerminFromBesuch = useCallback(async (fax) => {
    if (!fax?.besuche || fax.besuche.length === 0) {
      return { success: false, error: 'Keine Besuchsdaten vorhanden' }
    }

    setLoading(true)

    try {
      // Kalender-ID holen oder laden
      let kalenderId = apothekenKalenderId
      if (!kalenderId) {
        kalenderId = await fetchApothekenKalender()
      }

      if (!kalenderId) {
        return { success: false, error: 'Apotheken-Kalender nicht gefunden' }
      }

      // Prüfen ob Termin bereits existiert
      const existingTermin = await getExistingTermin(fax.id)
      if (existingTermin) {
        return { success: true, termin: existingTermin, existed: true }
      }

      // Besuchsdaten extrahieren (erstes Element im Array)
      const besuch = fax.besuche[0]

      // Datum und Uhrzeit parsen
      const datumStr = besuch.datum // Format: "DD.MM.YYYY" oder "YYYY-MM-DD"
      const uhrzeitStr = besuch.uhrzeit || '09:00' // Default: 9 Uhr

      let startTime
      if (datumStr.includes('.')) {
        // DD.MM.YYYY Format
        const [day, month, year] = datumStr.split('.')
        const [hours, minutes] = uhrzeitStr.split(':')
        startTime = new Date(year, month - 1, day, hours || 9, minutes || 0)
      } else {
        // YYYY-MM-DD Format
        const [hours, minutes] = uhrzeitStr.split(':')
        startTime = new Date(datumStr)
        startTime.setHours(hours || 9, minutes || 0, 0, 0)
      }

      // Endzeit: 1 Stunde nach Start
      const endTime = new Date(startTime)
      endTime.setHours(endTime.getHours() + 1)

      // Titel aus Firma und Name zusammensetzen
      const firma = besuch.firma || 'Unbekannte Firma'
      const name = besuch.name || ''
      const title = name ? `${firma} - ${name}` : firma

      // Beschreibung mit Thema
      const description = besuch.thema
        ? `Vertreterbesuch: ${besuch.thema}`
        : 'Vertreterbesuch'

      // Termin erstellen
      const { data: termin, error } = await supabase
        .from('calendar_events')
        .insert({
          calendar_id: kalenderId,
          title,
          description,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          all_day: false,
          external_id: fax.id,
          external_source: 'fax_besuchsankuendigung',
        })
        .select()
        .single()

      if (error) {
        console.error('Fehler beim Erstellen des Termins:', error)
        return { success: false, error: error.message }
      }

      return { success: true, termin, created: true }
    } finally {
      setLoading(false)
    }
  }, [apothekenKalenderId, fetchApothekenKalender, getExistingTermin])

  // Automatisch Termin erstellen wenn Fax mit Besuchsdaten geladen wird
  const processeFaxBesuch = useCallback(async (fax) => {
    if (!fax?.besuche || fax.besuche.length === 0) {
      return null
    }

    return await createTerminFromBesuch(fax)
  }, [createTerminFromBesuch])

  // Verknüpften Termin für ein Fax laden
  const getTerminForFax = useCallback(async (faxId) => {
    if (!faxId) return null

    const { data } = await supabase
      .from('calendar_events')
      .select('*, calendars(name, color)')
      .eq('external_id', faxId)
      .eq('external_source', 'fax_besuchsankuendigung')
      .single()

    return data
  }, [])

  // Termin löschen (z.B. wenn Besuch abgesagt)
  const deleteTerminForFax = useCallback(async (faxId) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('external_id', faxId)
      .eq('external_source', 'fax_besuchsankuendigung')

    return !error
  }, [])

  return {
    loading,
    apothekenKalenderId,
    fetchApothekenKalender,
    createTerminFromBesuch,
    processeFaxBesuch,
    getTerminForFax,
    getExistingTermin,
    deleteTerminForFax,
  }
}
