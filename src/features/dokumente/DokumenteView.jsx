import BriefEditor from './BriefEditor'

const DokumenteView = ({
  theme,
  dokumenteTab,
  pharmacies,
  aiSettings,
}) => {
  // Briefe-Tab hat eigenes Layout
  if (dokumenteTab === 'briefe') {
    return <BriefEditor theme={theme} pharmacies={pharmacies} aiSettings={aiSettings} />
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight">Dokumente</h2>
      </div>

      <div className={`${theme.panel} rounded-2xl p-6 border ${theme.border} ${theme.cardShadow}`}>
        {dokumenteTab === 'alle' && (
          <div>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Alle Dokumente</h3>
            <p className={theme.textMuted}>Hier werden alle Dokumente angezeigt.</p>
          </div>
        )}

        {dokumenteTab === 'rechnungen' && (
          <div>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Rechnungen</h3>
            <p className={theme.textMuted}>Hier werden Rechnungen angezeigt.</p>
          </div>
        )}

        {dokumenteTab === 'vertraege' && (
          <div>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Verträge</h3>
            <p className={theme.textMuted}>Hier werden Verträge angezeigt.</p>
          </div>
        )}

        {dokumenteTab === 'sonstiges' && (
          <div>
            <h3 className={`text-lg font-medium mb-4 ${theme.text}`}>Sonstiges</h3>
            <p className={theme.textMuted}>Hier werden sonstige Dokumente angezeigt.</p>
          </div>
        )}
      </div>
    </>
  )
}

export default DokumenteView
