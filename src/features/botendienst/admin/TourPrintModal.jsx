import { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Printer, FileText, ClipboardText } from '@phosphor-icons/react'

export function TourPrintModal({
  theme,
  isOpen,
  onClose,
  tour,
  stops,
  pharmacy,
  baseUrl,
}) {
  const qrRef = useRef(null)
  const isCompleted = tour?.status === 'completed'
  const [printMode, setPrintMode] = useState(isCompleted ? 'protocol' : 'list')

  if (!isOpen || !tour) return null

  const driverUrl = tour.access_token ? `${baseUrl}/fahrer/${tour.access_token}` : null

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    })
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return ''
    return new Date(dateStr).toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '€ 0,00'
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  const sortedStops = [...stops].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))

  // Statistiken berechnen
  const stats = {
    totalStops: sortedStops.length,
    completedStops: sortedStops.filter(s => s.status === 'completed').length,
    totalPackages: sortedStops.reduce((sum, s) => sum + (s.package_count || 1), 0),
    totalCash: sortedStops.reduce((sum, s) => sum + (s.cash_amount || 0), 0),
    collectedCash: sortedStops.filter(s => s.cash_collected).reduce((sum, s) => sum + (s.cash_amount || 0), 0),
  }

  // ============================================
  // LIEFERLISTE DRUCKEN
  // ============================================
  const handlePrintList = () => {
    const qrSvg = qrRef.current?.querySelector('svg')?.outerHTML || ''

    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Lieferliste - ${tour.name || 'Tour'}</title>
          <style>
            @page { size: A4; margin: 15mm 15mm 20mm 15mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #1a1a1a; line-height: 1.4; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 2px solid #1a1a1a; gap: 15px; }
            .header-left { flex: 1; }
            .pharmacy-name { font-size: 14pt; font-weight: bold; margin-bottom: 6px; }
            .header-qr { text-align: center; flex-shrink: 0; }
            .header-qr svg { width: 70px; height: 70px; }
            .header-qr .qr-label { font-size: 8pt; color: #666; margin-top: 2px; }
            .header-right { text-align: right; flex-shrink: 0; }
            .title { font-size: 18pt; font-weight: bold; }
            .date { font-size: 11pt; margin-top: 4px; }
            .tour-info { font-size: 10pt; color: #333; line-height: 1.4; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th { text-align: left; padding: 8px 6px; border-bottom: 1.5px solid #1a1a1a; font-weight: bold; font-size: 10pt; }
            th.right { text-align: right; }
            td { padding: 10px 6px; vertical-align: top; border-bottom: 1px solid #ddd; }
            td.right { text-align: right; }
            td.center { text-align: center; }
            .customer-name { font-weight: bold; font-size: 11pt; }
            .address { font-size: 10pt; color: #333; }
            .phone { font-size: 10pt; color: #555; }
            .delivery-notes { font-size: 9pt; color: #D97706; font-style: italic; margin-top: 4px; }
            .notes-section { margin-top: 6px; padding-top: 6px; border-top: 1px dotted #ccc; }
            .notes-row { display: flex; gap: 20px; font-size: 9pt; color: #666; }
            .notes-label { min-width: 100px; }
            .notes-value { flex: 1; border-bottom: 1px dotted #999; min-height: 16px; }
            .totals { text-align: right; padding-top: 10px; border-top: 2px solid #1a1a1a; }
            .footer { margin-top: 30px; }
            .signature-section { max-width: 300px; margin-left: auto; }
            .signature-line { border-bottom: 1px solid #1a1a1a; height: 40px; margin-bottom: 5px; }
            .signature-label { font-size: 9pt; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <div class="pharmacy-name">${pharmacy?.name || 'Apotheke'}</div>
              <div class="tour-info">
                <strong>Tour:</strong> ${tour.name || 'Botendienst'}
                ${tour.total_distance_km ? `<br><strong>Strecke:</strong> ${tour.total_distance_km.toFixed(1)} km` : ''}
              </div>
            </div>
            ${driverUrl ? `<div class="header-qr">${qrSvg}<div class="qr-label">Fahrer-App</div></div>` : ''}
            <div class="header-right">
              <div class="title">Lieferliste</div>
              <div class="date">Datum: ${formatDate(tour.date)}</div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">Pos.</th>
                <th>Lieferungsempfänger</th>
                <th class="right" style="width: 70px;">Pakete</th>
                <th class="right" style="width: 90px;">Betrag</th>
              </tr>
            </thead>
            <tbody>
              ${sortedStops.map((stop, index) => `
                <tr>
                  <td class="center">${index + 1}</td>
                  <td>
                    <div class="customer-name">${stop.customer_name || stop.customer?.name || 'Unbekannt'}</div>
                    <div class="address">${stop.street || ''}, ${stop.postal_code || ''} ${stop.city || ''}</div>
                    ${stop.phone || stop.customer?.phone ? `<div class="phone">Tel.: ${stop.phone || stop.customer?.phone}</div>` : ''}
                    ${stop.stop_notes || stop.customer?.delivery_notes ? `<div class="delivery-notes">Hinweis: ${stop.stop_notes || stop.customer?.delivery_notes}</div>` : ''}
                    <div class="notes-section"><div class="notes-row"><span class="notes-label">Empfber. Person:</span><span class="notes-value"></span></div></div>
                  </td>
                  <td class="right">${stop.package_count || 1}</td>
                  <td class="right">${stop.cash_amount > 0 ? formatCurrency(stop.cash_amount) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="totals">
            <strong>Gesamt:</strong> ${stats.totalStops} Stops, ${stats.totalPackages} Pakete, ${formatCurrency(stats.totalCash)} zu kassieren
          </div>
          <div class="footer">
            <div class="signature-section">
              <div class="signature-line"></div>
              <div class="signature-label">Unterschrift Fahrer / Datum</div>
            </div>
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 250)
  }

  // ============================================
  // ZUSTELLPROTOKOLL DRUCKEN
  // ============================================
  const handlePrintProtocol = () => {
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Zustellprotokoll - ${tour.name || 'Tour'}</title>
          <style>
            @page { size: A4; margin: 12mm; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10pt; color: #1a1a1a; line-height: 1.3; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 2px solid #1a1a1a; }
            .header-left { flex: 1; }
            .pharmacy-name { font-size: 12pt; font-weight: bold; }
            .tour-info { font-size: 9pt; color: #333; margin-top: 4px; }
            .header-right { text-align: right; }
            .title { font-size: 16pt; font-weight: bold; color: #0D9488; }
            .date { font-size: 10pt; margin-top: 2px; }
            .summary { display: flex; gap: 20px; margin-bottom: 15px; padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 9pt; }
            .summary-item { text-align: center; }
            .summary-value { font-size: 14pt; font-weight: bold; color: #1E293B; }
            .summary-label { color: #64748B; }
            .summary-item.success .summary-value { color: #0D9488; }
            .stop-card { border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 12px; page-break-inside: avoid; overflow: hidden; }
            .stop-header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f1f5f9; border-bottom: 1px solid #e2e8f0; }
            .stop-number { width: 24px; height: 24px; border-radius: 50%; background: #0D9488; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11pt; }
            .stop-name { font-weight: bold; font-size: 11pt; flex: 1; margin-left: 10px; }
            .stop-time { font-size: 9pt; color: #0D9488; font-weight: 500; }
            .stop-body { padding: 10px 12px; }
            .stop-address { font-size: 9pt; color: #64748B; margin-bottom: 8px; }
            .stop-meta { display: flex; gap: 15px; margin-bottom: 8px; font-size: 9pt; }
            .stop-meta-item { display: flex; align-items: center; gap: 4px; }
            .stop-meta-item.cash { color: #0D9488; font-weight: 600; }
            .stop-meta-item.pending { color: #D97706; }
            .driver-notes { background: #FEF3C7; border-left: 3px solid #F59E0B; padding: 8px 10px; margin: 8px 0; font-size: 9pt; border-radius: 0 4px 4px 0; }
            .driver-notes-label { font-weight: bold; color: #92400E; margin-bottom: 2px; }
            .driver-notes-text { color: #78350F; }
            .evidence-section { margin-top: 10px; }
            .evidence-label { font-size: 8pt; color: #64748B; font-weight: 600; text-transform: uppercase; margin-bottom: 6px; }
            .signature-container { display: inline-block; border: 1px solid #e2e8f0; border-radius: 4px; padding: 6px; background: white; }
            .signature-img { max-height: 50px; max-width: 150px; }
            .signature-info { font-size: 8pt; color: #64748B; margin-top: 4px; }
            .photos-grid { display: flex; flex-wrap: wrap; gap: 8px; }
            .photo-container { width: 47mm; height: 47mm; border: 1px solid #e2e8f0; border-radius: 4px; overflow: hidden; }
            .photo-img { width: 100%; height: 100%; object-fit: cover; }
            .photo-caption { font-size: 7pt; color: #64748B; padding: 2px 4px; background: #f8fafc; }
            .status-completed { color: #0D9488; }
            .status-skipped { color: #D97706; }
            .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #e2e8f0; font-size: 8pt; color: #94A3B8; text-align: center; }
            @media print {
              .stop-card { break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <!-- Header -->
          <div class="header">
            <div class="header-left">
              <div class="pharmacy-name">${pharmacy?.name || 'Apotheke'}</div>
              <div class="tour-info">
                Tour: ${tour.name || 'Botendienst'} |
                ${tour.started_at ? `Start: ${formatDateTime(tour.started_at)}` : ''}
                ${tour.completed_at ? ` | Ende: ${formatDateTime(tour.completed_at)}` : ''}
              </div>
            </div>
            <div class="header-right">
              <div class="title">Zustellprotokoll</div>
              <div class="date">${formatDate(tour.date)}</div>
            </div>
          </div>

          <!-- Summary -->
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${stats.completedStops}/${stats.totalStops}</div>
              <div class="summary-label">Zustellungen</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${stats.totalPackages}</div>
              <div class="summary-label">Pakete</div>
            </div>
            <div class="summary-item success">
              <div class="summary-value">${formatCurrency(stats.collectedCash)}</div>
              <div class="summary-label">Kassiert</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(stats.totalCash)}</div>
              <div class="summary-label">Gesamt</div>
            </div>
          </div>

          <!-- Stop Cards -->
          ${sortedStops.map((stop, index) => {
            const isStopCompleted = stop.status === 'completed'
            const hasSignature = stop.signature?.length > 0
            const hasPhotos = stop.photos?.length > 0
            const hasNotes = stop.stop_notes || stop.cash_notes

            return `
              <div class="stop-card">
                <div class="stop-header">
                  <div class="stop-number">${index + 1}</div>
                  <div class="stop-name">${stop.customer_name || stop.customer?.name || 'Unbekannt'}</div>
                  ${stop.completed_at ? `<div class="stop-time">${new Date(stop.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr</div>` : ''}
                  <div class="status-${isStopCompleted ? 'completed' : 'skipped'}" style="margin-left: 10px; font-weight: 600;">
                    ${isStopCompleted ? '✓ Zugestellt' : stop.status === 'skipped' ? '⚠ Übersprungen' : '○ Offen'}
                  </div>
                </div>
                <div class="stop-body">
                  <div class="stop-address">${stop.street}, ${stop.postal_code} ${stop.city}</div>

                  <div class="stop-meta">
                    <div class="stop-meta-item">📦 ${stop.package_count || 1} Paket${(stop.package_count || 1) > 1 ? 'e' : ''}</div>
                    ${stop.cash_amount > 0 ? `
                      <div class="stop-meta-item ${stop.cash_collected ? 'cash' : 'pending'}">
                        💶 ${formatCurrency(stop.cash_amount)} ${stop.cash_collected ? '✓ kassiert' : '(offen)'}
                      </div>
                    ` : ''}
                  </div>

                  ${hasNotes ? `
                    <div class="driver-notes">
                      <div class="driver-notes-label">Fahrer-Notiz:</div>
                      <div class="driver-notes-text">
                        ${stop.stop_notes || ''}
                        ${stop.cash_notes ? `<br>Kassierung: ${stop.cash_notes}` : ''}
                      </div>
                    </div>
                  ` : ''}

                  ${hasSignature || hasPhotos ? `
                    <div class="evidence-section">
                      ${hasSignature ? `
                        <div style="margin-bottom: 8px;">
                          <div class="evidence-label">Unterschrift</div>
                          ${stop.signature.map(sig => `
                            <div class="signature-container">
                              <img src="${sig.signature_url}" class="signature-img" alt="Unterschrift" />
                              ${sig.signer_name ? `<div class="signature-info">${sig.signer_name}</div>` : ''}
                            </div>
                          `).join('')}
                        </div>
                      ` : ''}

                      ${hasPhotos ? `
                        <div>
                          <div class="evidence-label">Fotos (${stop.photos.length})</div>
                          <div class="photos-grid">
                            ${stop.photos.map(photo => `
                              <div class="photo-container">
                                <img src="${photo.photo_url}" class="photo-img" alt="Lieferfoto" />
                              </div>
                            `).join('')}
                          </div>
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              </div>
            `
          }).join('')}

          <div class="footer">
            Zustellprotokoll erstellt am ${new Date().toLocaleString('de-DE')} | ${pharmacy?.name || 'Apotheke'}
          </div>
        </body>
      </html>
    `)
    printWindow.document.close()
    setTimeout(() => printWindow.print(), 500) // Mehr Zeit für Bilder
  }

  const handlePrint = () => {
    if (printMode === 'protocol') {
      handlePrintProtocol()
    } else {
      handlePrintList()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative ${theme.surface} rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className={`text-lg font-semibold ${theme.textPrimary}`}>
            Tour drucken
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${theme.textSecondary} ${theme.bgHover}`}
          >
            <X size={20} className={theme.textMuted} />
          </button>
        </div>

        {/* Mode Selection (nur bei abgeschlossenen Touren) */}
        {isCompleted && (
          <div className="px-6 pt-4">
            <div className="flex gap-2">
              <button
                onClick={() => setPrintMode('list')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  printMode === 'list'
                    ? 'border-[#F59E0B] bg-amber-50 text-amber-700'
                    : `${theme.border} border ${theme.textSecondary} hover:bg-gray-50`
                }`}
              >
                <FileText size={20} />
                <div className="text-left">
                  <div className="font-medium">Lieferliste</div>
                  <div className="text-xs opacity-70">Ohne Nachweise</div>
                </div>
              </button>
              <button
                onClick={() => setPrintMode('protocol')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all ${
                  printMode === 'protocol'
                    ? 'border-[#0D9488] bg-teal-50 text-teal-700'
                    : `${theme.border} border ${theme.textSecondary} hover:bg-gray-50`
                }`}
              >
                <ClipboardText size={20} />
                <div className="text-left">
                  <div className="font-medium">Zustellprotokoll</div>
                  <div className="text-xs opacity-70">Mit Fotos & Unterschriften</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Preview Content */}
        <div className="p-6 max-h-[50vh] overflow-y-auto">
          {printMode === 'protocol' ? (
            // Zustellprotokoll Vorschau
            <>
              <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b-2 border-teal-600">
                <div className="flex-1">
                  <div className={`font-bold ${theme.textPrimary}`}>{pharmacy?.name || 'Apotheke'}</div>
                  <div className={`text-sm ${theme.textSecondary} mt-1`}>
                    {tour.name || 'Botendienst'}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-teal-600">Zustellprotokoll</div>
                  <div className={`text-sm ${theme.textMuted}`}>{formatDate(tour.date)}</div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                  <div className={`text-lg font-bold ${theme.textPrimary}`}>{stats.completedStops}/{stats.totalStops}</div>
                  <div className={`text-xs ${theme.textMuted}`}>Zustellungen</div>
                </div>
                <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                  <div className={`text-lg font-bold ${theme.textPrimary}`}>{stats.totalPackages}</div>
                  <div className={`text-xs ${theme.textMuted}`}>Pakete</div>
                </div>
                <div className="text-center p-2 rounded-lg bg-teal-50">
                  <div className="text-lg font-bold text-teal-600">{formatCurrency(stats.collectedCash)}</div>
                  <div className="text-xs text-teal-600">Kassiert</div>
                </div>
                <div className={`text-center p-2 rounded-lg ${theme.bg}`}>
                  <div className={`text-lg font-bold ${theme.textPrimary}`}>{formatCurrency(stats.totalCash)}</div>
                  <div className={`text-xs ${theme.textMuted}`}>Gesamt</div>
                </div>
              </div>

              {/* Stop Preview */}
              <div className="space-y-2">
                {sortedStops.slice(0, 3).map((stop, index) => (
                  <div key={stop.id} className={`p-3 rounded-lg border ${theme.border}`}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-teal-500 text-white flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className={`font-medium ${theme.textPrimary}`}>
                        {stop.customer_name || stop.customer?.name}
                      </span>
                      {stop.completed_at && (
                        <span className="text-xs text-teal-600 ml-auto">
                          {new Date(stop.completed_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 ml-8">
                      {stop.photos?.length > 0 && <span>📷 {stop.photos.length} Foto(s)</span>}
                      {stop.signature?.length > 0 && <span>✍️ Unterschrift</span>}
                      {stop.stop_notes && <span>📝 Notiz</span>}
                    </div>
                  </div>
                ))}
                {sortedStops.length > 3 && (
                  <div className={`text-center text-sm ${theme.textMuted} py-2`}>
                    ... und {sortedStops.length - 3} weitere Stops
                  </div>
                )}
              </div>
            </>
          ) : (
            // Lieferliste Vorschau
            <>
              <div className="flex justify-between items-start gap-4 mb-4 pb-3 border-b-2 border-gray-800">
                <div className="flex-1">
                  <div className={`font-bold ${theme.textPrimary}`}>{pharmacy?.name || 'Apotheke'}</div>
                  <div className={`text-sm ${theme.textSecondary} mt-1`}>
                    <strong>Tour:</strong> {tour.name || 'Botendienst'}
                  </div>
                </div>
                {driverUrl && (
                  <div ref={qrRef} className="p-2 bg-white rounded-lg shadow flex-shrink-0">
                    <QRCodeSVG value={driverUrl} size={60} level="H" bgColor="#ffffff" fgColor="#1E293B" />
                  </div>
                )}
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${theme.textPrimary}`}>Lieferliste</div>
                  <div className={`text-sm ${theme.textMuted}`}>Datum: {formatDate(tour.date)}</div>
                </div>
              </div>

              <div className={`${theme.border} border rounded-lg overflow-hidden`}>
                <table className="w-full text-sm">
                  <thead className={`${theme.bg}`}>
                    <tr>
                      <th className={`px-3 py-2 text-left font-semibold ${theme.textPrimary}`}>Pos.</th>
                      <th className={`px-3 py-2 text-left font-semibold ${theme.textPrimary}`}>Empfänger</th>
                      <th className={`px-3 py-2 text-right font-semibold ${theme.textPrimary}`}>Pakete</th>
                      <th className={`px-3 py-2 text-right font-semibold ${theme.textPrimary}`}>Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStops.slice(0, 5).map((stop, index) => (
                      <tr key={stop.id} className={`border-t ${theme.border}`}>
                        <td className={`px-3 py-2 ${theme.textMuted}`}>{index + 1}</td>
                        <td className="px-3 py-2">
                          <div className={`font-medium ${theme.textPrimary}`}>
                            {stop.customer_name || stop.customer?.name || 'Unbekannt'}
                          </div>
                          <div className={`text-xs ${theme.textMuted}`}>
                            {stop.street}, {stop.postal_code} {stop.city}
                          </div>
                        </td>
                        <td className={`px-3 py-2 text-right ${theme.textSecondary}`}>{stop.package_count || 1}</td>
                        <td className={`px-3 py-2 text-right ${stop.cash_amount > 0 ? 'text-amber-600 font-medium' : theme.textMuted}`}>
                          {stop.cash_amount > 0 ? formatCurrency(stop.cash_amount) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {sortedStops.length > 5 && (
                  <div className={`text-center text-sm ${theme.textMuted} py-2 border-t ${theme.border}`}>
                    ... und {sortedStops.length - 5} weitere Stops
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className={`px-4 py-2 rounded-lg border ${theme.border} ${theme.textSecondary} hover:bg-gray-50`}
          >
            Abbrechen
          </button>
          <button
            onClick={handlePrint}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
              printMode === 'protocol' ? 'bg-[#0D9488] hover:bg-[#0F766E]' : 'bg-[#F59E0B] hover:bg-[#D97706]'
            }`}
          >
            <Printer size={18} />
            {printMode === 'protocol' ? 'Protokoll drucken' : 'Liste drucken'}
          </button>
        </div>
      </div>
    </div>
  )
}
