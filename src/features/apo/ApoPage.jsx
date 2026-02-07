import { lazy } from 'react'
import { supabase, supabaseUrl } from '../../lib/supabase'
import { downloadAmkPdf, downloadRecallPdf } from '../../lib/pdfGenerator'
import { useTheme, useAuth, usePharmacy, useStaff, useNavigation } from '../../context'
import { useApoState } from './hooks/useApoState'
import { Icons } from '../../shared/ui'

const ApoView = lazy(() => import('./ApoView'))
const ApoDetailModal = lazy(() => import('./ApoDetailModal'))
const ApoDokumentationModal = lazy(() => import('./ApoDokumentationModal'))
const ReactMarkdown = lazy(() => import('react-markdown'))
import remarkGfm from 'remark-gfm'

export default function ApoPage() {
  const { theme } = useTheme()
  const { session } = useAuth()
  const { pharmacies } = usePharmacy()
  const { currentStaff, staffByAuthId } = useStaff()
  const { apoTab, activeView } = useNavigation()

  const apoState = useApoState({
    session,
    activeView,
    apoTab,
    staffByAuthId,
    pharmacies,
  })

  const handleDownloadAmkPdf = (msg) => downloadAmkPdf(msg, supabase, supabaseUrl)
  const handleDownloadRecallPdf = (msg) => downloadRecallPdf(msg, supabase, supabaseUrl)

  return (
    <>
      <ApoView
        theme={theme}
        Icons={Icons}
        apoYear={apoState.apoYear}
        changeApoYear={apoState.changeApoYear}
        apoSearch={apoState.apoSearch}
        setApoSearch={apoState.setApoSearch}
        apoTab={apoTab}
        amkLoading={apoState.amkLoading}
        amkMessages={apoState.amkMessages}
        recallLoading={apoState.recallLoading}
        recallMessages={apoState.recallMessages}
        lavLoading={apoState.lavLoading}
        lavAusgaben={apoState.lavAusgaben}
        rhbLoading={apoState.rhbLoading}
        rhbMessages={apoState.rhbMessages}
        filterApoItems={apoState.filterApoItems}
        groupByMonth={apoState.groupByMonth}
        monthNames={apoState.monthNames}
        currentStaff={currentStaff}
        readMessageIds={apoState.readMessageIds}
        setSelectedApoMessage={apoState.setSelectedApoMessage}
        markAsRead={apoState.markAsRead}
        loadDokumentationen={apoState.loadDokumentationen}
        ReactMarkdown={ReactMarkdown}
        remarkGfm={remarkGfm}
      />

      <ApoDetailModal
        theme={theme}
        Icons={Icons}
        selectedApoMessage={apoState.selectedApoMessage}
        setSelectedApoMessage={apoState.setSelectedApoMessage}
        existingDokumentationen={apoState.existingDokumentationen}
        onOpenDokumentationModal={() => {
          apoState.setDokumentationBemerkung('')
          apoState.setDokumentationSignature(null)
          apoState.setShowSignatureCanvas(false)
          apoState.setShowDokumentationModal(true)
        }}
        onDownloadAmkPdf={handleDownloadAmkPdf}
        onDownloadRecallPdf={handleDownloadRecallPdf}
        handlePznClick={apoState.handlePznClick}
        pznFotoUploading={apoState.pznFotoUploading}
        activePzn={apoState.activePzn}
        savedPznFotos={apoState.savedPznFotos}
        supabaseUrl={supabaseUrl}
      />

      <ApoDokumentationModal
        theme={theme}
        Icons={Icons}
        show={apoState.showDokumentationModal}
        onClose={() => apoState.setShowDokumentationModal(false)}
        selectedApoMessage={apoState.selectedApoMessage}
        existingDokumentationen={apoState.existingDokumentationen}
        dokumentationBemerkung={apoState.dokumentationBemerkung}
        setDokumentationBemerkung={apoState.setDokumentationBemerkung}
        dokumentationSignature={apoState.dokumentationSignature}
        setDokumentationSignature={apoState.setDokumentationSignature}
        showSignatureCanvas={apoState.showSignatureCanvas}
        setShowSignatureCanvas={apoState.setShowSignatureCanvas}
        dokumentationLoading={apoState.dokumentationLoading}
        saveDokumentation={apoState.saveDokumentation}
        savedPznFotos={apoState.savedPznFotos}
        supabaseUrl={supabaseUrl}
      />
    </>
  )
}
