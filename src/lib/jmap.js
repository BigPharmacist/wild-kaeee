/**
 * JMAP Client für Stalwart Mail Server
 * Unterstützt: E-Mails lesen, senden, Polling für Updates
 */

const DEFAULT_JMAP_URL = import.meta.env.VITE_JMAP_URL || 'https://mail.kaeee.de'

class JMAPClient {
  constructor() {
    this.session = null
    this.apiUrl = null
    this.downloadUrl = null
    this.uploadUrl = null
    this.wsUrl = null
    this.accountId = null
    this.credentials = null
    this.pollingInterval = null
    this.listeners = new Set()
    this.baseUrl = null
  }

  /**
   * Authentifizieren und Session abrufen
   */
  async authenticate(username, password, jmapUrl = null) {
    this.baseUrl = jmapUrl || DEFAULT_JMAP_URL
    this.credentials = btoa(`${username}:${password}`)

    const response = await fetch(`${this.baseUrl}/jmap/session`, {
      headers: {
        'Authorization': `Basic ${this.credentials}`
      }
    })

    if (!response.ok) {
      throw new Error(`Authentifizierung fehlgeschlagen: ${response.status}`)
    }

    this.session = await response.json()
    const baseOrigin = new URL(this.baseUrl).origin
    const baseWsOrigin = baseOrigin.replace(/^https:/i, 'wss:').replace(/^http:/i, 'ws:')
    const replaceOrigin = (url, origin) => (url ? url.replace(/^https?:\/\/[^/]+/i, origin) : url)
    const replaceWsOrigin = (url) => (url ? url.replace(/^wss?:\/\/[^/]+/i, baseWsOrigin) : url)

    this.apiUrl = replaceOrigin(this.session.apiUrl, baseOrigin)
    this.downloadUrl = replaceOrigin(this.session.downloadUrl, baseOrigin)
    this.uploadUrl = replaceOrigin(this.session.uploadUrl, baseOrigin)

    // WebSocket URL für Push-Updates
    const wsCapability = this.session.capabilities['urn:ietf:params:jmap:websocket']
    if (wsCapability) {
      this.wsUrl = replaceWsOrigin(wsCapability.url)
    }

    // Ersten Account als Standard verwenden
    const accounts = Object.keys(this.session.accounts)
    if (accounts.length > 0) {
      this.accountId = accounts[0]
    }

    return this.session
  }

