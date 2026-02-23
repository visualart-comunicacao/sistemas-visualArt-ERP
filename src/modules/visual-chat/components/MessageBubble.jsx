import React from 'react'
import { Button, Image } from 'antd'

export default function MessageBubble({ message }) {
  const mine = message.author === 'me'

  const wrapStyle = {
    display: 'flex',
    justifyContent: mine ? 'flex-end' : 'flex-start',
    gap: 10,
    marginBottom: 12,
  }

  const avatarStyle = {
    width: 28,
    height: 28,
    borderRadius: 999,
    background: mine ? '#bfbfbf' : '#d9d9d9',
    flex: '0 0 auto',
    marginTop: 2,
  }

  const bubbleStyle = {
    maxWidth: 560,
    padding: 12,
    borderRadius: 14,
    background: mine ? 'rgba(0,168,89,0.10)' : 'rgba(124,58,237,0.12)',
    border: mine ? '1px solid rgba(0,168,89,0.20)' : '1px solid rgba(124,58,237,0.18)',
    overflow: 'hidden',
  }

  return (
    <div style={wrapStyle}>
      {!mine && <div style={avatarStyle} />}
      <div style={bubbleStyle}>
        {message.type === 'image' ? (
          <div>
            <Image
              src={message.url}
              alt={message.caption || ''}
              width={260}
              height={180}
              style={{ objectFit: 'cover', borderRadius: 10 }}
              preview
            />
            {message.caption ? (
              <div style={{ marginTop: 8, opacity: 0.85 }}>{message.caption}</div>
            ) : null}
          </div>
        ) : message.type === 'audio' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Button size="small">▶</Button>
            <div style={{ opacity: 0.8 }}>{message.audioDuration || '0:09'}</div>
          </div>
        ) : (
          <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
        )}

        <div
          style={{ marginTop: 6, fontSize: 12, opacity: 0.55, textAlign: mine ? 'right' : 'left' }}
        >
          {message.at}
        </div>
      </div>
      {mine && <div style={avatarStyle} />}
    </div>
  )
}
