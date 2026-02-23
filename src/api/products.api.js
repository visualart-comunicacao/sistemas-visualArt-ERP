import { http } from '@/api/http'

// ajuste a rota conforme seu backend: /products (público) ou /admin/products
export async function listProducts(params = {}) {
  const { data } = await http.get('/products', { params })
  return data // { data, meta } ou array
}

export async function getProduct(id) {
  const { data } = await http.get(`/products/${id}`)
  return data
}
