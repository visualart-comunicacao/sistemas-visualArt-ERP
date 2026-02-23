import React, { useMemo, useState } from 'react'
import { Avatar, Button, Dropdown, Modal, Select, Space, Tag, Typography, Tooltip } from 'antd'
import {
  UserOutlined,
  ShareAltOutlined,
  MoreOutlined,
  SwapOutlined,
  DownOutlined,
} from '@ant-design/icons'

const { Text } = Typography

export default function ChatHeader({
  contact,
  thread,
  agents = [],
  onChangeTicket,
  onTransfer,
  onShare,
  onToggleRight,
}) {
  const [transferOpen, setTransferOpen] = useState(false)
  const [transferTo, setTransferTo] = useState(null)

  const ticketMenu = useMemo(() => {
    const list = thread?.ticketList || []
    return {
      items: list.map((t) => ({
        key: t,
        label: t,
        onClick: () => onChangeTicket?.(t),
      })),
    }
  }, [thread, onChangeTicket])

  const shareMenu = {
    items: [
      { key: 'copy', label: 'Copiar link (mock)', onClick: () => onShare?.('copy') },
      { key: 'export', label: 'Exportar conversa (mock)', onClick: () => onShare?.('export') },
    ],
  }

  return (
    <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
      <Space style={{ minWidth: 0 }}>
        <Avatar icon={<UserOutlined />} />
        <div style={{ lineHeight: 1.1, minWidth: 0 }}>
          <Text strong style={{ display: 'block' }}>
            {contact?.name || 'Selecione uma conversa'}
          </Text>

          <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
            {(contact?.tags || []).map((t) => (
              <Tag key={t} color="green">
                {t}
              </Tag>
            ))}
          </div>
        </div>
      </Space>

      <Space wrap>
        {/* Ticket Atual */}
        <Dropdown menu={ticketMenu} trigger={['click']} disabled={!thread}>
          <Button>
            Ticket Atual: <b>{thread?.ticketCurrent || '#—'}</b> <DownOutlined />
          </Button>
        </Dropdown>

        {/* Transferir */}
        <Button icon={<SwapOutlined />} onClick={() => setTransferOpen(true)} disabled={!thread}>
          Transferir
        </Button>

        {/* Compartilhar */}
        <Dropdown menu={shareMenu} trigger={['click']} disabled={!thread}>
          <Button icon={<ShareAltOutlined />} />
        </Dropdown>

        {/* 3 pontinhos: painel direito */}
        <Tooltip title="Recolher/mostrar painel">
          <Button icon={<MoreOutlined />} onClick={onToggleRight} />
        </Tooltip>
      </Space>

      <Modal
        open={transferOpen}
        title="Transferir conversa"
        okText="Transferir"
        cancelText="Cancelar"
        onCancel={() => setTransferOpen(false)}
        onOk={() => {
          if (!transferTo) return
          onTransfer?.(transferTo)
          setTransferOpen(false)
          setTransferTo(null)
        }}
      >
        <Select
          style={{ width: '100%' }}
          placeholder="Selecione o atendente"
          options={agents.map((a) => ({ label: a, value: a }))}
          value={transferTo}
          onChange={setTransferTo}
        />
      </Modal>
    </Space>
  )
}
