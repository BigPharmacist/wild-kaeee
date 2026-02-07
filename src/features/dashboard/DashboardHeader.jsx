import { useNavigate } from '@tanstack/react-router'
import { useTheme, useNavigation, useUnreadCounts } from '../../context'
import { useHeaderActions } from '../../context/HeaderActionsContext'
import { Icons } from '../../shared/ui'
import { useFaxCounts, useUrgentFax } from '../fax'
import SplitFlapDisplay from './SplitFlapDisplay'

/**
 * DashboardHeader - Self-sufficient header component
 * Pulls navigation, theme, fax data from contexts
 * Camera/scan features via HeaderActionsContext (populated by DashboardLayout)
 */
const DashboardHeader = () => {
  const { theme } = useTheme()
  const { activeView, settingsTab, dokumenteTab, mobileNavOpen, setMobileNavOpen, setActiveView, setDokumenteTab } = useNavigation()
  const navigate = useNavigate()
  const { count: faxCount } = useFaxCounts()
  const { urgentFaxe } = useUrgentFax()
  const { gesundCount } = useUnreadCounts()
  const { headerActions } = useHeaderActions()

  // Camera/scan features (available when DashboardLayout is active)
  const hasCameraFeatures = !!headerActions
  const {
    businessCardScanRef,
    cameraInputRef,
    photoUploading = false,
    businessCardScanning = false,
    handleCameraCapture,
    BusinessCardScanInput,
    handleBusinessCardScan,
    pznCameraInputRef,
    handlePznCameraCapture,
  } = headerActions || {}

  return (
    <header className={`bg-white border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40 relative`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          className={`lg:hidden p-2 rounded-[6px] ${theme.textSecondary} hover:bg-[#FEF3C7]`}
          title={mobileNavOpen ? 'Menü schließen' : 'Menü öffnen'}
        >
          {mobileNavOpen ? <Icons.X /> : <Icons.Menu />}
        </button>
        <img src="/logo.png" alt="Kaeee" className="h-8" />

        <div className="hidden lg:block absolute left-[17rem]">
          <SplitFlapDisplay
            charCount={32}
            interval={30000}
            urgentFaxe={urgentFaxe}
            faxCount={faxCount}
            gesundCount={gesundCount}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {hasCameraFeatures && (
          <>
            <button
              onClick={() => {
                if (activeView === 'settings' && settingsTab === 'contacts') {
                  businessCardScanRef?.current?.click()
                } else {
                  cameraInputRef?.current?.click()
                }
              }}
              className={`p-2 rounded-[6px] hover:bg-[#FEF3C7] ${theme.textSecondary} transition-colors ${(photoUploading || businessCardScanning) ? 'opacity-50' : ''}`}
              title={(activeView === 'settings' && settingsTab === 'contacts') ? 'Visitenkarte scannen' : 'Foto aufnehmen'}
              disabled={photoUploading || businessCardScanning}
            >
              {businessCardScanning ? (
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <Icons.Camera />
              )}
            </button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraCapture}
              className="hidden"
            />
            {BusinessCardScanInput && (
              <BusinessCardScanInput
                inputRef={businessCardScanRef}
                onScan={handleBusinessCardScan}
              />
            )}
            <input
              ref={pznCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePznCameraCapture}
              className="hidden"
            />
          </>
        )}

        <button
          onClick={() => { setActiveView('dokumente'); setDokumenteTab('rechnungen'); navigate({ to: '/rechnungen' }) }}
          className={`p-2 rounded-[6px] hover:bg-[#FEF3C7] ${activeView === 'dokumente' && dokumenteTab === 'rechnungen' ? theme.accentText : theme.textSecondary} transition-colors`}
          title="GH-Rechnungen"
        >
          <Icons.FileText />
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader
