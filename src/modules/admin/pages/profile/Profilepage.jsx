import React, { useEffect, useMemo, useState } from 'react'
import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Typography,
  Upload,
  message,
  Tag,
} from 'antd'
import {
  CameraOutlined,
  SaveOutlined,
  UndoOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  IdcardOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useAuth } from '@/store/auth/AuthContext'

const { Title, Text } = Typography

function maskDoc(v = '') {
  const s = String(v).replace(/\D/g, '')
  if (s.length <= 11) return v // cpf
  return v // cnpj (depois você pode formatar)
}

export default function ProfilePage() {
  const { user } = useAuth()

  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  // Foto (mock): preview local
  const [avatarPreview, setAvatarPreview] = useState(null)

  const initialValues = useMemo(() => {
    return {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      document: user?.document || '',
    }
  }, [user])

  useEffect(() => {
    form.setFieldsValue(initialValues)
  }, [form, initialValues])

  const roleLabel = useMemo(() => {
    if (user?.role === 'ADMIN') return { text: 'Administrador', color: 'gold' }
    if (user?.role === 'CUSTOMER') return { text: 'Cliente', color: 'blue' }
    return { text: user?.role || 'Usuário', color: 'default' }
  }, [user])

  const handleUpload = (file) => {
    // preview local
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target.result)
    reader.readAsDataURL(file)

    message.success('Foto carregada (preview). Salve para aplicar.')
    // impede upload automático (mock)
    return false
  }

  async function onFinish(values) {
    try {
      setSaving(true)

      // ✅ MOCK: aqui vai a chamada da API depois
      // await profileService.updateMe(values, avatarFile)
      await new Promise((r) => setTimeout(r, 700))

      console.log('SAVE PROFILE', values, { avatarPreview })

      message.success('Perfil atualizado com sucesso!')
    } catch (err) {
      message.error('Não foi possível salvar seu perfil.')
    } finally {
      setSaving(false)
    }
  }

  function onReset() {
    form.setFieldsValue(initialValues)
    setAvatarPreview(null)
    message.info('Alterações desfeitas.')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header chamativo */}
      <div
        style={{
          borderRadius: 16,
          padding: 16,
          border: '1px solid #DCE9E3',
          background: 'linear-gradient(135deg, rgba(0,168,89,0.14), rgba(123, 97, 255, 0.10))',
        }}
      >
        <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
          <div>
            <Title level={4} style={{ margin: 0 }}>
              Meu Perfil
            </Title>
            <Text type="secondary">Atualize sua foto, nome de exibição e dados de contato.</Text>
          </div>

          <Space>
            <Tag icon={<SafetyCertificateOutlined />} color={roleLabel.color}>
              {roleLabel.text}
            </Tag>
          </Space>
        </Space>
      </div>

      <Row gutter={[16, 16]}>
        {/* Coluna esquerda: cartão do usuário */}
        <Col xs={24} md={9}>
          <Card
            style={{
              borderRadius: 16,
              border: '1px solid #DCE9E3',
              boxShadow: '0 10px 28px rgba(6,108,71,0.06)',
            }}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <Space align="center" size={14}>
                <Avatar
                  size={72}
                  src={avatarPreview || undefined}
                  icon={!avatarPreview ? <UserOutlined /> : undefined}
                />
                <div style={{ lineHeight: 1.15 }}>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.name || 'Usuário'}</div>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>{user?.email || '—'}</div>
                </div>
              </Space>

              <Upload accept="image/*" showUploadList={false} beforeUpload={handleUpload}>
                <Button icon={<CameraOutlined />} block>
                  Alterar foto
                </Button>
              </Upload>

              <Divider style={{ margin: '6px 0' }} />

              <Space direction="vertical" size={6}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Dica
                </Text>
                <Text style={{ fontSize: 13, opacity: 0.85 }}>
                  Use uma imagem quadrada (ex.: 512x512) para melhor resultado.
                </Text>
              </Space>
            </Space>
          </Card>
        </Col>

        {/* Coluna direita: formulário */}
        <Col xs={24} md={15}>
          <Card
            title={<span style={{ fontWeight: 700 }}>Dados do Perfil</span>}
            style={{
              borderRadius: 16,
              border: '1px solid #DCE9E3',
              boxShadow: '0 10px 28px rgba(6,108,71,0.06)',
            }}
          >
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={initialValues}>
              <Row gutter={12}>
                <Col xs={24} md={12}>
                  <Form.Item
                    label="Nome de exibição"
                    name="name"
                    rules={[
                      { required: true, message: 'Informe seu nome de exibição.' },
                      { min: 2, message: 'Mínimo 2 caracteres.' },
                    ]}
                  >
                    <Input prefix={<UserOutlined />} placeholder="Ex.: Alex Borelli" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="E-mail" name="email">
                    <Input prefix={<MailOutlined />} disabled placeholder="Seu e-mail" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Telefone" name="phone">
                    <Input prefix={<PhoneOutlined />} placeholder="(xx) xxxxx-xxxx" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item label="Documento" name="document">
                    <Input
                      prefix={<IdcardOutlined />}
                      placeholder="CPF / CNPJ"
                      onBlur={(e) => {
                        form.setFieldValue('document', maskDoc(e.target.value))
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button icon={<UndoOutlined />} onClick={onReset}>
                  Cancelar
                </Button>
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving}>
                  Salvar alterações
                </Button>
              </Space>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
