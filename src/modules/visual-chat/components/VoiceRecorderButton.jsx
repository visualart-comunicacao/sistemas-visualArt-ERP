import { useEffect, useRef, useState } from 'react'
import { Button, message } from 'antd'
import { AudioOutlined, StopOutlined } from '@ant-design/icons'

export default function VoiceRecorderButton({
  ticketId,
  disabled,
  onRecordingChange,
  onRecordingTimeChange,
}) {
  const [isRecording, setIsRecording] = useState(false)

  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const secondsRef = useRef(0)

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
    if (disabled || !ticketId) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })

        stopTimer()
        stopStreamTracks()
        setIsRecording(false)
        onRecordingTimeChange?.(0)

        message.success('Áudio gravado com sucesso (mock).')
      }

      mediaRecorder.start()
      setIsRecording(true)
      startTimer()
    } catch (err) {
      console.error('[VisualChat] erro ao iniciar gravação:', err)
      message.error('Não foi possível acessar o microfone.')
      stopTimer()
      stopStreamTracks()
      setIsRecording(false)
      onRecordingTimeChange?.(0)
    }
  }

  function stopRecording() {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      } else {
        stopTimer()
        stopStreamTracks()
        setIsRecording(false)
        onRecordingTimeChange?.(0)
      }
    } catch (err) {
      console.error('[VisualChat] erro ao parar gravação:', err)
      stopTimer()
      stopStreamTracks()
      setIsRecording(false)
      onRecordingTimeChange?.(0)
      message.error('Erro ao finalizar gravação.')
    }
  }

  return isRecording ? (
    <Button
      danger
      icon={<StopOutlined />}
      onClick={stopRecording}
      htmlType="button"
      style={{ height: 'auto' }}
    />
  ) : (
    <Button
      icon={<AudioOutlined />}
      onClick={startRecording}
      // disabled={disabled || !ticketId}
      htmlType="button"
      style={{ height: 'auto' }}
    />
  )
}
