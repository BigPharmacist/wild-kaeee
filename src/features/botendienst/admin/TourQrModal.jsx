import { useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, Copy, Check } from '@phosphor-icons/react'
import { useState } from 'react'

export function TourQrModal({ theme, isOpen, onClose, tour, baseUrl }) {
  const [copied, setCopied] = useState(false)
  const printRef = useRef(null)

  if (!isOpen || !tour) return null

  const driverUrl = `${baseUrl}/fahrer/${tour.access_token}`

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(driverUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Kopieren fehlgeschlagen:', err)
    }
  }

  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR-Code: ${tour.name || 'Tour'}</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            @media print {
              html, body {
                width: 210mm;
                height: 297mm;
              }
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
              box-sizing: border-box;
            }
            .container {
              text-align: center;
              max-width: 400px;
            }
            h1 {
              font-size: 24px;
              margin-bottom: 8px;
              color: #1E293B;
            }
            .date {
              font-size: 16px;
              color: #64748B;
              margin-bottom: 24px;
            }
            .qr-container {
              background: white;
              padding: 24px;
              border-radius: 16px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              display: inline-block;
              margin-bottom: 24px;
            }
            .instructions {
              font-size: 14px;
              color: #64748B;
              line-height: 1.5;
            }
            .url {
              font-size: 12px;
              color: #94A3B8;
              word-break: break-all;
              margin-top: 16px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>${tour.name || 'Botendienst Tour'}</h1>
            <p class="date">${new Date(tour.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</p>
            <div class="qr-container">
              ${printContent.querySelector('svg').outerHTML}
            </div>
            <p class="instructions">
              Scannen Sie diesen QR-Code mit Ihrem Smartphone,<br/>
              um die Tour im Fahrer-Modus zu öffnen.
            </p>
            <p class="url">${driverUrl}</p>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl max-w-md w-full overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
            QR-Code für Fahrer
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.bgHover}`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className={`text-lg font-medium ${theme.textPrimary} mb-1`}>
            {tour.name || 'Tour'}
          </h3>
          <p className={`text-sm ${theme.textMuted} mb-6`}>
            {formatDate(tour.date)}
          </p>

          {/* QR Code */}
          <div
            ref={printRef}
            className="inline-block p-6 bg-white rounded-2xl shadow-lg mb-6"
          >
            <QRCodeSVG
              value={driverUrl}
              size={200}
              level="H"
              includeMargin={false}
              bgColor="#ffffff"
              fgColor="#1E293B"
            />
          </div>

          <p className={`text-sm ${theme.textMuted} mb-4`}>
            Scannen Sie diesen Code mit dem Smartphone,<br />
            um direkt in den Fahrer-Modus zu gelangen.
          </p>

          {/* URL */}
          <div className={`p-3 rounded-lg ${theme.bg} mb-4`}>
            <p className={`text-xs ${theme.textMuted} break-all font-mono`}>
              {driverUrl}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCopy}
              className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border ${theme.border} ${theme.textSecondary} hover:bg-gray-50`}
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-500" />
                  Kopiert
                </>
              ) : (
                <>
                  <Copy size={18} />
                  Link kopieren
                </>
              )}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#F59E0B] text-white hover:bg-[#D97706]"
            >
              <Printer size={18} />
              Drucken
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
