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

export default function LeftSidebar({
  user,
  presenceOptions = [],
  onChangePresence,
  threads,
  activeThreadId,
  onSelectThread,
  onNewConversation,
}) {
  const [q, setQ] = useState('')
  const [queue, setQueue] = useState('Meus')

  const counts = useMemo(() => {
    const c = { Meus: 0, Espera: 0, Todos: threads.length }
    for (const t of threads) {
      if (t.queue === 'Meus') c.Meus += 1
      if (t.queue === 'Espera') c.Espera += 1
    }
    return c
  }, [threads])

  const filtered = useMemo(() => {
    return threads
      .filter((t) => (queue === 'Todos' ? true : t.queue === queue))
      .filter((t) => t.title.toLowerCase().includes(q.toLowerCase()))
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
            <Avatar icon={<UserOutlined />} />
            <div style={{ lineHeight: 1.1 }}>
              <Text strong>{user?.name}</Text>

              <Dropdown menu={presenceMenu} trigger={['click']}>
                <div
                  style={{
                    fontSize: 12,
                    opacity: 0.8,
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  <Space size={4}>
                    <span style={{ color: currentPresence?.color }}>●</span>
                    {currentPresence?.label}
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
            placeholder="Buscar"
            allowClear
          />
          <Button icon={<FilterOutlined />} />
        </Space>

        <div style={{ marginTop: 10 }}>
          <Segmented
            value={queue}
            onChange={setQueue}
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
          return (
            <div
              key={t.id}
              onClick={() => onSelectThread(t.id)}
              style={{
                padding: 12,
                borderRadius: 14,
                border: active ? '1px solid rgba(0,168,89,0.25)' : '1px solid #EEF3F0',
                background: active ? 'rgba(0,168,89,0.08)' : '#fff',
                cursor: 'pointer',
                display: 'grid',
                gap: 6,
                marginBottom: 10,
              }}
            >
              <Space style={{ justifyContent: 'space-between' }}>
                <Text strong ellipsis style={{ maxWidth: 220 }}>
                  {t.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t.updatedAt}
                </Text>
              </Space>

              <Space style={{ justifyContent: 'space-between' }}>
                <Text type="secondary" ellipsis style={{ maxWidth: 230 }}>
                  {t.lastMessage}
                </Text>
                <Badge count={t.unread} size="small" />
              </Space>
            </div>
          )
        })}
      </div>
    </>
  )
}
