import { useEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { AudioOutlined, StopOutlined } from '@ant-design/icons'

function getSupportedMimeType() {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ]

  for (const type of types) {
    if (window.MediaRecorder?.isTypeSupported?.(type)) return type
  }

  return ''
}

function getExtensionFromMimeType(mimeType) {
  if (!mimeType) return 'webm'
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'm4a'
  if (mimeType.includes('mpeg')) return 'mp3'
  return 'webm'
}

export default function VoiceRecorderButton({
  ticketId,
  disabled,
  onRecordingChange,
  onRecordingTimeChange,
  onRecorded,
}) {
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const secondsRef = useRef(0)
  const mimeTypeRef = useRef('audio/webm')

  useEffect(() => {
    onRecordingChange?.(isRecording)
  }, [isRecording, onRecordingChange])

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }

  function stopStreamTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  function resetState() {
    stopTimer()
    stopStreamTracks()
    setIsRecording(false)
    secondsRef.current = 0
    onRecordingTimeChange?.(0)
  }

  useEffect(() => {
    return () => {
      stopTimer()
      stopStreamTracks()
    }
  }, [])

  function startTimer() {
    stopTimer()
    secondsRef.current = 0
    onRecordingTimeChange?.(0)

    timerRef.current = setInterval(() => {
      secondsRef.current += 1
      onRecordingTimeChange?.(secondsRef.current)
    }, 1000)
  }

  async function startRecording() {
    if (disabled || !ticketId || isRecording) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      mimeTypeRef.current = mimeType || 'audio/webm'

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        try {
          const finalMimeType = mimeTypeRef.current || chunksRef.current?.[0]?.type || 'audio/webm'

          const blob = new Blob(chunksRef.current, { type: finalMimeType })
          const durationSec = Math.max(1, secondsRef.current || 1)
          const ext = getExtensionFromMimeType(finalMimeType)

          const file = new File([blob], `audio-${Date.now()}.${ext}`, {
            type: finalMimeType,
          })

          resetState()

          await onRecorded?.({
            file,
            blob,
            durationSec,
            mimeType: finalMimeType,
          })
        } catch (err) {
          console.error('[VisualChat] erro ao processar áudio:', err)
          resetState()
          message.error('Erro ao processar o áudio gravado.')
        }
      }

      mediaRecorder.onerror = (event) => {
        console.error('[VisualChat] erro no MediaRecorder:', event)
        resetState()
        message.error('Erro durante a gravação.')
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error('[VisualChat] erro ao iniciar gravação:', err)
      resetState()
      message.error('Não foi possível acessar o microfone.')
    }
  }

  function stopRecording() {
    try {
      const recorder = mediaRecorderRef.current
      console.log('[VoiceRecorderButton] stopRecording state =', recorder?.state)

      if (!recorder) {
        resetState()
        return
      }

      if (recorder.state === 'recording') {
        recorder.stop()
        return
      }

      resetState()
    } catch (err) {
      console.error('[VisualChat] erro ao parar gravação:', err)
      resetState()
      message.error('Erro ao finalizar gravação.')
    }
  }

  return isRecording ? (
    <Button
      danger
      type="primary"
      icon={<StopOutlined />}
      onClick={stopRecording}
      htmlType="button"
      style={{ height: 'auto', minWidth: 96 }}
    >
      Parar
    </Button>
  ) : (
    <Button
      icon={<AudioOutlined />}
      onClick={startRecording}
      disabled={disabled || !ticketId}
      htmlType="button"
      style={{ height: 'auto', minWidth: 96 }}
    >
      Áudio
    </Button>
  )
}
