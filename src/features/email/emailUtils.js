export const formatEmailDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' })
}

const sanitizeEmailHtml = (html) => {
  if (!html) return ''

  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    const selectors = ['style', 'script', 'iframe', 'object', 'embed', 'link', 'meta', 'base']
    doc.querySelectorAll(selectors.join(',')).forEach((node) => node.remove())
    return doc.body.innerHTML || ''
  } catch (_error) { // eslint-disable-line no-unused-vars
    return html
  }
}

export const getEmailBodyHtml = (email) => {
  if (!email) return ''

  if (email.htmlBody?.length > 0) {
    const partId = email.htmlBody[0].partId
    const html = email.bodyValues?.[partId]?.value || ''
    return sanitizeEmailHtml(html)
  }
  if (email.textBody?.length > 0) {
    const partId = email.textBody[0].partId
    const text = email.bodyValues?.[partId]?.value || ''
    return text.replace(/\n/g, '<br>')
  }
  return email.preview || ''
}
