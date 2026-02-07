import { useEffect, useCallback } from 'react'
import { useTheme, useNavigation } from '../../context'
import { useSecondaryNav } from '../../context/SecondaryNavContext'
import { useArchiv } from './useArchiv'
import ArchivView from './ArchivView'

export default function ArchivPage() {
  const { theme } = useTheme()
  const { archivTab, handleSecondarySelect } = useNavigation()
  const { setDynamicNavData, setSecondarySelectOverride } = useSecondaryNav()

  const {
    documents,
    tags,
    correspondents,
    documentTypes,
    loading,
    uploading,
    error,
    selectedDocument,
    previewUrl,
    previewLoading,
    searchQuery,
    selectedTag,
    selectedCorrespondent,
    selectedType,
    fetchDocuments,
    fetchMetadata,
    uploadDocument,
    downloadDocument,
    loadPreview,
    closePreview,
    loadThumbnail,
    fetchPaperlessConfig,
    search,
    filterByTag,
    filterByCorrespondent,
    filterByType,
    filterBySavedView,
    clearFilters,
    createSavedView,
    deleteSavedView,
    getTagsForDocument,
    getCorrespondentForDocument,
    getTypeForDocument,
    savedViews,
    activeSavedView,
  } = useArchiv()

  // Load archiv config + metadata on mount
  useEffect(() => {
    fetchPaperlessConfig().then(() => {
      fetchMetadata()
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Populate SecondaryNavContext with archiv-specific data
  useEffect(() => {
    setDynamicNavData({ archivDocumentTypes: documentTypes, archivSavedViews: savedViews })
  }, [documentTypes, savedViews, setDynamicNavData])

  // Handle archiv-specific secondary nav selection (type/view filtering)
  const handleArchivSecondarySelect = useCallback((itemId) => {
    if (itemId === 'divider') return
    handleSecondarySelect(itemId)
    if (itemId === 'alle') {
      clearFilters()
    } else if (itemId.startsWith('type-')) {
      filterByType(itemId.replace('type-', ''))
    } else if (itemId.startsWith('view-')) {
      filterBySavedView(itemId.replace('view-', ''))
    }
  }, [handleSecondarySelect, clearFilters, filterByType, filterBySavedView])

  useEffect(() => {
    setSecondarySelectOverride(() => handleArchivSecondarySelect)
    return () => setSecondarySelectOverride(null)
  }, [handleArchivSecondarySelect, setSecondarySelectOverride])

  return (
    <ArchivView
      theme={theme}
      documents={documents}
      tags={tags}
      correspondents={correspondents}
      documentTypes={documentTypes}
      loading={loading}
      uploading={uploading}
      error={error}
      selectedDocument={selectedDocument}
      previewUrl={previewUrl}
      previewLoading={previewLoading}
      searchQuery={searchQuery}
      selectedTag={selectedTag}
      selectedCorrespondent={selectedCorrespondent}
      selectedType={selectedType}
      fetchDocuments={fetchDocuments}
      fetchMetadata={fetchMetadata}
      uploadDocument={uploadDocument}
      downloadDocument={downloadDocument}
      loadPreview={loadPreview}
      closePreview={closePreview}
      loadThumbnail={loadThumbnail}
      fetchPaperlessConfig={fetchPaperlessConfig}
      search={search}
      filterByTag={filterByTag}
      filterByCorrespondent={filterByCorrespondent}
      filterByType={filterByType}
      filterBySavedView={filterBySavedView}
      clearFilters={clearFilters}
      getTagsForDocument={getTagsForDocument}
      getCorrespondentForDocument={getCorrespondentForDocument}
      getTypeForDocument={getTypeForDocument}
      savedViews={savedViews}
      activeSavedView={activeSavedView}
      activeTab={archivTab}
      createSavedView={createSavedView}
      deleteSavedView={deleteSavedView}
    />
  )
}
