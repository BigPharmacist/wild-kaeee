/**
 * OpenClaw Gateway WebSocket Client
 *
 * Protocol:
 *   req  → {type:"req", id:<uuid>, method, params}
 *   res  ← {type:"res", id:<uuid>, ok:true, payload} | {type:"res", id, error:{code,message}}
 *   event← {type:"event", event, payload}
 *
 * Connection: open → challenge event (nonce) → connect request → hello-ok
 * Chat:       chat.send → chat events (delta → final)
 */

const WS_URL = import.meta.env.VITE_OPENCLAW_WS_URL || 'ws://127.0.0.1:18789'
const TOKEN = import.meta.env.VITE_OPENCLAW_TOKEN || ''

function uuid() {
  return crypto.randomUUID()
}

class OpenClawClient {
  constructor() {
    this.ws = null
    this.pending = new Map()
    this.closed = true
    this.connected = false
    this.connectNonce = null
    this.connectSent = false
    this.backoffMs = 800
    this.reconnectTimer = null
    this.sessionKey = 'kaeee-chat'
    this.displayName = null
    this.instanceId = uuid()

    // Callbacks
    this.onConnected = null
    this.onDisconnected = null
    this.onChatDelta = null
    this.onChatFinal = null
    this.onChatError = null
  }

  start() {
    this.closed = false
    this._connect()
  }

  configure({ staffId, displayName }) {
    this.sessionKey = `kaeee-staff-${staffId}`
    this.displayName = displayName
  }

  stop() {
    this.closed = true
    this.connected = false
    clearTimeout(this.reconnectTimer)
    this.reconnectTimer = null
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this._flushPending(new Error('client stopped'))
  }

  _connect() {
    if (this.closed) return

    this.connectSent = false
    this.connectNonce = null
    this.ws = new WebSocket(WS_URL)

    this.ws.addEventListener('open', () => {
      // Gateway sends challenge event first; if it doesn't arrive within 750ms, try anyway
      setTimeout(() => {
        if (!this.connectSent) this._sendConnect()
      }, 750)
    })

    this.ws.addEventListener('message', (e) => this._handleMessage(String(e.data || '')))

    this.ws.addEventListener('close', () => {
      const wasConnected = this.connected
      this.ws = null
      this.connected = false
      this._flushPending(new Error('connection closed'))
      if (wasConnected) this.onDisconnected?.()
      this._scheduleReconnect()
    })

    this.ws.addEventListener('error', () => {})
  }

  _scheduleReconnect() {
    if (this.closed) return
    this.reconnectTimer = setTimeout(() => {
      this.backoffMs = Math.min(this.backoffMs * 1.5, 15000)
      this._connect()
    }, this.backoffMs)
  }

  async _sendConnect() {
    if (this.connectSent) return
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
    this.connectSent = true

    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: 'webchat',
        version: 'dev',
        platform: 'web',
        mode: 'webchat',
        instanceId: this.instanceId,
        displayName: this.displayName || undefined,
      },
      role: 'operator',
      scopes: ['operator.read', 'operator.write'],
      caps: [],
      auth: { token: TOKEN },
      userAgent: navigator.userAgent,
      locale: navigator.language,
    }

    try {
      const result = await this.request('connect', params)
      this.connected = true
      this.backoffMs = 800
      this.onConnected?.(result)
    } catch (err) {
      console.error('[openclaw] connect failed:', err.message)
      this.ws?.close()
    }
  }

  request(method, params = {}) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return Promise.reject(new Error('not connected'))
    }

    const id = uuid()
    const frame = { type: 'req', id, method, params }

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify(frame))
    })
  }

  _handleMessage(raw) {
    let msg
    try {
      msg = JSON.parse(raw)
    } catch {
      return
    }

    if (msg.type === 'event') {
      this._handleEvent(msg)
    } else if (msg.type === 'res') {
      const pending = this.pending.get(msg.id)
      if (pending) {
        this.pending.delete(msg.id)
        if (msg.error) {
          const err = new Error(msg.error.message || 'gateway error')
          err.code = msg.error.code
          pending.reject(err)
        } else {
          pending.resolve(msg.payload)
        }
      }
    }
  }

  _handleEvent(msg) {
    const { event, payload } = msg

    if (event === 'connect.challenge') {
      const nonce = payload?.nonce
      if (typeof nonce === 'string') {
        this.connectNonce = nonce
        this._sendConnect()
      }
      return
    }

    if (event === 'chat') {
      this._handleChatEvent(payload)
    }
  }

  _handleChatEvent(payload) {
    if (!payload) return
    // Gateway prefixes sessionKey with "agent:main:", so check with endsWith
    if (payload.sessionKey && !payload.sessionKey.endsWith(this.sessionKey)) return

    const state = payload.state

    if (state === 'delta') {
      const text = this._extractText(payload.message)
      if (text !== null) {
        this.onChatDelta?.(text, payload.runId)
      }
    } else if (state === 'final') {
      const message = this._extractFinalMessage(payload.message)
      if (message) {
        this.onChatFinal?.(message, payload.runId)
      }
    } else if (state === 'error') {
      this.onChatError?.(payload.errorMessage || 'Unbekannter Fehler', payload.runId)
    } else if (state === 'aborted') {
      const text = this._extractText(payload.message)
      if (text) {
        this.onChatFinal?.({ role: 'assistant', content: text, timestamp: Date.now() }, payload.runId)
      } else {
        this.onChatError?.('Antwort abgebrochen', payload.runId)
      }
    }
  }

  _extractText(message) {
    if (!message) return null
    if (Array.isArray(message.content)) {
      return message.content
        .filter(p => p.type === 'text')
        .map(p => p.text || '')
        .join('')
    }
    if (typeof message.content === 'string') return message.content
    if (typeof message.text === 'string') return message.text
    return null
  }

  _extractFinalMessage(message) {
    if (!message) return null
    const text = this._extractText(message)
    return {
      role: message.role || 'assistant',
      content: text || '',
      timestamp: message.timestamp || Date.now(),
    }
  }

  _flushPending(err) {
    for (const [, p] of this.pending) {
      p.reject(err)
    }
    this.pending.clear()
  }

  // --- Public API ---

  async sendMessage(text) {
    return this.request('chat.send', {
      sessionKey: this.sessionKey,
      message: text,
      deliver: false,
      idempotencyKey: uuid(),
    })
  }

  async getHistory(limit = 100) {
    const result = await this.request('chat.history', {
      sessionKey: this.sessionKey,
      limit,
    })
    return Array.isArray(result?.messages) ? result.messages : []
  }

  async abort() {
    try {
      await this.request('chat.abort', { sessionKey: this.sessionKey })
    } catch { /* ignore */ }
  }
}

// Singleton
export const openclaw = new OpenClawClient()
export default openclaw
