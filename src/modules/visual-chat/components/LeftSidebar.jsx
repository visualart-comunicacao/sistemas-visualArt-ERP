import React, { useMemo, useState } from 'react'
import { Avatar, Badge, Input, Select, Skeleton, Space, Typography } from 'antd'
import { AppstoreOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'

const { Text } = Typography

function stringToColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${Math.abs(hash) % 360}, 65%, 45%)`
}

function getFirstAndLastName(name) {
  if (!name) return ''

  const ignore = ['de', 'da', 'do', 'dos', 'das']

  const parts = name
    .trim()
    .split(' ')
    .filter((p) => !ignore.includes(p.toLowerCase()))

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  return `${parts[0]} ${parts[parts.length - 1]}`
}

function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function AgentChip({ agent, count, active, onClick }) {
  return (
    <button type="button" className="vc-agent-chip-wrap" onClick={onClick}>
      <Badge count={count} size="small" offset={[-2, 4]}>
        <div
          className={`vc-agent-chip ${active ? 'active' : ''}`}
          style={{
            background: active ? '#6c1bb8' : '#f1f1f1',
            // borderColor: active ? '#6c1bb8' : '#e5e5e5',
          }}
          title={agent?.name || 'Atendente'}
        >
          {agent?.avatarUrl ? (
            <img src={agent.avatarUrl} alt={agent.name} className="vc-agent-chip-img" />
          ) : agent?.avatar ? (
            <img src={agent.avatar} alt={agent.name} className="vc-agent-chip-img" />
          ) : (
            <Avatar
              size={34}
              style={{
                backgroundColor: active ? '#6c1bb8' : stringToColor(agent?.name || 'A'),
                color: '#fff',
              }}
            >
              {agent?.icon ? agent.icon : getInitials(agent?.name || 'A')}
            </Avatar>
          )}
        </div>
      </Badge>
    </button>
  )
}

function ThreadItem({ item, active, onClick }) {
  return (
    <div className={`vc-thread-item ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="vc-thread-avatar">
        {item.avatarUrl ? (
          <img src={item.avatarUrl} alt={item.title} />
        ) : (
          <Avatar
            size={42}
            style={{
              backgroundColor: stringToColor(item.title || 'Contato'),
              color: '#fff',
            }}
          >
            {getInitials(item.title || 'C')}
          </Avatar>
        )}
      </div>

      <div className="vc-thread-main">
        <div className="vc-thread-row">
          <Text className="vc-thread-title" ellipsis>
            {item.title}
          </Text>
          <Text className="vc-thread-time">{item.updatedAt || ''}</Text>
        </div>

        <div className="vc-thread-row">
          <Text className="vc-thread-preview" ellipsis>
            {item.lastMessage || 'Sem mensagens'}
          </Text>

          {!!item.unread && (
            <div className="vc-thread-unread">
              <span>{item.unread}</span>
            </div>
          )}
        </div>

        <div className="vc-thread-meta">
          <span className={`vc-queue-badge ${item.queue === 'Meus' ? 'meus' : 'espera'}`}>
            {item.queue}
          </span>
          {item.assignedTo ? <span className="vc-thread-assigned">{item.assignedTo}</span> : null}
        </div>
      </div>
    </div>
  )
}

