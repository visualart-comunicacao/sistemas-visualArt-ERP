// src/api/visualChat.api.js
// Visual Chat API (Inbox/Tickets + Mensagens + WhatsApp)
// Padrão: axios instance "http" (mesmo padrão de upload.api.js)

import { http } from '@/api/http'
import { env } from '@/app/config/env'

// =========================
// INBOX (Tickets/Threads)
// =========================

// GET /inbox/tickets?queue=meus|espera|todos&take&skip
// resposta do seu backend hoje: { data: { total, items }, meta: {...} }
export async function listTickets(params = {}) {
  const { data } = await http.get('/inbox/tickets', { params })
  return data
}

// GET /inbox/tickets/:ticketId/messages
// resposta: { data: [...] } (dependendo do seu controller atual)
export async function listTicketMessages(ticketId, params = {}) {
  const { data } = await http.get(`/inbox/tickets/${ticketId}/messages`, { params })
  return data
}

// POST /inbox/tickets/:ticketId/assign body: { userId?: string|null }
export async function assignTicket(ticketId) {
  const res = await http.patch(`/inbox/tickets/${ticketId}/assign`)
  return res.data // { ticket }
}
// POST /inbox/tickets/:ticketId/close
export async function closeTicket(ticketId) {
  const { data } = await http.post(`/inbox/tickets/${ticketId}/close`)
  return data
}

// POST /inbox/tickets/:ticketId/messages body: { text }
export async function sendTicketMessage(ticketId, text) {
  const { data } = await http.post(`/inbox/tickets/${ticketId}/messages`, { text })
  return data
}

// =========================
// WHATSAPP SEND (Painel)
// =========================

export async function sendText({ contactId, toWaId, text }) {
  const { data } = await http.post(`/whatsapp/messages/text`, { contactId, toWaId, text })
  return data
}

export async function sendTextByPhone({ toWaId, text, name }) {
  const { data } = await http.post(`/whatsapp/messages/text-by-phone`, { toWaId, text, name })
  return data
}

export async function sendTemplate({
  toWaId,
  templateName = 'hello_world',
  languageCode = 'en_US',
  components,
  name,
}) {
  const { data } = await http.post(`/whatsapp/messages/template`, {
    toWaId,
    templateName,
    languageCode,
    components,
    name,
  })
  return data
}

export async function sendSmart({
  contactId,
  toWaId,
  text,
  fallbackTemplate = 'hello_world',
  languageCode = 'en_US',
  name,
}) {
  if (contactId) {
    try {
      return await sendText({ contactId, toWaId, text })
    } catch (_err) {
      return sendTemplate({ toWaId, templateName: fallbackTemplate, languageCode, name })
    }
  }

  try {
    return await sendTextByPhone({ toWaId, text, name })
  } catch (_err) {
    return sendTemplate({ toWaId, templateName: fallbackTemplate, languageCode, name })
  }
}

// =========================
// Helpers
// =========================

export function isAbortError(err) {
  return err?.name === 'CanceledError' || err?.name === 'AbortError'
}

export function getApiErrorMessage(err) {
  const d = err?.response?.data
  if (!d) return err?.message || 'Erro desconhecido'
  if (typeof d === 'string') return d
  return d?.message || d?.error?.message || d?.error || err?.message || 'Erro desconhecido'
}

// =========================
// Realtime (SSE)
// =========================
// GET /inbox/stream?access_token=...
// OBS: EventSource não suporta headers custom, então usa query param.

export function openInboxStream() {
  const token = localStorage.getItem('access_token')
  if (!token) throw new Error('Sem access_token no localStorage')

  // env.API_URL já é: http://localhost:3000/api/v1
  const base = env.API_URL
  const url = `${base}/inbox/stream?access_token=${encodeURIComponent(token)}`

  return new EventSource(url)
}

export async function updateContact(contactId, data) {
  const res = await http.patch(`/inbox/contacts/${contactId}`, data)
  return res.data // { contact }
}

export async function sendTicketAudio(ticketId, file, extra = {}) {
  if (!ticketId) throw new Error('ticketId é obrigatório')
  if (!file) throw new Error('arquivo de áudio é obrigatório')

  const formData = new FormData()
  formData.append('file', file, file.name || 'audio.webm')

  if (extra.caption) formData.append('caption', extra.caption)
  if (extra.durationSec != null) formData.append('durationSec', String(extra.durationSec))
  if (extra.mimeType) formData.append('mimeType', extra.mimeType)

  const response = await http.post(`/tickets/${ticketId}/messages/audio`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}

export async function listInboxAgents() {
  const { data } = await http.get('/inbox/agents')
  return data
}
