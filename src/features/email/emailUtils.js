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

export const resolveCidImages = async (email, jmapClient) => {
  const htmlPartId = email.htmlBody?.[0]?.partId
  if (!htmlPartId) return email

  const html = email.bodyValues?.[htmlPartId]?.value
  if (!html || !html.includes('cid:')) return email

  // CID-Parts aus bodyStructure und attachments sammeln
  const cidParts = []
  const walkStructure = (part) => {
    if (part.cid) cidParts.push(part)
    if (part.subParts) part.subParts.forEach(walkStructure)
  }
  if (email.bodyStructure) walkStructure(email.bodyStructure)
  if (email.attachments) {
    for (const att of email.attachments) {
      if (att.cid && !cidParts.find(p => p.cid === att.cid)) {
        cidParts.push(att)
      }
    }
  }

  // Nur tatsächlich referenzierte CIDs auflösen
  const referenced = cidParts.filter(p => html.includes(`cid:${p.cid}`))
  if (referenced.length === 0) return email

  const resolved = await Promise.all(
    referenced.map(async (part) => {
      const objectUrl = await jmapClient.fetchBlobAsObjectUrl(part.blobId, part.type)
      return { cid: part.cid, objectUrl }
    })
  )

  let newHtml = html
  for (const { cid, objectUrl } of resolved) {
    if (objectUrl) {
      newHtml = newHtml.replaceAll(`cid:${cid}`, objectUrl)
    }
  }

  return {
    ...email,
    bodyValues: {
      ...email.bodyValues,
      [htmlPartId]: { ...email.bodyValues[htmlPartId], value: newHtml }
    }
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
