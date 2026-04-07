import { useMemo, useState } from 'react'
import { Button, Input, Popover, Space, Switch, Typography } from 'antd'
import { SendOutlined, PaperClipOutlined, SmileOutlined } from '@ant-design/icons'
import VoiceRecorderButton from './VoiceRecorderButton'
import EmojiPicker from './EmojiPicker'

const { Text } = Typography

function formatRecordingTime(totalSeconds) {
  const safe = Number(totalSeconds || 0)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export default function Composer({ ticketId, onSend, onSendAudio, onSendImageMock, disabled }) {
  const [text, setText] = useState('')
  const [internalNote, setInternalNote] = useState(false)
  const [sending, setSending] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingSeconds, setRecordingSeconds] = useState(0)

  async function submit() {
    const v = String(text || '').trim()
    if (!v || disabled || sending || isRecording) return

    try {
      setSending(true)
      await Promise.resolve(onSend?.(internalNote ? `[NOTA INTERNA] ${v}` : v))
      setText('')
    } finally {
      setSending(false)
    }
  }

  async function handleRecordedAudio({ file, durationSec, mimeType }) {
    if (!ticketId || disabled || sending) return

    try {
      setSending(true)
      await Promise.resolve(
        onSendAudio?.({
          ticketId,
          file,
          durationSec,
          mimeType,
          internalNote,
        }),
      )
    } finally {
      setSending(false)
    }
  }

  const emojiContent = useMemo(
    () => <EmojiPicker onPick={(emoji) => setText((prev) => `${prev}${emoji}`)} />,
    [],
  )

  const audioDisabled = disabled || sending || !ticketId

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        submit()
      }}
      style={{ width: '100%' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Space size={8}>
            <Button
              type="text"
              icon={<PaperClipOutlined />}
              onClick={() => onSendImageMock?.()}
              disabled={disabled || sending || isRecording}
              htmlType="button"
            />
            <Text type="secondary">Anexar (mock)</Text>
          </Space>

          <Space size={8}>
            <Switch
              checked={internalNote}
              onChange={setInternalNote}
              size="small"
              disabled={sending || isRecording}
            />
            <Text type="secondary">Nota Interna</Text>
          </Space>
        </Space>

        {isRecording ? (
          <div
            style={{
              width: '100%',
              minHeight: 48,
              border: '1px solid #d9d9d9',
              borderRadius: 10,
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#fff',
            }}
          >
            <Space size={10}>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#ff4d4f',
                  display: 'inline-block',
                }}
              />
              <Text strong>Gravando áudio</Text>
            </Space>

            <Text
              style={{
                fontVariantNumeric: 'tabular-nums',
                fontWeight: 600,
                minWidth: 52,
                textAlign: 'right',
              }}
            >
              {formatRecordingTime(recordingSeconds)}
            </Text>
          </div>
        ) : null}

        <Space.Compact style={{ width: '100%', alignItems: 'stretch' }}>
          <Popover content={emojiContent} trigger="click" placement="topLeft" destroyTooltipOnHide>
            <Button
              icon={<SmileOutlined />}
              disabled={disabled || sending || isRecording}
              htmlType="button"
              style={{ height: 'auto' }}
            />
          </Popover>

          <Input.TextArea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={
              disabled ? 'Selecione uma conversa para enviar...' : 'Digite uma mensagem...'
            }
            disabled={disabled || sending || isRecording}
            autoSize={{ minRows: 1, maxRows: 5 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                e.stopPropagation()
                submit()
              }
            }}
            style={{
              resize: 'none',
            }}
          />

          <VoiceRecorderButton
            ticketId={ticketId}
            disabled={audioDisabled}
            onRecordingChange={setIsRecording}
            onRecordingTimeChange={setRecordingSeconds}
            onRecorded={handleRecordedAudio}
          />

          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              submit()
            }}
            disabled={disabled || sending || isRecording}
            loading={sending}
            htmlType="button"
            style={{ height: 'auto' }}
          >
            Enviar
          </Button>
        </Space.Compact>

        {!ticketId && !disabled ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Selecione uma conversa para habilitar o áudio.
          </Text>
        ) : null}
      </Space>
    </form>
  )
}
