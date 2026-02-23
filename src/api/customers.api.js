import { http } from '@/api/http'

export async function listCustomers(params = {}) {
  const { data } = await http.get('/admin/erp-customers', { params })
  return data
}

export async function createCustomer(payload) {
  const { data } = await http.post('/admin/erp-customers', payload)
  return data
}

// quando você criar no backend:
export async function getCustomer(id) {
  const { data } = await http.get(`/admin/erp-customers/${id}`)
  return data
}

export async function updateCustomer(id, payload) {
  const { data } = await http.patch(`/admin/erp-customers/${id}`, payload)
  return data
}

export async function removeCustomer(id) {
  const { data } = await http.delete(`/admin/erp-customers/${id}`)
  return data
}
