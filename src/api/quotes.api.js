import { http } from '@/api/http'

// LISTAR
export async function listQuotes(params = {}) {
  const { data } = await http.get('/admin/quotes', { params })
  return data // { data, meta }
}

// DETALHE
export async function getQuote(id) {
  const { data } = await http.get(`/admin/quotes/${id}`)
  return data
}

// CRIAR
export async function createQuote(body) {
  const { data } = await http.post('/admin/quotes', body)
  return data
}

// APROVAR
export async function approveQuote(id, body = {}) {
  const { data } = await http.post(`/admin/quotes/${id}/approve`, body)
  return data
}

// CONVERTER (gera SALE + OS)
export async function convertQuote(id, body = {}) {
  const { data } = await http.post(`/admin/quotes/${id}/convert`, body)
  return data
}

// CANCELAR
export async function cancelQuote(id, body = {}) {
  const { data } = await http.post(`/admin/quotes/${id}/cancel`, body)
  return data
}

export async function updateQuote(id, payload) {
  const { data } = await http.patch(`/admin/quotes/${id}`, payload)
  return data
}
