import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useRechnungen() {
  const [paperlessRechnungen, setPaperlessRechnungen] = useState([])
  const [paperlessLoading, setPaperlessLoading] = useState(false)
  const [paperlessConfig, setPaperlessConfig] = useState({ url: null, token: null })
  const [paperlessPdfModalOpen, setPaperlessPdfModalOpen] = useState(false)
  const [selectedPaperlessPdf, setSelectedPaperlessPdf] = useState(null)

  // Paperless Konfiguration aus Supabase laden
  const fetchPaperlessConfig = useCallback(async () => {
    const { data: urlData } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'paperless_url')
      .single()

    const { data: tokenData } = await supabase
      .from('api_keys')
      .select('key')
      .eq('name', 'paperless_token')
      .single()

    if (urlData && tokenData) {
      const config = { url: urlData.key, token: tokenData.key }
      setPaperlessConfig(config)
      return config
    }
    return null
  }, [])

  // API-Aufruf Helper
  const paperlessApi = useCallback(async (endpoint, options = {}) => {
    let config = paperlessConfig
    if (!config.url || !config.token) {
      config = await fetchPaperlessConfig()
      if (!config) {
        throw new Error('Paperless nicht konfiguriert')
      }
    }

    const url = `${config.url}/api${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        'Accept': 'application/json',
        'Authorization': `Token ${config.token}`,
        ...options.headers,
      },
    })

    if (!response.ok) {
      throw new Error(`Paperless API Fehler: ${response.status}`)
    }

    return response
  }, [paperlessConfig, fetchPaperlessConfig])

  // Paperless Rechnungen laden (Saved View "Rechnungsdatum 8 Tage")
  const fetchPaperlessRechnungen = useCallback(async () => {
    setPaperlessLoading(true)
    try {
      // Parallel: Korrespondenten und Saved Views laden
      const [corrsResponse, viewsResponse] = await Promise.all([
        paperlessApi('/correspondents/'),
        paperlessApi('/saved_views/')
      ])

      const [corrsData, viewsData] = await Promise.all([
        corrsResponse.json(),
        viewsResponse.json()
      ])

      const corrs = corrsData.results || []

      const savedView = (viewsData.results || []).find(v =>
        v.name.toLowerCase().includes('rechnungsdatum') && v.name.includes('8')
      )

      if (!savedView) {
        console.error('Saved View "Rechnungsdatum 8 Tage" nicht gefunden')
        setPaperlessRechnungen([])
        setPaperlessLoading(false)
        return
      }

      // Filter-Endpoint aus Saved View bauen
      let filterEndpoint = '/documents/?page_size=500'

      if (savedView.sort_field) {
        filterEndpoint += `&ordering=${savedView.sort_reverse ? '-' : ''}${savedView.sort_field}`
      }

      if (savedView.filter_rules && savedView.filter_rules.length > 0) {
        for (const rule of savedView.filter_rules) {
          if (rule.rule_type === 20 && rule.value) {
            filterEndpoint += `&query=${encodeURIComponent(rule.value)}`
          } else if (rule.rule_type === 3 && rule.value) {
            filterEndpoint += `&correspondent__id=${rule.value}`
          } else if (rule.rule_type === 6 && rule.value) {
            filterEndpoint += `&tags__id__all=${rule.value}`
          } else if (rule.rule_type === 4 && rule.value) {
            filterEndpoint += `&document_type__id=${rule.value}`
          }
        }
      }

      // Dokumente laden
      const response = await paperlessApi(filterEndpoint)
      const data = await response.json()

      // Dokumente mit Korrespondent-Namen anreichern
      const enrichedDocs = (data.results || []).map(doc => {
        const correspondent = corrs.find(c => c.id === doc.correspondent)
        let rechnungsDatum = null
        if (doc.custom_fields && Array.isArray(doc.custom_fields)) {
          const datumField = doc.custom_fields.find(cf =>
            cf.value && typeof cf.value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(cf.value)
          )
          if (datumField) {
            rechnungsDatum = datumField.value
          }
        }
        return {
          ...doc,
          correspondentName: correspondent?.name || 'Unbekannt',
          datum: rechnungsDatum || (doc.created ? doc.created.split('T')[0] : null),
          grosshaendler: getGrosshaendler(correspondent?.name),
        }
      })

      setPaperlessRechnungen(enrichedDocs)
    } catch (err) {
      console.error('Fehler beim Laden der Paperless Rechnungen:', err)
      setPaperlessRechnungen([])
    } finally {
      setPaperlessLoading(false)
    }
  }, [paperlessApi]) // eslint-disable-line react-hooks/exhaustive-deps

  // Paperless PDF öffnen (lädt als Blob für Authorization)
  const openPaperlessPdfModal = useCallback(async (doc) => {
    try {
      const response = await paperlessApi(`/documents/${doc.id}/preview/`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      setSelectedPaperlessPdf({
        ...doc,
        url,
        isObjectUrl: true,
      })
      setPaperlessPdfModalOpen(true)
    } catch (err) {
      console.error('Fehler beim Öffnen des Paperless PDFs:', err)
    }
  }, [paperlessApi])

  const closePaperlessPdfModal = useCallback(() => {
    if (selectedPaperlessPdf?.isObjectUrl && selectedPaperlessPdf?.url) {
      window.URL.revokeObjectURL(selectedPaperlessPdf.url)
    }
    setPaperlessPdfModalOpen(false)
    setSelectedPaperlessPdf(null)
  }, [selectedPaperlessPdf])

  return {
    paperlessRechnungen,
    paperlessLoading,
    paperlessPdfModalOpen,
    selectedPaperlessPdf,
    fetchPaperlessRechnungen,
    openPaperlessPdfModal,
    closePaperlessPdfModal,
  }
}

function getGrosshaendler(correspondentName) {
  const name = (correspondentName || '').toLowerCase()
  if (name.includes('phoenix')) return 'phoenix'
  if (name.includes('sanacorp')) return 'sanacorp'
  if (name.includes('ahd')) return 'ahd'
  return 'sonstige'
}
