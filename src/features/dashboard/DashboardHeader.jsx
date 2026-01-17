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
  Icons,
  urgentFaxe = [],
  onUrgentFaxClick,
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

      {urgentFaxe.length > 0 && (() => {
        // Ältestes Fax zuerst (aufsteigend nach Datum)
        const sorted = [...urgentFaxe].sort((a, b) =>
          new Date(a.fax_received_at) - new Date(b.fax_received_at)
        )
        const oldest = sorted[0]
        const rest = sorted.slice(1)

        return (
          <div className="flex items-center gap-1.5 ml-2">
            {/* Ältestes Fax - vollständig */}
            <button
              type="button"
              onClick={() => onUrgentFaxClick?.(oldest.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm max-w-[280px] cursor-pointer hover:opacity-90 transition-opacity ${
                oldest.prioritaet === 'ROT' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
              }`}
              title={`${oldest.absender}: ${oldest.zusammenfassung}`}
            >
              <Icons.PostHorn className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium truncate">{oldest.absender}</span>
              <span className="hidden sm:inline text-white/80 truncate">
                {oldest.zusammenfassung?.slice(0, 40)}{oldest.zusammenfassung?.length > 40 ? '…' : ''}
              </span>
            </button>

            {/* Weitere Faxe - kompakt */}
            {rest.map((fax) => (
              <button
                type="button"
                key={fax.id}
                onClick={() => onUrgentFaxClick?.(fax.id)}
                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-white text-xs cursor-pointer hover:opacity-90 transition-opacity ${
                  fax.prioritaet === 'ROT' ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'
                }`}
                title={`${fax.absender}: ${fax.zusammenfassung}`}
              >
                <Icons.PostHorn className="w-3 h-3 flex-shrink-0" />
                <span className="font-medium truncate max-w-[50px]">{fax.absender?.slice(0, 6)}</span>
              </button>
            ))}
          </div>
        )
      })()}
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
    </div>
  </header>
)

export default DashboardHeader
