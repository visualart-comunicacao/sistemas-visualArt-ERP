import React from 'react'
import { Divider, Typography } from 'antd'

const { Title, Text } = Typography

export default function ContactInfoPanel({ contact }) {
  if (!contact) {
    return (
      <div style={{ padding: 16 }}>
        <Text type="secondary">Selecione uma conversa para ver detalhes.</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <Title level={5} style={{ marginTop: 0 }}>
        Informações
      </Title>

      <Divider />

      <div style={{ display: 'grid', gap: 8 }}>
        <Text>
          <b>Nome:</b> {contact.name}
        </Text>
        <Text>
          <b>Telefone:</b> {contact.phone}
        </Text>
      </div>

      <Divider />

      <Text type="secondary">Aqui depois entra: etiquetas, histórico, arquivos, etc.</Text>
    </div>
  )
}
