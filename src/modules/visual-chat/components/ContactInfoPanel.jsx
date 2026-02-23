import React, { useEffect, useState } from 'react'
import { Button, Input, Space, Typography, message as antdMessage } from 'antd'
import { updateContact } from '@/api/visualChat.api'

const { Text, Title } = Typography

export default function ContactInfoPanel({ contact, onContactUpdated }) {
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setName(contact?.name || '')
  }, [contact?.id])

  async function onSave() {
    if (!contact?.id) return
    const nextName = String(name || '').trim()
    setSaving(true)
    try {
      const resp = await updateContact(contact.id, { name: nextName || null })
      const updated = resp?.contact || null
      antdMessage.success('Contato atualizado!')
      onContactUpdated?.(updated)
    } catch (err) {
      antdMessage.error('Não foi possível salvar o contato.')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (!contact) {
    return (
      <div style={{ padding: 16 }}>
        <Title level={5}>Informações</Title>
        <Text type="secondary">Selecione uma conversa.</Text>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }}>
      <Title level={5} style={{ marginTop: 0 }}>
        Informações
      </Title>

      <div style={{ marginTop: 12 }}>
        <Text strong>Nome</Text>
        <Input
          style={{ marginTop: 6 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: João - Loja X"
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <Text strong>Telefone</Text>
        <div style={{ marginTop: 6 }}>
          <Text>{contact.phone || contact.phoneE164 || '—'}</Text>
        </div>
      </div>

      <Space style={{ marginTop: 16 }}>
        <Button type="primary" onClick={onSave} loading={saving}>
          Salvar
        </Button>
      </Space>

      <div style={{ marginTop: 18 }}>
        <Text type="secondary">Depois a gente adiciona tags, notas e avatar aqui.</Text>
      </div>
    </div>
  )
}
