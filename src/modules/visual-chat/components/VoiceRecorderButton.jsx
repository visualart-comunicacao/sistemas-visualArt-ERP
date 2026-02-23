import { useEffect, useRef, useState } from 'react'
import { Button, Tooltip, message as antdMessage } from 'antd'
import { AudioOutlined, StopOutlined } from '@ant-design/icons'
import { http } from '@/api/http' // seu axios

function pickSupportedMime() {
  const mimes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/ogg']
  for (const m of mimes) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(m)) return m
  }
  return ''
}

export default function VoiceRecorderButton({ ticketId, onSent, disabled }) {
  const [recording, setRecording] = useState(false)
  const recRef = useRef(null)
  const chunksRef = useRef([])
  const startedAtRef = useRef(0)
  const streamRef = useRef(null)

  useEffect(() => {
    return () => {
      try {
        streamRef.current?.getTracks()?.forEach((t) => t.stop())
      } catch (err) {
        console.error('Erro ao parar stream:', err)
      }
    }
  }, [])

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = pickSupportedMime()
      const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      chunksRef.current = []
      startedAtRef.current = Date.now()

      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      rec.onstop = async () => {
        const durationMs = Math.max(0, Date.now() - startedAtRef.current)
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' })

        // upload
        const fd = new FormData()
        fd.append('file', blob, `voice.${rec.mimeType?.includes('ogg') ? 'ogg' : 'webm'}`)
        fd.append('durationMs', String(durationMs))

        try {
          const { data } = await http.post(`/inbox/tickets/${ticketId}/voice`, fd, {
            headers: { 'Content-Type': 'multipart/form-data' },
          })
          onSent?.(data)
        } catch (err) {
          antdMessage.error('Falha ao enviar áudio.')
        } finally {
          try {
            streamRef.current?.getTracks()?.forEach((t) => t.stop())
          } catch (err) {
            console.error('Erro ao parar stream:', err)
          }
          streamRef.current = null
        }
      }

      recRef.current = rec
      rec.start()
      setRecording(true)
    } catch (err) {
      antdMessage.error('Sem permissão do microfone ou dispositivo indisponível.')
    }
  }

  function stop() {
    try {
      recRef.current?.stop()
    } finally {
      setRecording(false)
    }
  }

  return (
    <Tooltip title={recording ? 'Parar e enviar' : 'Gravar áudio'}>
      <Button
        type={recording ? 'primary' : 'default'}
        danger={recording}
        icon={recording ? <StopOutlined /> : <AudioOutlined />}
        onClick={recording ? stop : start}
        disabled={disabled}
      />
    </Tooltip>
  )
}
