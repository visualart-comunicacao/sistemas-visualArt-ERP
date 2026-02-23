import { http } from '@/api/http'

export async function uploadProductImage(file) {
  const form = new FormData()
  form.append('file', file)

  const { data } = await http.post('/admin/uploads/product-image', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return data // { url: "/uploads/products/..." }
}
