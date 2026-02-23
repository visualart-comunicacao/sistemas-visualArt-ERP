import axios from 'axios'
import { env, assertEnv } from '@/app/config/env'

assertEnv()

export const http = axios.create({
  baseURL: env.API_URL,
  timeout: 20000,
})

function getToken() {
  return localStorage.getItem('access_token')
}

http.interceptors.request.use((config) => {
  const token = getToken()
  const isAuthLogin = config.url?.includes('/auth/login')

  // não injeta token no login
  if (token && !isAuthLogin) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status
    const url = err?.config?.url || ''
    const isLoginCall = url.includes('/auth/login')

    if (status === 401 && isLoginCall) return Promise.reject(err)

    // ✅ nunca deslogar por falha do stream
    if (status === 401 && url.includes('/inbox/stream')) return Promise.reject(err)

    // ✅ não deslogar por 409 (janela 24h), 403 (forbidden), etc.
    if (status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    return Promise.reject(err)
  },
)
