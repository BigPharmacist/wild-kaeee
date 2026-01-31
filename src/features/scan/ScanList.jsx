import { Trash, Plus, Minus, Pill, Warning, CheckCircle } from '@phosphor-icons/react'
import { formatCodeType, truncateCode, isUrl, parseDataMatrixCode, validatePzn, extractPznFromBarcode } from './scanUtils'

const ScanList = ({
  scans,
  scansLoading,
  onDelete,
  onUpdateQuantity,
  theme,
}) => {
  if (scansLoading) {
    return (
      <div className={`${theme.textMuted} text-center py-8`}>
        Scans werden geladen...
      </div>
    )
  }

  if (scans.length === 0) {
    return (
      <div className={`${theme.textMuted} text-center py-8`}>
        Noch keine Scans in dieser Session.
        <br />
        <span className="text-sm">Halte einen Barcode oder QR-Code vor die Kamera.</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {scans.map((scan) => {
        // Parse pharmaceutical DataMatrix codes
        const pharmaData = parseDataMatrixCode(scan.code)
        // Falls kein DataMatrix, versuche Barcode
        const barcodeData = !pharmaData ? extractPznFromBarcode(scan.code) : null
        // PZN aus einer der Quellen
        const pzn = pharmaData?.pzn || barcodeData?.pzn
        // Validate PZN if available
        const pznValidation = pzn ? validatePzn(pzn) : null
        // Ist es ein Pharma-Produkt (DataMatrix oder Barcode mit PZN)?
        const isPharma = pharmaData || (barcodeData && pzn)

        return (
          <div
            key={scan.id}
            className={`${theme.surface} border ${theme.border} rounded-xl p-3 ${
              isPharma
                ? pznValidation?.valid
                  ? 'border-l-4 border-l-teal-500'
                  : 'border-l-4 border-l-amber-500'
                : ''
            }`}
          >
            {isPharma ? (
              // Pharmaceutical code display
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                  pznValidation?.valid ? 'bg-teal-100' : 'bg-amber-100'
                }`}>
                  <Pill size={18} className={pznValidation?.valid ? 'text-teal-600' : 'text-amber-600'} weight="fill" />
                </div>

                <div className="flex-1 min-w-0">
                  {/* Article name if available */}
                  {(scan.article_name || scan.notes) && (
                    <div className={`${theme.text} font-medium text-sm mb-1 truncate`} title={scan.article_name || scan.notes}>
                      {scan.article_name || scan.notes}
                    </div>
                  )}

                  {/* PZN & Quantity */}
                  <div className="flex items-center justify-between">
                    <div className={`${theme.textSecondary} text-xs flex items-center gap-1.5`}>
                      <span>PZN {pzn || '–'}</span>
                      {pznValidation && (
                        pznValidation.valid ? (
                          <CheckCircle size={12} className="text-teal-500" weight="fill" title="PZN gültig" />
                        ) : (
                          <Warning size={12} className="text-amber-500" weight="fill" title={pznValidation.error} />
                        )
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onUpdateQuantity(scan.id, scan.quantity - 1)}
                        disabled={scan.quantity <= 1}
                        className={`p-1 rounded ${
                          scan.quantity <= 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : `${theme.textSecondary} hover:bg-slate-100`
                        }`}
                      >
                        <Minus size={14} weight="bold" />
                      </button>
                      <span className={`${theme.text} font-semibold min-w-[2rem] text-center`}>
                        x{scan.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(scan.id, scan.quantity + 1)}
                        className={`p-1 rounded ${theme.textSecondary} hover:bg-slate-100`}
                      >
                        <Plus size={14} weight="bold" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Scan löschen?')) {
                            onDelete(scan.id)
                          }
                        }}
                        className={`p-1 rounded ${theme.danger} ml-1`}
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Pharma details (nur bei DataMatrix) */}
                  {pharmaData && (pharmaData.batch || pharmaData.expiryFormatted || pharmaData.serialNumber) && (
                    <div className={`${theme.textSecondary} text-xs mt-1 space-y-0.5`}>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                        {pharmaData.batch && (
                          <span>Charge: <span className="font-medium">{pharmaData.batch}</span></span>
                        )}
                        {pharmaData.expiryFormatted && (
                          <span>Verfall: <span className="font-medium">{pharmaData.expiryFormatted}</span></span>
                        )}
                      </div>
                      {pharmaData.serialNumber && (
                        <div className={`${theme.textMuted} font-mono text-[10px] truncate`}>
                          S/N: {pharmaData.serialNumber}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Time */}
                  <div className={`${theme.textMuted} text-xs mt-1`}>
                    {new Date(scan.scanned_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            ) : (
              // Regular code display
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className={`${theme.text} font-mono text-sm truncate`}>
                    {isUrl(scan.code) ? (
                      <a
                        href={scan.code}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {truncateCode(scan.code, 40)}
                      </a>
                    ) : (
                      truncateCode(scan.code, 40)
                    )}
                  </div>
                  <div className={`${theme.textMuted} text-xs flex items-center gap-2 mt-0.5`}>
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded">
                      {formatCodeType(scan.code_type)}
                    </span>
                    <span>
                      {new Date(scan.scanned_at).toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onUpdateQuantity(scan.id, scan.quantity - 1)}
                    disabled={scan.quantity <= 1}
                    className={`p-1.5 rounded-lg ${
                      scan.quantity <= 1
                        ? 'text-slate-300 cursor-not-allowed'
                        : `${theme.textSecondary} hover:bg-slate-100`
                    }`}
                  >
                    <Minus size={16} weight="bold" />
                  </button>

                  <span className={`${theme.text} font-semibold min-w-[2.5rem] text-center`}>
                    x{scan.quantity}
                  </span>

                  <button
                    onClick={() => onUpdateQuantity(scan.id, scan.quantity + 1)}
                    className={`p-1.5 rounded-lg ${theme.textSecondary} hover:bg-slate-100`}
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => {
                    if (confirm('Scan löschen?')) {
                      onDelete(scan.id)
                    }
                  }}
                  className={`p-2 rounded-lg ${theme.danger}`}
                >
                  <Trash size={18} />
                </button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default ScanList
