import React, { useMemo, useState } from 'react'
import { Button, Input, Popover, Space, Switch, Typography } from 'antd'
import { SendOutlined, PaperClipOutlined, AudioOutlined, SmileOutlined } from '@ant-design/icons'
import VoiceRecorderButton from './VoiceRecorderButton' // ajuste o path

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

// ✅ Agora recebe ticketId
export default function Composer({ ticketId, onSend, onSendImageMock, disabled }) {
  const [text, setText] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [sending, setSending] = useState(false)

  async function submit() {
    const v = String(text || '').trim()
    if (!v || disabled || sending) return

    try {
      setSending(true)
      await Promise.resolve(onSend?.(internalNote ? `[NOTA INTERNA] ${v}` : v))
      setText('')
    } finally {
      setSending(false)
    }
  }

  const emojiContent = useMemo(() => <EmojiPicker onPick={(e) => setText((t) => t + e)} />, [])

  // const audioDisabled = disabled || sending || !ticketId
  const audioDisabled = false

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        submit()
      }}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space>
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => onSendImageMock?.()}
              disabled={disabled || sending}
              htmlType="button"
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
            <Button icon={<SmileOutlined />} disabled={disabled || sending} htmlType="button" />
          </Popover>

          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              disabled ? 'Selecione uma conversa para enviar...' : 'Digite uma mensagem...'
            }
            disabled={disabled || sending}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.stopPropagation()
                submit()
              }
            }}
          />

          {/* ✅ Botão de áudio separado (grava e envia) */}
          <VoiceRecorderButton ticketId={ticketId} disabled={audioDisabled} />

          {/* ✅ Botão enviar texto */}
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              submit()
            }}
            disabled={disabled || sending}
            loading={sending}
            htmlType="button"
          >
            Enviar
          </Button>
        </Space.Compact>

        {/* Opcional: dica quando não tem ticket selecionado */}
        {!ticketId && !disabled ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Selecione uma conversa para habilitar o áudio.
          </Text>
        ) : null}
      </Space>
    </form>
  )
}
