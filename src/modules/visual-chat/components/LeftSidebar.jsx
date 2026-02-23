import React, { useMemo, useState } from 'react'
import { Avatar, Badge, Button, Input, Segmented, Space, Typography, Dropdown, Tag } from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  UserOutlined,
  PlusOutlined,
  DownOutlined,
} from '@ant-design/icons'

const { Text } = Typography

function getInitials(name) {
  const n = String(name || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  return (first + last).toUpperCase() || first.toUpperCase() || '?'
}

export default function LeftSidebar({
  user,
  presenceOptions = [],
  onChangePresence,
  threads = [],
  activeThreadId,
  onSelectThread,
  onNewConversation,

  queue = 'Meus',
  onChangeQueue,
}) {
  const [q, setQ] = useState('')

  const counts = useMemo(() => {
    const c = { Meus: 0, Espera: 0, Todos: threads.length }
    for (const t of threads) {
      if (t.queue === 'Meus') c.Meus += 1
      if (t.queue === 'Espera') c.Espera += 1
    }
    return c
  }, [threads])

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase()
    return threads
      .filter((t) => (queue === 'Todos' ? true : t.queue === queue))
      .filter((t) => {
        if (!qq) return true
        const title = String(t.title || '').toLowerCase()
        const last = String(t.lastMessage || '').toLowerCase()
        return title.includes(qq) || last.includes(qq)
      })
  }, [threads, q, queue])

  const currentPresence = presenceOptions.find((p) => p.value === user?.presence)

  const presenceMenu = {
    items: presenceOptions.map((p) => ({
      key: p.value,
      label: (
        <Space>
          <Tag color={p.color}>{p.label}</Tag>
        </Space>
      ),
      onClick: () => onChangePresence?.(p.value),
    })),
  }

  return (
    <>
      {/* HEADER USUÁRIO */}
      <div className="vc-left-header">
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Avatar src={user?.avatarUrl} icon={<UserOutlined />}>
              {getInitials(user?.name)}
            </Avatar>

            <div style={{ lineHeight: 1.1 }}>
              <Text strong>{user?.name}</Text>

              <Dropdown menu={presenceMenu} trigger={['click']}>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.85,
                    cursor: 'pointer',
                    marginTop: 2,
                    userSelect: 'none',
                  }}
                >
                  <Space size={4}>
                    <span style={{ color: currentPresence?.color || '#52c41a' }}>●</span>
                    {currentPresence?.label || 'Disponível'}
                    <DownOutlined style={{ fontSize: 10 }} />
                  </Space>
                </div>
              </Dropdown>
            </div>
          </Space>

          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={onNewConversation}
            title="Nova conversa"
          />
        </Space>
      </div>

      {/* BUSCA + FILTRO */}
      <div className="vc-left-search">
        <Space style={{ width: '100%' }}>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            prefix={<SearchOutlined />}
            placeholder="Buscar por nome ou última mensagem"
            allowClear
          />
          <Button icon={<FilterOutlined />} title="Filtros (em breve)" />
        </Space>

        <div style={{ marginTop: 10 }}>
          <Segmented
            value={queue}
            onChange={(v) => onChangeQueue?.(v)}
            options={[
              { label: `Meus (${counts.Meus})`, value: 'Meus' },
              { label: `Espera (${counts.Espera})`, value: 'Espera' },
              { label: `Todos (${counts.Todos})`, value: 'Todos' },
            ]}
          />
        </div>
      </div>

      {/* LISTA */}
      <div className="vc-left-list">
        {filtered.map((t) => {
          const active = t.id === activeThreadId
          const initials = getInitials(t.title)

          return (
            <div
              key={t.id}
              onClick={() => onSelectThread?.(t.id)}
              style={{
                padding: 12,
                borderRadius: 14,
                border: active ? '1px solid rgba(0,168,89,0.25)' : '1px solid #EEF3F0',
                background: active ? 'rgba(0,168,89,0.08)' : '#fff',
                cursor: 'pointer',
                display: 'grid',
                gap: 8,
                marginBottom: 10,
              }}
            >
              {/* linha 1: avatar + nome + hora */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar size={36} style={{ flex: '0 0 auto' }}>
                  {initials}
                </Avatar>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <Text strong ellipsis style={{ maxWidth: 220 }}>
                      {t.title}
                    </Text>

                    <Text type="secondary" style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                      {t.updatedAt}
                    </Text>
                  </div>

                  {/* linha 2: preview + badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                    <Text type="secondary" ellipsis style={{ maxWidth: 230 }}>
                      {t.lastMessage || '—'}
                    </Text>

                    {t.unread > 0 ? <Badge count={t.unread} size="small" /> : null}
                  </div>
                </div>
              </div>

              {/* linha 3: tags de estado */}
              <div style={{ display: 'flex', gap: 6 }}>
                {t.queue === 'Espera' ? <Tag color="orange">Espera</Tag> : null}
                {t.waWindowUntil ? <Tag>24h</Tag> : null}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}
