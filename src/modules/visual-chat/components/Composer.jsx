import React, { useMemo, useState } from 'react'
import { Button, Input, Popover, Space, Switch, Typography } from 'antd'
import { SendOutlined, PaperClipOutlined, AudioOutlined, SmileOutlined } from '@ant-design/icons'

const { Text } = Typography

const EMOJIS = [
  '😀',
  '😁',
  '😂',
  '🤣',
  '😊',
  '😍',
  '😎',
  '🤝',
  '👍',
  '🙏',
  '🔥',
  '✅',
  '❤️',
  '🎉',
  '📎',
  '📌',
]

function EmojiPicker({ onPick }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8, padding: 8 }}>
      {EMOJIS.map((e) => (
        <button
          key={e}
          onClick={() => onPick(e)}
          style={{ border: 'none', background: 'transparent', fontSize: 18, cursor: 'pointer' }}
          type="button"
        >
          {e}
        </button>
      ))}
    </div>
  )
}

export default function Composer({ onSend, onSendImageMock, disabled }) {
  const [text, setText] = useState('')
  const [internalNote, setInternalNote] = useState(false)

  function submit() {
    const v = text.trim()
    if (!v) return
    onSend(internalNote ? `[NOTA INTERNA] ${v}` : v)
    setText('')
  }

  const emojiContent = useMemo(() => <EmojiPicker onPick={(e) => setText((t) => t + e)} />, [])

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
        <Space>
          <Button
            type="text"
            icon={<PaperClipOutlined />}
            onClick={() => onSendImageMock?.()}
            disabled={disabled}
          />
          <Text type="secondary">Anexar (mock)</Text>
        </Space>

        <Space>
          <Switch checked={internalNote} onChange={setInternalNote} size="small" />
          <Text type="secondary">Nota Interna</Text>
        </Space>
      </Space>

      <Space.Compact style={{ width: '100%' }}>
        <Popover content={emojiContent} trigger="click">
          <Button icon={<SmileOutlined />} disabled={disabled} />
        </Popover>

        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Digite uma mensagem..."
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault()
              submit()
            }
          }}
          disabled={disabled}
        />

        <Button icon={<AudioOutlined />} disabled={disabled} />
        <Button type="primary" icon={<SendOutlined />} onClick={submit} disabled={disabled}>
          Enviar
        </Button>
      </Space.Compact>
    </Space>
  )
}