export default function LeftSidebar({
  user,
  presenceOptions,
  onChangePresence,
  agents = [],
  threads = [],
  activeThreadId,
  onSelectThread,
  loading,
  queue = 'Todos',
  onChangeQueue,
}) {
  const [search, setSearch] = useState('')
  const [selectedAgent, setSelectedAgent] = useState('all')

  const counts = useMemo(() => {
    const meus = threads.filter((t) => t.queue === 'Meus').length
    const espera = threads.filter((t) => t.queue === 'Espera').length
    const todos = threads.length
    return { meus, espera, todos }
  }, [threads])

  const countsByAgent = useMemo(() => {
    const map = new Map()

    agents.forEach((a) => {
      map.set(a.id, 0)
    })

    threads.forEach((t) => {
      if (!t.assignedToId) return
      map.set(t.assignedToId, (map.get(t.assignedToId) || 0) + 1)
    })

    return map
  }, [agents, threads])

  const filteredThreads = useMemo(() => {
    let arr = [...threads]

    if (selectedAgent !== 'all') {
      arr = arr.filter((t) => t.assignedToId === selectedAgent)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      arr = arr.filter(
        (t) =>
          String(t.title || '')
            .toLowerCase()
            .includes(q) ||
          String(t.lastMessage || '')
            .toLowerCase()
            .includes(q) ||
          String(t.assignedTo || '')
            .toLowerCase()
            .includes(q),
      )
    }

    return arr
  }, [threads, selectedAgent, search])

  const visibleAgents = useMemo(() => {
    if (queue === 'Espera') return []
    return agents
  }, [agents, queue])

  return (
    <div className="vc-left-sidebar">
      <div className="vc-left-topbar">
        <Space align="center">
          <Avatar
            size={34}
            style={{ backgroundColor: stringToColor(user?.name || 'U') }}
            icon={!user?.name ? <UserOutlined /> : null}
          >
            {user?.name ? getInitials(user.name) : null}
          </Avatar>

          <div>
            <div className="vc-user-name">{getFirstAndLastName(user?.name) || 'Usuário'}</div>
            <div className="vc-user-status-row">
              <Select
                size="small"
                value={user?.presence}
                onChange={onChangePresence}
                options={(presenceOptions || []).map((p) => ({
                  value: p.value,
                  label: p.label,
                }))}
                style={{ width: 120 }}
              />
            </div>
          </div>
        </Space>
      </div>

      <div className="vc-tabs-row">
        <button
          type="button"
          className={`vc-tab-btn ${queue === 'Meus' ? 'active' : ''}`}
          onClick={() => onChangeQueue?.('Meus')}
        >
          <span>Meus</span>
          <span className="vc-tab-count">{counts.meus}</span>
        </button>

        <button
          type="button"
          className={`vc-tab-btn ${queue === 'Espera' ? 'active' : ''}`}
          onClick={() => onChangeQueue?.('Espera')}
        >
          <span>Espera</span>
          <span className="vc-tab-count">{counts.espera}</span>
        </button>

        <button
          type="button"
          className={`vc-tab-btn ${queue === 'Todos' ? 'active' : ''}`}
          onClick={() => onChangeQueue?.('Todos')}
        >
          <span>Todos</span>
          <span className="vc-tab-count">{counts.todos}</span>
        </button>
      </div>

      <div className="vc-agents-row">
        <AgentChip
          agent={{ name: 'Todos', icon: <AppstoreOutlined /> }}
          count={threads.filter((t) => !!t.assignedToId).length}
          active={selectedAgent === 'all'}
          onClick={() => setSelectedAgent('all')}
        />

        {visibleAgents.map((agent) => {
          const key = agent.id
          return (
            <AgentChip
              key={key}
              agent={agent}
              count={countsByAgent.get(key) ?? 0}
              active={selectedAgent === key}
              onClick={() => setSelectedAgent(key)}
            />
          )
        })}
      </div>

      <div className="vc-search-row">
        <Input
          prefix={<SearchOutlined />}
          placeholder="Buscar conversa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
        />
      </div>

      <div className="vc-thread-list">
        {loading ? (
          <div style={{ padding: 12 }}>
            <Skeleton active avatar paragraph={{ rows: 1 }} />
            <Skeleton active avatar paragraph={{ rows: 1 }} />
            <Skeleton active avatar paragraph={{ rows: 1 }} />
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="vc-empty-threads">
            <Text type="secondary">Nenhuma conversa encontrada.</Text>
          </div>
        ) : (
          filteredThreads.map((item) => (
            <ThreadItem
              key={item.id}
              item={item}
              active={item.id === activeThreadId}
              onClick={() => onSelectThread(item.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
