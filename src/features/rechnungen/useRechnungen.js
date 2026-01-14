import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export function useRechnungen() {
  const [rechnungen, setRechnungen] = useState([])
  const [rechnungenLoading, setRechnungenLoading] = useState(false)
  const [collapsedDays, setCollapsedDays] = useState({})
  const [pdfModalOpen, setPdfModalOpen] = useState(false)
  const [selectedPdf, setSelectedPdf] = useState(null)

  const fetchRechnungen = async () => {
    setRechnungenLoading(true)
    const { data, error } = await supabase
      .from('rechnungen')
      .select('*')
      .order('datum', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Fehler beim Laden der Rechnungen:', error.message)
      setRechnungen([])
    } else {
      setRechnungen(data || [])
    }
    setRechnungenLoading(false)
  }

  const openPdfModal = async (rechnung) => {
    const { data, error } = await supabase.storage
      .from('rechnungen')
      .createSignedUrl(rechnung.storage_path, 3600)

    if (error) {
      console.error('Fehler beim Erstellen der PDF-URL:', error.message)
      return
    }

    setSelectedPdf({
      ...rechnung,
      url: data.signedUrl
    })
    setPdfModalOpen(true)
  }

  const closePdfModal = () => {
    setPdfModalOpen(false)
    setSelectedPdf(null)
  }

  const toggleDayCollapsed = (dateKey) => {
    setCollapsedDays((prev) => ({
      ...prev,
      [dateKey]: !prev[dateKey]
    }))
  }

  return {
    rechnungen,
    rechnungenLoading,
    collapsedDays,
    pdfModalOpen,
    selectedPdf,
    fetchRechnungen,
    openPdfModal,
    closePdfModal,
    toggleDayCollapsed,
    setCollapsedDays,
  }
}
