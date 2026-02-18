import { jsPDF } from 'jspdf'

const monthNames = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember',
]

export function generateMonatsberichtPdf({ pharmacy, employeeName, year, month, monthName, reportData }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  const C = {
    primary: [30, 41, 59],
    accent: [245, 158, 11],
    headerBg: [30, 41, 59],
    headerText: [255, 255, 255],
    rowEven: [255, 255, 255],
    rowOdd: [248, 250, 252],
    border: [203, 213, 225],
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    summaryBg: [248, 250, 252],
    summaryBorder: [203, 213, 225],
    positive: [13, 148, 136],
    negative: [225, 29, 72],
    chipBlue: [219, 234, 254],
    chipGreen: [220, 252, 231],
  }

  const fmt = (n) => parseFloat(n || 0).toFixed(2).replace('.', ',')
  const fmtSign = (n) => {
    const v = parseFloat(n || 0)
    const f = Math.abs(v).toFixed(2).replace('.', ',')
    return v >= 0 ? `+${f}` : `-${f}`
  }
  const rr = (x, ry, w, h, r, style) => doc.roundedRect(x, ry, w, h, r, r, style)
  const rowH = 7

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - 20) {
      doc.setFillColor(...C.accent)
      doc.rect(margin, y + 1, contentWidth, 0.5, 'F')
      doc.addPage()
      y = margin + 4
    }
  }

  // ── Page header ──
  // Amber accent bar
  doc.setFillColor(...C.accent)
  doc.rect(margin, y, contentWidth, 1.5, 'F')
  y += 8

  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Stundenabrechnung', margin, y)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(`${monthName} ${year}`, pageWidth - margin, y, { align: 'right' })
  y += 5

  // Pharmacy
  doc.setFontSize(9)
  doc.setTextColor(...C.textMuted)
  const pharmText = pharmacy?.name || 'Apotheke'
  const addrParts = [pharmacy?.street, [pharmacy?.postal_code, pharmacy?.city].filter(Boolean).join(' ')].filter(Boolean)
  doc.text(addrParts.length > 0 ? `${pharmText} · ${addrParts.join(', ')}` : pharmText, margin, y)
  y += 5

  doc.setFontSize(10)
  doc.setTextColor(...C.textDark)
  doc.setFont('helvetica', 'bold')
  doc.text(`Mitarbeiter: ${employeeName}`, margin, y)
  y += 2

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 6

  // ── Summary box ──
  const boxH = 40
  doc.setFillColor(...C.summaryBg)
  doc.setDrawColor(...C.summaryBorder)
  doc.setLineWidth(0.3)
  rr(margin, y, contentWidth, boxH, 2, 'FD')

  // Left accent stripe
  doc.setFillColor(...C.accent)
  doc.rect(margin, y, 3, boxH, 'F')

  const bx = margin + 10
  let by = y + 8

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Übertrag Vormonat', bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textDark)
  doc.text(`${fmtSign(reportData.previousCumulative)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('+ Ist-Stunden Monat', bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.positive)
  doc.text(`+${fmt(reportData.actualHours)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(`- Bezahlte Stunden (${fmt(reportData.monthlyPayment)} € / ${fmt(reportData.hourlyRate)} €)`, bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.negative)
  doc.text(`-${fmt(reportData.paidHours)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 4

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(bx, by, margin + contentWidth - 8, by)
  by += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Neuer Gesamtstand', bx, by)
  const cumVal = parseFloat(reportData.cumulativeBalance || 0)
  doc.setTextColor(...(cumVal >= 0 ? C.positive : C.negative))
  doc.text(`${fmtSign(reportData.cumulativeBalance)} h`, margin + contentWidth - 8, by, { align: 'right' })

  y += boxH + 8

  // ── Work Records Table ──
  if (reportData.workRecords?.length > 0) {
    checkPageBreak(25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Geleistete Stunden (Dienstplan)', margin, y)
    y += 5

    const cols = [margin, margin + 28, margin + 65, margin + 100, margin + 130, margin + contentWidth]
    const headerH = 8
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, headerH, 1.5, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Datum', cols[0] + 3, y + 5.3)
    doc.text('Schicht', cols[1] + 3, y + 5.3)
    doc.text('Von', cols[2] + 3, y + 5.3)
    doc.text('Bis', cols[3] + 3, y + 5.3)
    doc.text('Stunden', cols[5] - 3, y + 5.3, { align: 'right' })
    y += headerH

    const sortedRecords = [...reportData.workRecords].sort((a, b) =>
      (a.schedule?.date || '').localeCompare(b.schedule?.date || '')
    )

    let totalHours = 0
    sortedRecords.forEach((wr, idx) => {
      checkPageBreak(rowH + 2)

      doc.setFillColor(...(idx % 2 === 0 ? C.rowEven : C.rowOdd))
      doc.rect(margin, y, contentWidth, rowH, 'F')
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH)
      doc.line(margin, y, margin, y + rowH)
      doc.line(pageWidth - margin, y, pageWidth - margin, y + rowH)

      const dateStr = wr.schedule?.date
        ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
        : '–'
      const shiftName = wr.schedule?.shift?.name || '–'
      const startTime = wr.actual_start_time?.substring(0, 5) || '–'
      const endTime = wr.actual_end_time?.substring(0, 5) || '–'
      const hours = parseFloat(wr.actual_hours || 0)
      totalHours += hours

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(dateStr, cols[0] + 3, y + 4.8)

      // Shift name chip
      const chipColor = shiftName.includes('Vormittag') || shiftName.includes('Früh')
        ? C.chipBlue
        : shiftName.includes('Nachmittag') || shiftName.includes('Spät')
          ? C.chipGreen
          : [240, 240, 240]
      const chipW = doc.getTextWidth(shiftName) + 4
      doc.setFillColor(...chipColor)
      rr(cols[1] + 2, y + 1.5, chipW, 4.2, 1, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(shiftName, cols[1] + 4, y + 4.6)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textMuted)
      doc.text(startTime, cols[2] + 3, y + 4.8)
      doc.text(endTime, cols[3] + 3, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(fmt(hours), cols[5] - 3, y + 4.8, { align: 'right' })

      y += rowH
    })

    // Total row
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, rowH, 1.5, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Summe', cols[0] + 3, y + 4.8)
    doc.text(`${fmt(totalHours)} h`, cols[5] - 3, y + 4.8, { align: 'right' })
    y += rowH + 8
  }

  // ── Manual Hours Table ──
  if (reportData.manualEntries?.length > 0) {
    checkPageBreak(25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Manuell hinzugefügte Stunden', margin, y)
    y += 5

    const cols = [margin, margin + 28, margin + contentWidth]
    const headerH = 8
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, headerH, 1.5, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Datum', cols[0] + 3, y + 5.3)
    doc.text('Beschreibung', cols[1] + 3, y + 5.3)
    doc.text('Stunden', cols[2] - 3, y + 5.3, { align: 'right' })
    y += headerH

    let manualTotal = 0
    reportData.manualEntries.forEach((mh, idx) => {
      checkPageBreak(rowH + 2)

      doc.setFillColor(...(idx % 2 === 0 ? C.rowEven : C.rowOdd))
      doc.rect(margin, y, contentWidth, rowH, 'F')
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH)
      doc.line(margin, y, margin, y + rowH)
      doc.line(pageWidth - margin, y, pageWidth - margin, y + rowH)

      const dateStr = new Date(mh.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      const desc = mh.description || '–'
      const hours = parseFloat(mh.hours || 0)
      manualTotal += hours

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(dateStr, cols[0] + 3, y + 4.8)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textMuted)
      const maxDescWidth = contentWidth - 45
      const truncatedDesc = doc.splitTextToSize(desc, maxDescWidth)[0]
      doc.text(truncatedDesc, cols[1] + 3, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(fmt(hours), cols[2] - 3, y + 4.8, { align: 'right' })

      y += rowH
    })

    // Total row
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, rowH, 1.5, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Summe', cols[0] + 3, y + 4.8)
    doc.text(`${fmt(manualTotal)} h`, cols[2] - 3, y + 4.8, { align: 'right' })
    y += rowH + 8
  }

  // ── Signature area ──
  checkPageBreak(40)
  y += 10

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)

  const sigY = y + 15
  doc.line(margin, sigY, margin + 70, sigY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Ort, Datum', margin, sigY + 4)
  doc.text('Unterschrift Mitarbeiter', margin, sigY + 8)

  doc.line(margin + contentWidth - 70, sigY, margin + contentWidth, sigY)
  doc.text('Ort, Datum', margin + contentWidth - 70, sigY + 4)
  doc.text('Unterschrift Arbeitgeber', margin + contentWidth - 70, sigY + 8)

  // ── Footer ──
  doc.setFillColor(...C.accent)
  doc.rect(margin, pageHeight - 14, contentWidth, 0.5, 'F')
  doc.setFontSize(7)
  doc.setTextColor(...C.textMuted)
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.text(`Erstellt am ${today}`, margin, pageHeight - 10)
  doc.text(`${monthName} ${year}`, pageWidth - margin, pageHeight - 10, { align: 'right' })

  const fileName = `Stundenabrechnung_${employeeName.replace(/\s+/g, '_')}_${monthName}_${year}.pdf`
  return { blob: doc.output('blob'), fileName }
}

export function generateZeitraumPdf({ pharmacy, employeeName, startDate, endDate, reportData }) {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 15
  const contentWidth = pageWidth - 2 * margin
  let y = margin

  const C = {
    primary: [30, 41, 59],
    accent: [245, 158, 11],
    headerBg: [30, 41, 59],
    headerText: [255, 255, 255],
    rowEven: [255, 255, 255],
    rowOdd: [248, 250, 252],
    border: [203, 213, 225],
    textDark: [30, 41, 59],
    textMuted: [100, 116, 139],
    summaryBg: [248, 250, 252],
    summaryBorder: [203, 213, 225],
    positive: [13, 148, 136],
    negative: [225, 29, 72],
    chipBlue: [219, 234, 254],
    chipGreen: [220, 252, 231],
  }

  const fmt = (n) => parseFloat(n || 0).toFixed(2).replace('.', ',')
  const fmtSign = (n) => {
    const v = parseFloat(n || 0)
    const f = Math.abs(v).toFixed(2).replace('.', ',')
    return v >= 0 ? `+${f}` : `-${f}`
  }
  const fmtDate = (d) => new Date(d).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  const rr = (x, ry, w, h, r, style) => doc.roundedRect(x, ry, w, h, r, r, style)

  const rowH = 7

  // ── Page header ──
  function drawPageHeader() {
    // Amber accent bar
    doc.setFillColor(...C.accent)
    doc.rect(margin, y, contentWidth, 1.5, 'F')
    y += 5

    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Stundennachweis', margin, y)

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...C.textMuted)
    doc.text(`${fmtDate(startDate)} – ${fmtDate(endDate)}`, pageWidth - margin, y, { align: 'right' })
    y += 5

    // Pharmacy + employee
    doc.setFontSize(9)
    doc.setTextColor(...C.textMuted)
    const pharmText = pharmacy?.name || 'Apotheke'
    const addrParts = [pharmacy?.street, [pharmacy?.postal_code, pharmacy?.city].filter(Boolean).join(' ')].filter(Boolean)
    doc.text(addrParts.length > 0 ? `${pharmText} · ${addrParts.join(', ')}` : pharmText, margin, y)
    y += 5

    doc.setFontSize(10)
    doc.setTextColor(...C.textDark)
    doc.setFont('helvetica', 'bold')
    doc.text(`Mitarbeiter: ${employeeName}`, margin, y)
    y += 2

    doc.setDrawColor(...C.border)
    doc.setLineWidth(0.3)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
  }

  const checkPageBreak = (needed) => {
    if (y + needed > pageHeight - 20) {
      // Bottom accent
      doc.setFillColor(...C.accent)
      doc.rect(margin, y + 1, contentWidth, 0.5, 'F')
      doc.addPage()
      y = margin + 4
    }
  }

  drawPageHeader()

  // ── Summary box ──
  const boxH = 40
  doc.setFillColor(...C.summaryBg)
  doc.setDrawColor(...C.summaryBorder)
  doc.setLineWidth(0.3)
  rr(margin, y, contentWidth, boxH, 2, 'FD')

  // Left accent stripe
  doc.setFillColor(...C.accent)
  doc.rect(margin, y, 3, boxH, 'F')

  const bx = margin + 10
  let by = y + 8

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Übertrag Vormonat', bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.textDark)
  doc.text(`${fmtSign(reportData.previousCumulative)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('+ Ist-Stunden Zeitraum', bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.positive)
  doc.text(`+${fmt(reportData.actualHours)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 6

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text(`- Bezahlte Stunden (${fmt(reportData.monthlyPayment)} € / ${fmt(reportData.hourlyRate)} €)`, bx, by)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.negative)
  doc.text(`-${fmt(reportData.paidHours)} h`, margin + contentWidth - 8, by, { align: 'right' })
  by += 4

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)
  doc.line(bx, by, margin + contentWidth - 8, by)
  by += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...C.primary)
  doc.text('Neuer Gesamtstand', bx, by)
  const cumVal = parseFloat(reportData.cumulativeBalance || 0)
  doc.setTextColor(...(cumVal >= 0 ? C.positive : C.negative))
  doc.text(`${fmtSign(reportData.cumulativeBalance)} h`, margin + contentWidth - 8, by, { align: 'right' })

  y += boxH + 8

  // ── Work Records Table ──
  if (reportData.workRecords?.length > 0) {
    checkPageBreak(25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Geleistete Stunden (Dienstplan)', margin, y)
    y += 5

    // Table header
    const cols = [margin, margin + 28, margin + 65, margin + 100, margin + 130, margin + contentWidth]
    const headerH = 8
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, headerH, 1.5, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Datum', cols[0] + 3, y + 5.3)
    doc.text('Schicht', cols[1] + 3, y + 5.3)
    doc.text('Von', cols[2] + 3, y + 5.3)
    doc.text('Bis', cols[3] + 3, y + 5.3)
    doc.text('Stunden', cols[5] - 3, y + 5.3, { align: 'right' })
    y += headerH

    const sortedRecords = [...reportData.workRecords].sort((a, b) =>
      (a.schedule?.date || '').localeCompare(b.schedule?.date || '')
    )

    let totalHours = 0
    sortedRecords.forEach((wr, idx) => {
      checkPageBreak(rowH + 2)

      // Alternating row bg
      doc.setFillColor(...(idx % 2 === 0 ? C.rowEven : C.rowOdd))
      doc.rect(margin, y, contentWidth, rowH, 'F')

      // Row borders
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH)
      doc.line(margin, y, margin, y + rowH)
      doc.line(pageWidth - margin, y, pageWidth - margin, y + rowH)

      const dateStr = wr.schedule?.date
        ? new Date(wr.schedule.date).toLocaleDateString('de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' })
        : '–'
      const shiftName = wr.schedule?.shift?.name || '–'
      const startTime = wr.actual_start_time?.substring(0, 5) || '–'
      const endTime = wr.actual_end_time?.substring(0, 5) || '–'
      const hours = parseFloat(wr.actual_hours || 0)
      totalHours += hours

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(dateStr, cols[0] + 3, y + 4.8)

      // Shift name chip
      const chipColor = shiftName.includes('Vormittag') || shiftName.includes('Früh')
        ? C.chipBlue
        : shiftName.includes('Nachmittag') || shiftName.includes('Spät')
          ? C.chipGreen
          : [240, 240, 240]
      const chipW = doc.getTextWidth(shiftName) + 4
      doc.setFillColor(...chipColor)
      rr(cols[1] + 2, y + 1.5, chipW, 4.2, 1, 'F')
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.text(shiftName, cols[1] + 4, y + 4.6)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textMuted)
      doc.text(startTime, cols[2] + 3, y + 4.8)
      doc.text(endTime, cols[3] + 3, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(fmt(hours), cols[5] - 3, y + 4.8, { align: 'right' })

      y += rowH
    })

    // Total row
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, rowH, 1.5, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Summe', cols[0] + 3, y + 4.8)
    doc.text(`${fmt(totalHours)} h`, cols[5] - 3, y + 4.8, { align: 'right' })
    y += rowH + 8
  }

  // ── Manual Hours Table ──
  if (reportData.manualEntries?.length > 0) {
    checkPageBreak(25)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.primary)
    doc.text('Manuell hinzugefügte Stunden', margin, y)
    y += 5

    const cols = [margin, margin + 28, margin + contentWidth]
    const headerH = 8
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, headerH, 1.5, 'F')

    doc.setFontSize(7)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Datum', cols[0] + 3, y + 5.3)
    doc.text('Beschreibung', cols[1] + 3, y + 5.3)
    doc.text('Stunden', cols[2] - 3, y + 5.3, { align: 'right' })
    y += headerH

    let manualTotal = 0
    reportData.manualEntries.forEach((mh, idx) => {
      checkPageBreak(rowH + 2)

      doc.setFillColor(...(idx % 2 === 0 ? C.rowEven : C.rowOdd))
      doc.rect(margin, y, contentWidth, rowH, 'F')
      doc.setDrawColor(...C.border)
      doc.setLineWidth(0.1)
      doc.line(margin, y + rowH, pageWidth - margin, y + rowH)
      doc.line(margin, y, margin, y + rowH)
      doc.line(pageWidth - margin, y, pageWidth - margin, y + rowH)

      const dateStr = new Date(mh.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })
      const desc = mh.description || '–'
      const hours = parseFloat(mh.hours || 0)
      manualTotal += hours

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(dateStr, cols[0] + 3, y + 4.8)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...C.textMuted)
      const maxDescWidth = contentWidth - 45
      const truncatedDesc = doc.splitTextToSize(desc, maxDescWidth)[0]
      doc.text(truncatedDesc, cols[1] + 3, y + 4.8)

      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...C.textDark)
      doc.text(fmt(hours), cols[2] - 3, y + 4.8, { align: 'right' })

      y += rowH
    })

    // Total row
    doc.setFillColor(...C.headerBg)
    rr(margin, y, contentWidth, rowH, 1.5, 'F')
    doc.setFontSize(7.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...C.headerText)
    doc.text('Summe', cols[0] + 3, y + 4.8)
    doc.text(`${fmt(manualTotal)} h`, cols[2] - 3, y + 4.8, { align: 'right' })
    y += rowH + 8
  }

  // ── Signature area ──
  checkPageBreak(40)
  y += 10

  doc.setDrawColor(...C.border)
  doc.setLineWidth(0.3)

  const sigY = y + 15
  doc.line(margin, sigY, margin + 70, sigY)
  doc.setFontSize(7.5)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...C.textMuted)
  doc.text('Ort, Datum', margin, sigY + 4)
  doc.text('Unterschrift Mitarbeiter', margin, sigY + 8)

  doc.line(margin + contentWidth - 70, sigY, margin + contentWidth, sigY)
  doc.text('Ort, Datum', margin + contentWidth - 70, sigY + 4)
  doc.text('Unterschrift Arbeitgeber', margin + contentWidth - 70, sigY + 8)

  // ── Footer ──
  doc.setFillColor(...C.accent)
  doc.rect(margin, pageHeight - 14, contentWidth, 0.5, 'F')
  doc.setFontSize(7)
  doc.setTextColor(...C.textMuted)
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  doc.text(`Erstellt am ${today}`, margin, pageHeight - 10)
  doc.text(`${fmtDate(startDate)} – ${fmtDate(endDate)}`, pageWidth - margin, pageHeight - 10, { align: 'right' })

  const fileName = `Stundennachweis_${employeeName.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`
  return { blob: doc.output('blob'), fileName }
}
