const KEY_TOKEN = 'access_token'
const KEY_USER = 'user'

export const authStorage = {
  getToken() {
    return localStorage.getItem(KEY_TOKEN)
  },
  setToken(token) {
    localStorage.setItem(KEY_TOKEN, token)
  },
  clearToken() {
    localStorage.removeItem(KEY_TOKEN)
  },

  getUser() {
    const raw = localStorage.getItem(KEY_USER)
    return raw ? JSON.parse(raw) : null
  },
  setUser(user) {
    localStorage.setItem(KEY_USER, JSON.stringify(user))
  },
  clearUser() {
    localStorage.removeItem(KEY_USER)
  },

  clearAll() {
    localStorage.removeItem(KEY_TOKEN)
    localStorage.removeItem(KEY_USER)
  },
}
