import { jsPDF } from 'jspdf'

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function generateMonatsberichtPdf({ pharmacy, employeeName, year, month, monthName, reportData }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  // Helper: format number with comma
  const fmt = (n) => parseFloat(n || 0).toFixed(2).replace('.', ',')
  const fmtSign = (n) => {
    const v = parseFloat(n || 0)
    const f = Math.abs(v).toFixed(2).replace('.', ',')
    return v >= 0 ? `+${f}` : `-${f}`
  }

  // Helper: add new page with header
  const newPage = () => {
    doc.addPage()
    y = margin
    drawHeader()
  }

  // Helper: check if we need a new page
  const checkPageBreak = (needed) => {
    if (y + needed > 280) {
      newPage()
    }
  }

  // Draw header
  const drawHeader = () => {
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    const pharmacyName = pharmacy?.name || 'Apotheke'
    doc.text(pharmacyName, margin, y)
    y += 5

    if (pharmacy?.street) {
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text(`${pharmacy.street}, ${pharmacy.postal_code || ''} ${pharmacy.city || ''}`, margin, y)
      y += 8
    } else {
      y += 3
    }

    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(`Stundenabrechnung ${monthName} ${year}`, margin, y)
    y += 6

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Mitarbeiter: ${employeeName}`, margin, y)
    y += 10
  }

  // Draw header
  drawHeader()

  // Hours Summary Box
  doc.setDrawColor(200)
  doc.setLineWidth(0.3)
  doc.rect(margin, y, contentWidth, 38)

  const boxX = margin + 5
  y += 7

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Übertrag aus Vormonat:', boxX, y)
  doc.text(`${fmtSign(reportData.previousCumulative)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 6

  doc.text(`+ Stunden diesen Monat:`, boxX, y)
  doc.text(`+${fmt(reportData.actualHours)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 6

  doc.text(`- Bezahlte Stunden (${fmt(reportData.monthlyPayment)} € / ${fmt(reportData.hourlyRate)} €):`, boxX, y)
  doc.text(`-${fmt(reportData.paidHours)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 4

  doc.setLineWidth(0.5)
  doc.line(boxX, y, margin + contentWidth - 5, y)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('= Neuer Gesamtstand:', boxX, y)
  doc.text(`${fmtSign(reportData.cumulativeBalance)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 12

  // Work Records Table
  if (reportData.workRecords?.length > 0) {
    checkPageBreak(20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Geleistete Stunden (Dienstplan)', margin, y)
    y += 6

    // Table header
    const colX = [margin, margin + 35, margin + 70, margin + 110, margin + contentWidth - 5]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Datum', colX[0], y)
    doc.text('Schicht', colX[1], y)
    doc.text('Von', colX[2], y)
    doc.text('Bis', colX[3], y)
    doc.text('Stunden', colX[4], y, { align: 'right' })
    y += 2
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentWidth, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    const sortedRecords = [...reportData.workRecords].sort((a, b) =>
      (a.schedule?.date || '').localeCompare(b.schedule?.date || '')
    )

    for (const wr of sortedRecords) {
      checkPageBreak(8)

      const dateStr = wr.schedule?.date
        ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
        : '–'
      const shiftName = wr.schedule?.shift?.name || '–'
      const startTime = wr.actual_start_time?.substring(0, 5) || '–'
      const endTime = wr.actual_end_time?.substring(0, 5) || '–'
      const hours = fmt(wr.actual_hours)

      doc.text(dateStr, colX[0], y)
      doc.text(shiftName, colX[1], y)
      doc.text(startTime, colX[2], y)
      doc.text(endTime, colX[3], y)
      doc.text(hours, colX[4], y, { align: 'right' })
      y += 5
    }

    y += 3
  }

  // Manual Hours Table
  if (reportData.manualEntries?.length > 0) {
    checkPageBreak(20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Manuell hinzugefügte Stunden', margin, y)
    y += 6

    const colX = [margin, margin + 35, margin + contentWidth - 5]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Datum', colX[0], y)
    doc.text('Beschreibung', colX[1], y)
    doc.text('Stunden', colX[2], y, { align: 'right' })
    y += 2
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentWidth, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const mh of reportData.manualEntries) {
      checkPageBreak(8)

      const dateStr = new Date(mh.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      const desc = mh.description || '–'
      const hours = fmt(mh.hours)

      doc.text(dateStr, colX[0], y)
      // Truncate long descriptions
      const maxDescWidth = contentWidth - 70
      const truncatedDesc = doc.splitTextToSize(desc, maxDescWidth)[0]
      doc.text(truncatedDesc, colX[1], y)
      doc.text(hours, colX[2], y, { align: 'right' })
      y += 5
    }

    y += 3
  }

  // Total line
  checkPageBreak(15)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Gesamt Ist-Stunden:', margin, y)
  doc.text(`${fmt(reportData.actualHours)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 15

  // Signature lines
  checkPageBreak(30)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setLineWidth(0.3)

  const sigY = y + 15
  doc.line(margin, sigY, margin + 70, sigY)
  doc.text('Ort, Datum', margin, sigY + 4)
  doc.text('Unterschrift Mitarbeiter', margin, sigY + 8)

  doc.line(margin + contentWidth - 70, sigY, margin + contentWidth, sigY)
  doc.text('Ort, Datum', margin + contentWidth - 70, sigY + 4)
  doc.text('Unterschrift Arbeitgeber', margin + contentWidth - 70, sigY + 8)

  // Save
  const fileName = `Stundenabrechnung_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`
  doc.save(fileName)
}

export function generateZeitraumPdf({ pharmacy, employeeName, startDate, endDate, reportData }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const margin = 20
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  const fmt = (n) => parseFloat(n || 0).toFixed(2).replace('.', ',')

  const checkPageBreak = (needed) => {
    if (y + needed > 280) {
      doc.addPage()
      y = margin
    }
  }

  const fmtDate = (d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })

  // Header
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(pharmacy?.name || 'Apotheke', margin, y)
  y += 5

  if (pharmacy?.street) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(`${pharmacy.street}, ${pharmacy.postal_code || ''} ${pharmacy.city || ''}`, margin, y)
    y += 8
  } else {
    y += 3
  }

  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(`Stundennachweis ${fmtDate(startDate)} – ${fmtDate(endDate)}`, margin, y)
  y += 6

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Mitarbeiter: ${employeeName}`, margin, y)
  y += 10

  // Work Records Table
  if (reportData.workRecords?.length > 0) {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Arbeitszeiteinträge (Dienstplan)', margin, y)
    y += 6

    const colX = [margin, margin + 35, margin + 70, margin + 110, margin + contentWidth - 5]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Datum', colX[0], y)
    doc.text('Schicht', colX[1], y)
    doc.text('Von', colX[2], y)
    doc.text('Bis', colX[3], y)
    doc.text('Stunden', colX[4], y, { align: 'right' })
    y += 2
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentWidth, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    const sortedRecords = [...reportData.workRecords].sort((a, b) =>
      (a.schedule?.date || '').localeCompare(b.schedule?.date || '')
    )

    for (const wr of sortedRecords) {
      checkPageBreak(8)

      const dateStr = wr.schedule?.date
        ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
        : '–'
      const shiftName = wr.schedule?.shift?.name || '–'
      const startTime = wr.actual_start_time?.substring(0, 5) || '–'
      const endTime = wr.actual_end_time?.substring(0, 5) || '–'
      const hours = fmt(wr.actual_hours)

      doc.text(dateStr, colX[0], y)
      doc.text(shiftName, colX[1], y)
      doc.text(startTime, colX[2], y)
      doc.text(endTime, colX[3], y)
      doc.text(hours, colX[4], y, { align: 'right' })
      y += 5
    }

    y += 3
  }

  // Manual Hours Table
  if (reportData.manualEntries?.length > 0) {
    checkPageBreak(20)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Manuell hinzugefügte Stunden', margin, y)
    y += 6

    const colX = [margin, margin + 35, margin + contentWidth - 5]
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text('Datum', colX[0], y)
    doc.text('Beschreibung', colX[1], y)
    doc.text('Stunden', colX[2], y, { align: 'right' })
    y += 2
    doc.setLineWidth(0.3)
    doc.line(margin, y, margin + contentWidth, y)
    y += 4

    doc.setFont('helvetica', 'normal')
    for (const mh of reportData.manualEntries) {
      checkPageBreak(8)

      const dateStr = new Date(mh.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      const desc = mh.description || '–'
      const hours = fmt(mh.hours)

      doc.text(dateStr, colX[0], y)
      const maxDescWidth = contentWidth - 70
      const truncatedDesc = doc.splitTextToSize(desc, maxDescWidth)[0]
      doc.text(truncatedDesc, colX[1], y)
      doc.text(hours, colX[2], y, { align: 'right' })
      y += 5
    }

    y += 3
  }

  // Total line
  checkPageBreak(15)
  doc.setLineWidth(0.5)
  doc.line(margin, y, margin + contentWidth, y)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Gesamt Ist-Stunden:', margin, y)
  doc.text(`${fmt(reportData.actualHours)} h`, margin + contentWidth - 5, y, { align: 'right' })
  y += 15

  // Signature lines
  checkPageBreak(30)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setLineWidth(0.3)

  const sigY = y + 15
  doc.line(margin, sigY, margin + 70, sigY)
  doc.text('Ort, Datum', margin, sigY + 4)
  doc.text('Unterschrift Mitarbeiter', margin, sigY + 8)

  doc.line(margin + contentWidth - 70, sigY, margin + contentWidth, sigY)
  doc.text('Ort, Datum', margin + contentWidth - 70, sigY + 4)
  doc.text('Unterschrift Arbeitgeber', margin + contentWidth - 70, sigY + 8)

  const fileName = `Stundennachweis_${employeeName.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`
  doc.save(fileName)
}
