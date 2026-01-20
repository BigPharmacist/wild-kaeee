import { useState, useCallback } from 'react'
import { supabase } from '../../lib/supabase'

export function useArchiv() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [paperlessConfig, setPaperlessConfig] = useState({ url: null, token: null })
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Metadaten
  const [tags, setTags] = useState([])
  const [correspondents, setCorrespondents] = useState([])
  const [documentTypes, setDocumentTypes] = useState([])
  const [savedViews, setSavedViews] = useState([])
  const [activeSavedView, setActiveSavedView] = useState(null)

  // Filter
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTag, setSelectedTag] = useState(null)
  const [selectedCorrespondent, setSelectedCorrespondent] = useState(null)
  const [selectedType, setSelectedType] = useState(null)

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
      const text = await response.text()
      console.error('Paperless API Error:', response.status, text)
      throw new Error(`Paperless API Fehler: ${response.status}`)
    }

    return response
  }, [paperlessConfig, fetchPaperlessConfig])

  // Dokumente laden mit Filtern
  const fetchDocuments = useCallback(async (query = searchQuery, tagId = selectedTag, correspondentId = selectedCorrespondent, typeId = selectedType) => {
    setLoading(true)
    setError(null)
    try {
      let endpoint = '/documents/?ordering=-created&page_size=10000'

      if (query) {
        endpoint += `&query=${encodeURIComponent(query)}`
      }
      if (tagId) {
        endpoint += `&tags__id=${tagId}`
      }
      if (correspondentId) {
        endpoint += `&correspondent__id=${correspondentId}`
      }
      if (typeId) {
        endpoint += `&document_type__id=${typeId}`
      }

      const response = await paperlessApi(endpoint)
      const data = await response.json()
      setDocuments(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Dokumente:', err)
      setError(err.message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
  }, [paperlessApi, searchQuery, selectedTag, selectedCorrespondent, selectedType])

  // Tags laden
  const fetchTags = useCallback(async () => {
    try {
      const response = await paperlessApi('/tags/')
      const data = await response.json()
      setTags(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Tags:', err)
    }
  }, [paperlessApi])

  // Korrespondenten laden
  const fetchCorrespondents = useCallback(async () => {
    try {
      const response = await paperlessApi('/correspondents/')
      const data = await response.json()
      setCorrespondents(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Korrespondenten:', err)
    }
  }, [paperlessApi])

  // Dokumenttypen laden
  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await paperlessApi('/document_types/')
      const data = await response.json()
      setDocumentTypes(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Dokumenttypen:', err)
    }
  }, [paperlessApi])

  // Saved Views laden
  const fetchSavedViews = useCallback(async () => {
    try {
      const response = await paperlessApi('/saved_views/')
      const data = await response.json()
      setSavedViews(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Saved Views:', err)
    }
  }, [paperlessApi])

  // Alle Metadaten laden
  const fetchMetadata = useCallback(async () => {
    await Promise.all([fetchTags(), fetchCorrespondents(), fetchDocumentTypes(), fetchSavedViews()])
  }, [fetchTags, fetchCorrespondents, fetchDocumentTypes, fetchSavedViews])

  // Saved View erstellen
  const createSavedView = useCallback(async (name) => {
    if (!name?.trim()) {
      setError('Bitte gib einen Namen für die Ansicht ein')
      return false
    }

    try {
      const payload = {
        name: name.trim(),
        show_on_dashboard: false,
        show_in_sidebar: true,
        sort_field: 'created',
        sort_reverse: true,
      }

      // Aktive Filter übernehmen
      if (selectedTag) {
        payload.filter_has_tags = [parseInt(selectedTag)]
      }
      if (selectedCorrespondent) {
        payload.filter_correspondent = parseInt(selectedCorrespondent)
      }
      if (selectedType) {
        payload.filter_document_type = parseInt(selectedType)
      }

      await paperlessApi('/saved_views/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      // Saved Views neu laden
      await fetchSavedViews()
      return true
    } catch (err) {
      console.error('Fehler beim Erstellen der Saved View:', err)
      setError(err.message)
      return false
    }
  }, [paperlessApi, fetchSavedViews, selectedTag, selectedCorrespondent, selectedType])

  // Saved View löschen
  const deleteSavedView = useCallback(async (viewId) => {
    try {
      await paperlessApi(`/saved_views/${viewId}/`, {
        method: 'DELETE',
      })
      await fetchSavedViews()
      return true
    } catch (err) {
      console.error('Fehler beim Löschen der Saved View:', err)
      setError(err.message)
      return false
    }
  }, [paperlessApi, fetchSavedViews])

  // Dokument hochladen
  const uploadDocument = useCallback(async (file, title = null, tagIds = [], correspondentId = null, documentTypeId = null) => {
    setUploading(true)
    setError(null)
    try {
      const formData = new FormData()
      formData.append('document', file)
      if (title) {
        formData.append('title', title)
      }
      if (tagIds.length > 0) {
        tagIds.forEach(id => formData.append('tags', id))
      }
      if (correspondentId) {
        formData.append('correspondent', correspondentId)
      }
      if (documentTypeId) {
        formData.append('document_type', documentTypeId)
      }

      await paperlessApi('/documents/post_document/', {
        method: 'POST',
        body: formData,
      })

      // Liste neu laden nach Upload
      setTimeout(() => fetchDocuments(), 2000) // Paperless braucht Zeit zum Verarbeiten
      return true
    } catch (err) {
      console.error('Fehler beim Hochladen:', err)
      setError(err.message)
      return false
    } finally {
      setUploading(false)
    }
  }, [paperlessApi, fetchDocuments])

  // Dokument herunterladen
  const downloadDocument = useCallback(async (doc) => {
    try {
      const response = await paperlessApi(`/documents/${doc.id}/download/`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = doc.original_file_name || `${doc.title}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Fehler beim Herunterladen:', err)
      setError(err.message)
    }
  }, [paperlessApi])

  // Vorschau laden
  const loadPreview = useCallback(async (doc) => {
    setPreviewLoading(true)
    setSelectedDocument(doc)
    try {
      const response = await paperlessApi(`/documents/${doc.id}/preview/`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      setPreviewUrl(url)
    } catch (err) {
      console.error('Fehler beim Laden der Vorschau:', err)
      try {
        const response = await paperlessApi(`/documents/${doc.id}/thumb/`)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        setPreviewUrl(url)
      } catch {
        setError('Vorschau nicht verfügbar')
      }
    } finally {
      setPreviewLoading(false)
    }
  }, [paperlessApi])

  // Vorschau schließen
  const closePreview = useCallback(() => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedDocument(null)
  }, [previewUrl])

  // Thumbnail laden (als Blob URL)
  const loadThumbnail = useCallback(async (doc) => {
    try {
      const response = await paperlessApi(`/documents/${doc.id}/thumb/`)
      const blob = await response.blob()
      return window.URL.createObjectURL(blob)
    } catch {
      return null
    }
  }, [paperlessApi])

  // Suche ausführen
  const search = useCallback((query) => {
    setSearchQuery(query)
    fetchDocuments(query, selectedTag, selectedCorrespondent, selectedType)
  }, [fetchDocuments, selectedTag, selectedCorrespondent, selectedType])

  // Filter setzen
  const filterByTag = useCallback((tagId) => {
    setSelectedTag(tagId)
    fetchDocuments(searchQuery, tagId, selectedCorrespondent, selectedType)
  }, [fetchDocuments, searchQuery, selectedCorrespondent, selectedType])

  const filterByCorrespondent = useCallback((correspondentId) => {
    setSelectedCorrespondent(correspondentId)
    fetchDocuments(searchQuery, selectedTag, correspondentId, selectedType)
  }, [fetchDocuments, searchQuery, selectedTag, selectedType])

  const filterByType = useCallback((typeId) => {
    setSelectedType(typeId)
    fetchDocuments(searchQuery, selectedTag, selectedCorrespondent, typeId)
  }, [fetchDocuments, searchQuery, selectedTag, selectedCorrespondent])

  // Alle Filter zurücksetzen
  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedTag(null)
    setSelectedCorrespondent(null)
    setSelectedType(null)
    setActiveSavedView(null)
    fetchDocuments('', null, null, null)
  }, [fetchDocuments])

  // Nach Saved View filtern
  const filterBySavedView = useCallback(async (viewId) => {
    if (!viewId) {
      setActiveSavedView(null)
      fetchDocuments('', null, null, null)
      return
    }

    const view = savedViews.find(v => v.id === parseInt(viewId))
    if (!view) return

    setActiveSavedView(view)
    setLoading(true)
    setError(null)

    try {
      // Saved View Filter-Parameter in Query umwandeln
      let endpoint = '/documents/?ordering=-created&page_size=10000'

      if (view.filter_correspondent) {
        endpoint += `&correspondent__id=${view.filter_correspondent}`
      }
      if (view.filter_document_type) {
        endpoint += `&document_type__id=${view.filter_document_type}`
      }
      if (view.filter_has_tags) {
        view.filter_has_tags.forEach(tagId => {
          endpoint += `&tags__id=${tagId}`
        })
      }
      if (view.filter_has_correspondent) {
        endpoint += `&correspondent__isnull=false`
      }
      if (view.filter_has_document_type) {
        endpoint += `&document_type__isnull=false`
      }

      const response = await paperlessApi(endpoint)
      const data = await response.json()
      setDocuments(data.results || [])
    } catch (err) {
      console.error('Fehler beim Laden der Saved View:', err)
      setError(err.message)
      setDocuments([])
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedViews, paperlessApi])

  // Helper: Tag-Namen für Dokument
  const getTagsForDocument = useCallback((doc) => {
    if (!doc.tags || doc.tags.length === 0) return []
    return doc.tags.map(tagId => tags.find(t => t.id === tagId)).filter(Boolean)
  }, [tags])

  // Helper: Korrespondent-Name für Dokument
  const getCorrespondentForDocument = useCallback((doc) => {
    if (!doc.correspondent) return null
    return correspondents.find(c => c.id === doc.correspondent)
  }, [correspondents])

  // Helper: Dokumenttyp für Dokument
  const getTypeForDocument = useCallback((doc) => {
    if (!doc.document_type) return null
    return documentTypes.find(t => t.id === doc.document_type)
  }, [documentTypes])

  return {
    // Daten
    documents,
    tags,
    correspondents,
    documentTypes,
    savedViews,

    // Status
    loading,
    uploading,
    error,
    selectedDocument,
    previewUrl,
    previewLoading,

    // Filter-State
    searchQuery,
    selectedTag,
    selectedCorrespondent,
    selectedType,
    activeSavedView,

    // Aktionen
    fetchDocuments,
    fetchMetadata,
    uploadDocument,
    downloadDocument,
    loadPreview,
    closePreview,
    loadThumbnail,
    fetchPaperlessConfig,

    // Such- und Filter-Funktionen
    search,
    filterByTag,
    filterByCorrespondent,
    filterByType,
    filterBySavedView,
    clearFilters,
    createSavedView,
    deleteSavedView,

    // Helper
    getTagsForDocument,
    getCorrespondentForDocument,
    getTypeForDocument,
  }
}
