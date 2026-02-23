import React from 'react'
import { Layout } from 'antd'

const { Content } = Layout

export default function AuthLayout({ children }) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>{children}</div>
      </Content>
    </Layout>
  )
}