  /**
   * JMAP API Request ausführen
   */
  async request(methodCalls) {
    if (!this.apiUrl || !this.credentials) {
      throw new Error('Nicht authentifiziert')
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        using: [
          'urn:ietf:params:jmap:core',
          'urn:ietf:params:jmap:mail',
          'urn:ietf:params:jmap:submission'
        ],
        methodCalls
      })
    })

    if (!response.ok) {
      throw new Error(`JMAP Request fehlgeschlagen: ${response.status}`)
    }

    const data = await response.json()
    return data.methodResponses
  }

  /**
   * Alle Mailboxen abrufen (Inbox, Sent, Drafts, etc.)
   * Inkl. unreadEmails für Badge-Counts
   */
  async getMailboxes() {
    const responses = await this.request([
      ['Mailbox/get', {
        accountId: this.accountId,
        properties: [
          'id', 'name', 'role', 'sortOrder',
          'totalEmails', 'unreadEmails',
          'parentId', 'myRights'
        ]
      }, 'a']
    ])

    const [name, result] = responses[0]
    if (name === 'Mailbox/get') {
      return result.list
    }
    throw new Error('Mailbox/get fehlgeschlagen')
  }

  /**
   * E-Mails aus einer Mailbox abrufen
   */
  async getEmails(mailboxId, options = {}) {
    const { limit = 50, position = 0 } = options

    // Erst Query für IDs, dann Get für Details
    const responses = await this.request([
      ['Email/query', {
        accountId: this.accountId,
        filter: mailboxId ? { inMailbox: mailboxId } : {},
        sort: [{ property: 'receivedAt', isAscending: false }],
        position,
        limit
      }, 'a'],
      ['Email/get', {
        accountId: this.accountId,
        '#ids': {
          resultOf: 'a',
          name: 'Email/query',
          path: '/ids'
        },
        properties: [
          'id', 'blobId', 'threadId', 'mailboxIds',
          'from', 'to', 'cc', 'bcc', 'replyTo',
          'subject', 'sentAt', 'receivedAt',
          'hasAttachment', 'preview', 'keywords'
        ]
      }, 'b']
    ])

    const queryResult = responses.find(r => r[0] === 'Email/query')
    const getResult = responses.find(r => r[0] === 'Email/get')

    return {
      emails: getResult ? getResult[1].list : [],
      total: queryResult ? queryResult[1].total : 0,
      position: queryResult ? queryResult[1].position : 0
    }
  }

  /**
   * Globale Fulltext-Suche über alle Ordner
   */
  async searchEmails(query, options = {}) {
    const { limit = 50 } = options

    const responses = await this.request([
      ['Email/query', {
        accountId: this.accountId,
        filter: { text: query },
        sort: [{ property: 'receivedAt', isAscending: false }],
        limit
      }, 'a'],
      ['Email/get', {
        accountId: this.accountId,
        '#ids': {
          resultOf: 'a',
          name: 'Email/query',
          path: '/ids'
        },
        properties: [
          'id', 'blobId', 'threadId', 'mailboxIds',
          'from', 'to', 'cc', 'bcc', 'replyTo',
          'subject', 'sentAt', 'receivedAt',
          'hasAttachment', 'preview', 'keywords'
        ]
      }, 'b']
    ])

    const queryResult = responses.find(r => r[0] === 'Email/query')
    const getResult = responses.find(r => r[0] === 'Email/get')

    return {
      emails: getResult ? getResult[1].list : [],
      total: queryResult ? queryResult[1].total : 0
    }
  }

  /**
   * Einzelne E-Mail mit vollem Body abrufen
   */
  async getEmail(emailId) {
    const responses = await this.request([
      ['Email/get', {
        accountId: this.accountId,
        ids: [emailId],
        properties: [
          'id', 'blobId', 'threadId', 'mailboxIds',
          'from', 'to', 'cc', 'bcc', 'replyTo',
          'subject', 'sentAt', 'receivedAt',
          'hasAttachment', 'preview', 'keywords',
          'bodyStructure', 'bodyValues', 'textBody', 'htmlBody', 'attachments'
        ],
        fetchAllBodyValues: true
      }, 'a']
    ])

    const [name, result] = responses[0]
    if (name === 'Email/get' && result.list.length > 0) {
      return result.list[0]
    }
    throw new Error('E-Mail nicht gefunden')
  }

  /**
   * E-Mail senden
   * @param {Object} options
   * @param {Array} options.attachments - [{blobId, type, name, size}]
   */
  async sendEmail({ to, cc, bcc, subject, textBody, htmlBody, replyTo, inReplyTo, attachments }) {
    // Identity ID holen (benötigt für Stalwart)
    const identityResponses = await this.request([
      ['Identity/get', { accountId: this.accountId }, 'identity']
    ])
    const identityResult = identityResponses.find(r => r[0] === 'Identity/get')
    const identities = identityResult?.[1]?.list || []
    const identity = identities[0]

    if (!identity) {
      throw new Error('Keine E-Mail-Identität gefunden')
    }

    // E-Mail Draft erstellen
    const email = {
      from: [{ email: identity.email, name: identity.name }],
      to: to.map(addr => typeof addr === 'string' ? { email: addr } : addr),
      subject,
      bodyValues: {},
      textBody: [],
      htmlBody: []
    }

    if (cc) email.cc = cc.map(addr => typeof addr === 'string' ? { email: addr } : addr)
    if (bcc) email.bcc = bcc.map(addr => typeof addr === 'string' ? { email: addr } : addr)
    if (replyTo) email.replyTo = [{ email: replyTo }]
    if (inReplyTo) email.inReplyTo = inReplyTo

    if (textBody) {
      email.bodyValues.text = { value: textBody }
      email.textBody = [{ partId: 'text', type: 'text/plain' }]
    }

    if (htmlBody) {
      email.bodyValues.html = { value: htmlBody }
      email.htmlBody = [{ partId: 'html', type: 'text/html' }]
    }

    // Anhänge hinzufügen
    if (attachments && attachments.length > 0) {
      email.attachments = attachments.map(att => ({
        blobId: att.blobId,
        type: att.type,
        name: att.name,
        size: att.size,
        disposition: 'attachment'
      }))
    }

    // Mailbox IDs für Drafts und Sent finden
    const mailboxes = await this.getMailboxes()
    const draftsMailbox = mailboxes.find(m => m.role === 'drafts')
    const sentMailbox = mailboxes.find(m => m.role === 'sent')

    if (draftsMailbox) {
      email.mailboxIds = { [draftsMailbox.id]: true }
    }

    // E-Mail erstellen und senden
    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        create: { draft: email }
      }, 'a'],
      ['EmailSubmission/set', {
        accountId: this.accountId,
        create: {
          submission: {
            emailId: '#draft',
            identityId: identity.id,
            envelope: {
              mailFrom: { email: identity.email },
              rcptTo: [
                ...to.map(addr => ({ email: typeof addr === 'string' ? addr : addr.email })),
                ...(cc || []).map(addr => ({ email: typeof addr === 'string' ? addr : addr.email })),
                ...(bcc || []).map(addr => ({ email: typeof addr === 'string' ? addr : addr.email }))
              ]
            }
          }
        },
        onSuccessUpdateEmail: {
          '#submission': {
            mailboxIds: sentMailbox ? { [sentMailbox.id]: true } : {},
            'keywords/$draft': null
          }
        }
      }, 'b']
    ])

    // Fehler in JMAP-Antwort prüfen
    for (const [method, result, id] of responses) {
      if (method === 'error') {
        throw new Error(result.description || result.type || 'JMAP Fehler')
      }
      if (result.notCreated) {
        const errors = Object.values(result.notCreated)
        if (errors.length > 0) {
          throw new Error(errors[0].description || errors[0].type || 'E-Mail konnte nicht erstellt werden')
        }
      }
    }

    return responses
  }

  /**
   * E-Mail verschieben (z.B. in Papierkorb)
   */
  async moveEmail(emailId, toMailboxId, fromMailboxId) {
    const update = {
      mailboxIds: { [toMailboxId]: true }
    }

    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update: { [emailId]: update }
      }, 'a']
    ])

    return responses
  }

  /**
   * E-Mail als gelesen/ungelesen markieren
   */
  async setEmailRead(emailId, isRead) {
    const responses = await this.request([
      ['Email/set', {
        accountId: this.accountId,
        update: {
          [emailId]: {
            ['keywords/$seen']: isRead ? true : null
          }
        }
      }, 'a']
    ])

    return responses
  }

  /**
   * E-Mail löschen (in Papierkorb verschieben)
   */
  async deleteEmail(emailId) {
    const mailboxes = await this.getMailboxes()
    const trashMailbox = mailboxes.find(m => m.role === 'trash')

    if (trashMailbox) {
      return this.moveEmail(emailId, trashMailbox.id)
    }

    // Kein Papierkorb - direkt löschen
    return this.request([
      ['Email/set', {
        accountId: this.accountId,
        destroy: [emailId]
      }, 'a']
    ])
  }

  /**
   * Polling für E-Mail-Updates starten
   * (WebSocket nicht möglich wegen Basic Auth Limitierung in Browsern)
   */
  startPolling(onUpdate, intervalMs = 30000) {
    if (this.pollingInterval) {
      this.stopPolling()
    }

    let lastEmailState = null

    const poll = async () => {
      if (!this.credentials || !this.accountId) return

      try {
        // Aktuellen State abrufen
        const responses = await this.request([
          ['Email/get', { accountId: this.accountId, ids: [], properties: ['id'] }, 'state']
        ])

        const result = responses.find(r => r[0] === 'Email/get')
        if (result) {
          const newState = result[1].state
          if (lastEmailState && newState !== lastEmailState) {
            // State hat sich geändert - neue E-Mails
            onUpdate({ changed: { Email: true } })
            this.listeners.forEach(listener => listener({ changed: { Email: true } }))
          }
          lastEmailState = newState
        }
      } catch (e) {
        console.error('Polling Fehler:', e)
      }
    }

    // Sofort einmal prüfen, dann im Intervall
    poll()
    this.pollingInterval = setInterval(poll, intervalMs)
    console.log(`JMAP Polling gestartet (alle ${intervalMs / 1000}s)`)

    return this.pollingInterval
  }

  /**
   * Polling stoppen
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
      console.log('JMAP Polling gestoppt')
    }
  }

  /**
   * Event Listener für Updates registrieren
   */
  onUpdate(callback) {
    this.listeners.add(callback)
    return () => this.listeners.delete(callback)
  }

  /**
   * Datei hochladen (für Anhänge)
   */
  async uploadBlob(file) {
    if (!this.uploadUrl || !this.credentials) {
      throw new Error('Upload nicht möglich - nicht authentifiziert')
    }

    const url = this.uploadUrl.replace('{accountId}', this.accountId)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${this.credentials}`,
        'Content-Type': file.type || 'application/octet-stream'
      },
      body: file
    })

    if (!response.ok) {
      throw new Error(`Upload fehlgeschlagen: ${response.status}`)
    }

    const result = await response.json()
    return {
      blobId: result.blobId,
      type: result.type,
      size: result.size
    }
  }

  /**
   * Attachment-URL generieren (intern)
   */
  getAttachmentUrl(blobId, filename, type) {
    if (!this.downloadUrl || !this.accountId) return null

    return this.downloadUrl
      .replace('{accountId}', this.accountId)
      .replace('{blobId}', blobId)
      .replace('{name}', encodeURIComponent(filename))
      .replace('{type}', encodeURIComponent(type))
  }

  /**
   * Attachment herunterladen (mit Auth)
   */
  async downloadAttachment(blobId, filename, type) {
    const url = this.getAttachmentUrl(blobId, filename, type)
    if (!url || !this.credentials) {
      throw new Error('Download nicht möglich')
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${this.credentials}`
      }
    })

    if (!response.ok) {
      throw new Error(`Download fehlgeschlagen: ${response.status}`)
    }

    // Blob erstellen und Download auslösen
    const blob = await response.blob()
    const objectUrl = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = objectUrl
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)

    // URL freigeben
    setTimeout(() => URL.revokeObjectURL(objectUrl), 100)
  }

  /**
   * Session zurücksetzen (Logout)
   */
  logout() {
    this.stopPolling()
    this.session = null
    this.apiUrl = null
    this.downloadUrl = null
    this.uploadUrl = null
    this.wsUrl = null
    this.accountId = null
    this.credentials = null
  }
}

// Singleton Export
export const jmap = new JMAPClient()
export default jmap
