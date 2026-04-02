import React from 'react'
import { Avatar, Button, Dropdown, Space, Tag, Tooltip } from 'antd'
import {
  UserOutlined,
  HistoryOutlined,
  CheckCircleOutlined,
  MoreOutlined,
  MenuFoldOutlined,
  ShareAltOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons'

function stringToColor(str = '') {
  let hash = 0
  for (let i = 0; i < str.length; i += 1) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${hash % 360}, 65%, 45%)`
}

function getInitials(name = '') {
  return String(name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

export default function ChatHeader({
  user,
  contact,
  thread,
  onToggleRight,
  onAssumeThread,
  onCloseThread,
  onOpenHistory,
  showRight,
  onShare,
}) {
  const responsible = thread?.assignedTo || null
  const isMine = responsible && responsible === user?.name
  const isWaiting = !thread?.assignedTo

  const menuItems = [
    {
      key: 'history',
      label: 'Histórico',
      icon: <HistoryOutlined />,
      onClick: onOpenHistory,
    },
    {
      key: 'share',
      label: 'Compartilhar',
      icon: <ShareAltOutlined />,
      onClick: () => onShare?.('copy'),
    },
  ]

  return (
    <>
      {/* HEADER */}
      <div style={styles.header}>
        {/* ESQUERDA */}
        <div style={styles.left}>
          <Avatar
            size={42}
            style={{
              backgroundColor: stringToColor(contact?.name || contact?.waId || 'Contato'),
              color: '#fff',
            }}
          >
            {getInitials(contact?.name || contact?.waId || 'C')}
          </Avatar>

          <div style={styles.meta}>
            <div style={styles.name}>{contact?.name || contact?.waId || 'Sem nome'}</div>

            <div style={styles.tags}>
              {responsible ? (
                <Tag color="purple">Responsável: {responsible}</Tag>
              ) : (
                <Tag color="red">Sem responsável</Tag>
              )}

              {thread?.status && <Tag>{thread.status}</Tag>}
            </div>
          </div>
        </div>

        {/* DIREITA */}
        <div style={styles.right}>
          <Space>
            {isWaiting && (
              <Tooltip title="Assumir conversa">
                <Button type="primary" icon={<UserOutlined />} onClick={onAssumeThread}>
                  Assumir
                </Button>
              </Tooltip>
            )}

            {isMine && (
              <Tooltip title="Encerrar ticket">
                <Button danger icon={<CheckCircleOutlined />} onClick={onCloseThread}>
                  Encerrar
                </Button>
              </Tooltip>
            )}

            <Tooltip title="Histórico">
              <Button icon={<HistoryOutlined />} onClick={onOpenHistory} />
            </Tooltip>

            <Dropdown
              menu={{
                items: menuItems.map((item) => ({
                  key: item.key,
                  icon: item.icon,
                  label: item.label,
                  onClick: item.onClick,
                })),
              }}
              trigger={['click']}
            >
              <Button icon={<MoreOutlined />} />
            </Dropdown>

            <Tooltip title="Painel direito">
              {!showRight ? (
                <Button icon={<MenuFoldOutlined />} onClick={onToggleRight} />
              ) : (
                <Button icon={<MenuUnfoldOutlined />} onClick={onToggleRight} />
              )}
            </Tooltip>
          </Space>
        </div>
      </div>

      {/* LINHA */}
      <div style={styles.divider} />
    </>
  )
}

/* =========================
   STYLES
========================= */

const styles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '12px 16px',
    background: '#fff',
  },

  left: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
  },

  meta: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    minWidth: 0,
  },

  name: {
    fontSize: 16,
    fontWeight: 700,
    color: '#222',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  tags: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    flexWrap: 'wrap',
  },

  right: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginLeft: 'auto', // 🔥 força ficar colado na direita
    flexShrink: 0,
  },

  divider: {
    borderBottom: '1px solid #eee',
  },
}
