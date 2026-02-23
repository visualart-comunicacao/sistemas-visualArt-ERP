import React from 'react'
import { ConfigProvider } from 'antd'
import ptBR from 'antd/locale/pt_BR'
import 'antd/dist/reset.css'

import { AuthProvider } from '@/store/auth/AuthContext'
import { antdTheme } from '@/app/config/antdTheme'

export default function AppProviders({ children }) {
  return (
    <ConfigProvider locale={ptBR} theme={antdTheme}>
      <AuthProvider>{children}</AuthProvider>
    </ConfigProvider>
  )
}
