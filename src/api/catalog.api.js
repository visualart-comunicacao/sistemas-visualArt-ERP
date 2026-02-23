import { http } from '@/api/http'

const admin = '/admin'

export async function listProducts(params = {}) {
  const { data } = await http.get(`${admin}/products`, { params })
  return data
}

export async function getProduct(id) {
  const { data } = await http.get(`${admin}/products/${id}`)
  return data
}

export async function createProduct(payload) {
  const { data } = await http.post(`${admin}/products`, payload)
  return data
}

export async function updateProduct(id, payload) {
  const { data } = await http.patch(`${admin}/products/${id}`, payload)
  return data
}

export async function listCategories(params = {}) {
  const { data } = await http.get(`${admin}/categories`, { params })
  return data
}

// ===== IMAGENS =====
export async function addProductImage(productId, payload) {
  const { data } = await http.post(`${admin}/products/${productId}/images`, payload)

  return data
}

// ===== ESTOQUE =====
export async function updateStock(productId, payload) {
  const { data } = await http.patch(`${admin}/stock/${productId}`, payload)
  return data
}

// ===== ESTOQUE =====
export async function activateProduct(productId, payload) {
  const { data } = await http.patch(`${admin}/products/${productId}/activate`, payload)
  return data
}

export async function desactivateProduct(productId, payload) {
  const { data } = await http.patch(`${admin}/products/${productId}/desactivateProduct`, payload)
  return data
}

export async function addOptionGroup(productId, payload) {
  const { data } = await http.post(`/admin/products/${productId}/option-groups`, payload)
  return data
}

export async function addOption(groupId, payload) {
  const { data } = await http.post(`/admin/option-groups/${groupId}/options`, payload)
  return data
}
