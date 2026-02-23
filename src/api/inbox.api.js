import axios from 'axios'

// se você já tem um axios instance no projeto, troque pra ele
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1',
})

// injeta token (ajuste de acordo com seu AuthContext/localStorage)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function listTickets({ queue = 'espera', take = 30, skip = 0 }) {
  const res = await api.get('/inbox/tickets', { params: { queue, take, skip } })
  // ✅ agora vem direto
  return res.data // { items, total, meta }
}

export async function getTicketMessages(ticketId) {
  const res = await api.get(`/inbox/tickets/${ticketId}/messages`)
  return res.data // { items }
}

export async function assignTicket(ticketId, userId = null) {
  const res = await api.post(`/inbox/tickets/${ticketId}/assign`, { userId })
  return res.data // { ticket }
}

export async function closeTicket(ticketId) {
  const res = await api.post(`/inbox/tickets/${ticketId}/close`)
  return res.data // { ticket }
}

export async function sendTicketMessage(ticketId, text) {
  const res = await api.post(`/inbox/tickets/${ticketId}/messages`, { text })
  return res.data // { message }
}
