const DashboardHeader = ({
  theme,
  mobileNavOpen,
  setMobileNavOpen,
  activeView,
  settingsTab,
  businessCardScanRef,
  cameraInputRef,
  photoUploading,
  businessCardScanning,
  handleCameraCapture,
  BusinessCardScanInput,
  handleBusinessCardScan,
  pznCameraInputRef,
  handlePznCameraCapture,
  setActiveView,
  currentStaff,
  session,
  handleSignOut,
  Icons,
}) => (
  <header className={`bg-white border-b ${theme.border} px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-40`}>
    <div className="flex items-center gap-3">
      <button
        onClick={() => setMobileNavOpen(!mobileNavOpen)}
        className={`lg:hidden p-2 rounded-[6px] ${theme.textSecondary} hover:bg-[#FFEBB0]`}
        title={mobileNavOpen ? 'Menü schließen' : 'Menü öffnen'}
      >
        {mobileNavOpen ? <Icons.X /> : <Icons.Menu />}
      </button>
      <img src="/logo.png" alt="Kaeee" className="h-8" />
    </div>

    <div className="flex items-center gap-2 sm:gap-4">
      <button
        onClick={() => {
          if (activeView === 'settings' && settingsTab === 'contacts') {
            businessCardScanRef.current?.click()
          } else {
            cameraInputRef.current?.click()
          }
        }}
        className={`p-2 rounded-[6px] hover:bg-[#FFEBB0] ${theme.textSecondary} transition-colors ${(photoUploading || businessCardScanning) ? 'opacity-50' : ''}`}
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
      <BusinessCardScanInput
        inputRef={businessCardScanRef}
        onScan={handleBusinessCardScan}
      />
      <input
        ref={pznCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePznCameraCapture}
        className="hidden"
      />

      <button
        onClick={() => setActiveView('rechnungen')}
        className={`p-2 rounded-[6px] hover:bg-[#FFEBB0] ${activeView === 'rechnungen' ? theme.accentText : theme.textSecondary} transition-colors`}
        title="GH-Rechnungen"
      >
        <Icons.FileText />
      </button>

      <div className="hidden sm:flex items-center gap-2">
        {currentStaff?.avatar_url ? (
          <img
            src={currentStaff.avatar_url}
            alt={session.user.email}
            className={`h-9 w-9 rounded-full object-cover border ${theme.border}`}
          />
        ) : (
          <div className={`h-9 w-9 rounded-full border ${theme.border} flex items-center justify-center text-xs ${theme.textMuted}`}>
            {session.user.email?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      <button
        onClick={handleSignOut}
        className={`p-2 rounded-[6px] ${theme.danger} transition-colors`}
        title="Ausloggen"
      >
        <Icons.Logout />
      </button>
    </div>
  </header>
)

export default DashboardHeader
