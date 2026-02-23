import React, { useState } from 'react'
import { Button, Form, Input, Space, Typography, message } from 'antd'
import { LockOutlined, MailOutlined, ArrowRightOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/store/auth/AuthContext'
import AuthCard from '../components/AuthCard'

const { Text } = Typography

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  async function onFinish(values) {
    try {
      setLoading(true)
      await login(values)
      navigate('/', { replace: true })
    } catch (err) {
      const apiMsg = err?.response?.data?.message || err?.response?.data?.error
      message.error(apiMsg || 'Não foi possível entrar. Verifique email e senha.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* Fundo sutil com “vida” */}
      <div style={{ position: 'relative', height: 120 }}>
        <motion.div
          initial={{ opacity: 0.25, x: -18 }}
          animate={{ opacity: 0.35, x: 18 }}
          transition={{ duration: 3.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            background:
              'radial-gradient(circle at 20% 30%, rgba(0,168,89,0.16), transparent 55%), radial-gradient(circle at 80% 60%, rgba(149,201,73,0.10), transparent 55%)',
            filter: 'blur(2px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 18,
            border: '1px solid rgba(0,0,0,0.06)',
            background: 'rgba(255,255,255,0.35)',
            backdropFilter: 'blur(2px)',
          }}
        />
      </div>

      <AuthCard title="Entrar" subtitle="Acesse o painel do ERP">
        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item
            label="E-mail"
            name="email"
            rules={[
              { required: true, message: 'Informe seu e-mail' },
              { type: 'email', message: 'E-mail inválido' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="seuemail@dominio.com" />
          </Form.Item>

          <Form.Item
            label="Senha"
            name="password"
            rules={[{ required: true, message: 'Informe sua senha' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="••••••••" />
          </Form.Item>

          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<ArrowRightOutlined />}
              block
            >
              Entrar
            </Button>

            <Text type="secondary" style={{ fontSize: 12, textAlign: 'center', display: 'block' }}>
              O logo aqui será personalizável pelo <b>ADMIN_MASTER</b>.
            </Text>
          </Space>
        </Form>
      </AuthCard>
    </div>
  )
}
