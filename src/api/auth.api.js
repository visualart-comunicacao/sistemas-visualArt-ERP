import { http } from './http'

export async function loginRequest({ email, password }) {
  console.log('POST /auth/login', { email })
  const { data } = await http.post('/auth/login', { email, password })
  return data
}

// Opcional (se existir no seu backend)
export async function meRequest() {
  const { data } = await http.get('/auth/me')
  return data
}
