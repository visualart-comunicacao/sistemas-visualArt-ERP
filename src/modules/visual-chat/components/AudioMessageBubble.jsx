import { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Space, Typography } from 'antd'
import { CaretRightOutlined, PauseOutlined } from '@ant-design/icons'

const { Text } = Typography

function fmtTime(sec) {
  const s = Math.max(0, Math.floor(sec))
  const mm = String(Math.floor(s / 60)).padStart(2, '0')
  const ss = String(s % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

export default function AudioMessageBubble({ src, durationMs }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [rate, setRate] = useState(1)
  const [cur, setCur] = useState(0)
  const [dur, setDur] = useState(durationMs ? durationMs / 1000 : 0)

  const rates = useMemo(() => [1, 1.5, 2], [])

  useEffect(() => {
    const a = audioRef.current
    if (!a) return

    const onTime = () => setCur(a.currentTime || 0)
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)
    const onMeta = () => setDur(a.duration || dur || 0)
    const onEnded = () => setPlaying(false)

    a.addEventListener('timeupdate', onTime)
    a.addEventListener('play', onPlay)
    a.addEventListener('pause', onPause)
    a.addEventListener('loadedmetadata', onMeta)
    a.addEventListener('ended', onEnded)

    return () => {
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('play', onPlay)
      a.removeEventListener('pause', onPause)
      a.removeEventListener('loadedmetadata', onMeta)
      a.removeEventListener('ended', onEnded)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  useEffect(() => {
    const a = audioRef.current
    if (a) a.playbackRate = rate
  }, [rate])

  const pct = dur > 0 ? Math.min(100, (cur / dur) * 100) : 0

  function toggle() {
    const a = audioRef.current
    if (!a) return
    if (a.paused) a.play()
    else a.pause()
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
        background: '#e7f3ff', // ajuste para seu tema
      }}
    >
      <audio ref={audioRef} src={src} preload="metadata" />

      <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Button
          shape="circle"
          icon={playing ? <PauseOutlined /> : <CaretRightOutlined />}
          onClick={toggle}
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
              {fmtTime(dur || 0)}
            </Text>
          </div>
        </div>

        <Button onClick={cycleRate}>{rate}x</Button>
      </Space>
    </div>
  )
}
