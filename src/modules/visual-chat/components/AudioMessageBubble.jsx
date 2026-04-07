import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons'

const { Text } = Typography

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(Number(sec) || 0))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function AudioMessageBubble({ src, durationMs }) {
  const audioRef = useRef(null)

  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(() => (durationMs ? durationMs / 1000 : 0))

  const rates = useMemo(() => [1, 1.5, 2], [])

  useEffect(() => {
    setDur(durationMs ? durationMs / 1000 : 0)
  }, [durationMs])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    a.currentTime = 0
    a.playbackRate = rate
    setPlaying(false)

    const onTime = () => setCur(a.currentTime || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onMeta = () => {
      console.log('durationMs prop =', durationMs)
      console.log('audio.duration =', a.duration)
      console.log('src =', src)
      const realDuration = Number(a.duration)
      if (Number.isFinite(realDuration) && realDuration > 0) {
        setDur(realDuration)
      }
    }
    const onEnded = () => {
      setPlaying(false)
      setCur(0)
    }

    const onLoadedData = () => {
      setCur(0)
    }

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('loadeddata', onLoadedData)
    a.addEventListener('ended', onEnded)

    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('loadeddata', onLoadedData)
      a.removeEventListener('ended', onEnded)
    }
  }, [src, rate])

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0

  async function toggle() {
    const a = audioRef.current
    if (!a) return

    try {
      if (a.paused) await a.play()
      else a.pause()
    } catch (err) {
      console.error('Erro ao reproduzir áudio:', err)
    }
  }

  function seek(e) {
    const a = audioRef.current
    if (!a || !dur) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = Math.min(Math.max(0, e.clientX - rect.left), rect.width)
    const next = (x / rect.width) * dur
    a.currentTime = next
    setCur(next)
  }

  function cycleRate() {
    const idx = rates.indexOf(rate)
    const next = rates[(idx + 1) % rates.length]
    setRate(next)
  }

  return (
    <div
      style={{
        maxWidth: 360,
        padding: 10,
        borderRadius: 16,
        background: '#e7f3ff',
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button
          shape="circle"
          icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
          onClick={toggle}
          htmlType="button"
        />

        <div style={{ flex: 1, padding: '0 10px' }}>
          <div
            onClick={seek}
            role="button"
            tabIndex={0}
            style={{
              height: 8,
              borderRadius: 999,
              background: 'rgba(0,0,0,0.12)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${pct}%`,
                background: 'rgba(0,0,0,0.35)',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fmtTime(cur)}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fmtTime(dur)}
            </Text>
          </div>
        </div>

        <Button onClick={cycleRate} htmlType="button">
          {rate}x
        </Button>
      </Space>
    </div>
  )
}
