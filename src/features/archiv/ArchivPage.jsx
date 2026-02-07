import { useEffect } from 'react'
import { useTheme } from '../../context'
import { useArchiv } from './useArchiv'
import ArchivView from './ArchivView'

export default function ArchivPage() {
  const { theme } = useTheme()

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
      activeTab="alle"
      createSavedView={createSavedView}
      deleteSavedView={deleteSavedView}
    />
  )
}
