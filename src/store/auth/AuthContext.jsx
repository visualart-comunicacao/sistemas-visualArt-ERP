/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useMemo, useState } from 'react'
import { message } from 'antd'
import { authStorage } from './auth.storage'
import { loginRequest } from '@/api/auth.api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser())

  const token = authStorage.getToken()
  const isAuthenticated = !!token && !!user
  const isAdmin = user?.role === 'ADMIN'

  async function login({ email, password }) {
    const data = await loginRequest({ email, password })

    const accessToken = data.accessToken || data.token
    const userData = data.user

    if (userData?.role !== 'ADMIN') {
      authStorage.clearAll()
      throw {
        response: { data: { message: 'Acesso permitido apenas para administradores.' } },
      }
    }

    if (!accessToken || !userData) {
      throw new Error('Resposta de login inválida: esperado accessToken/token e user')
    }

    authStorage.setToken(accessToken)
    authStorage.setUser(userData)
    setUser(userData)

    message.success('Login realizado')
  }

  function logout() {
    authStorage.clearAll()
    setUser(null)
  }

  const value = useMemo(
    () => ({ user, isAuthenticated, isAdmin, login, logout }),
    [user, isAuthenticated, isAdmin],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
