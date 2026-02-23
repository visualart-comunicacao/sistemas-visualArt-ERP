import React, { useMemo } from 'react'
import { Avatar, Tooltip } from 'antd'
import dayjs from 'dayjs'
import './MessageBubble.css'

// =========================
// Helpers
// =========================
function isEmojiOnly(text = '') {
  const t = String(text).trim()
  if (!t) return false
  const noSpaces = t.replace(/\s+/g, '')
  const emojiRegex = /\p{Extended_Pictographic}/gu
  const matches = noSpaces.match(emojiRegex)
  const leftover = noSpaces.replace(emojiRegex, '')
  const count = matches?.length ?? 0
  return leftover === '' && count >= 1 && count <= 3
}

function getInitials(name) {
  const n = String(name || '').trim()
  if (!n) return '?'
  const parts = n.split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] || ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : ''
  const two = (first + last).toUpperCase()
  return two || first.toUpperCase() || '?'
}

function safeTime(dt) {
  const d = dt ? dayjs(dt) : null
  return d && d.isValid() ? d.format('HH:mm') : ''
}

function isHttpUrl(s) {
  return /^https?:\/\/\S+$/i.test(s)
}

function renderRichText(text = '') {
  // quebra por URLs e mantém texto normal com \n
  const parts = String(text).split(/(https?:\/\/\S+)/g)
  return parts.map((p, idx) => {
    if (isHttpUrl(p)) {
      return (
        <a key={idx} className="va-msg-link" href={p} target="_blank" rel="noreferrer">
          {p}
        </a>
      )
    }

    // preserva quebras de linha
    const lines = p.split('\n')
    return (
      <React.Fragment key={idx}>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 ? <br /> : null}
          </React.Fragment>
        ))}
      </React.Fragment>
    )
  })
}

function StatusMark({ status, errorText }) {
  if (!status) return null

  if (status === 'FAILED') {
    return (
      <Tooltip title={errorText || 'Falha ao enviar'}>
        <span className="va-status-failed">!</span>
      </Tooltip>
    )
  }

  if (status === 'SENT') return <span className="va-status-sent">✓</span>
  if (status === 'DELIVERED') return <span className="va-status-delivered">✓✓</span>
  if (status === 'READ') return <span className="va-status-read">✓✓</span>

  return null
}

function Attachment({ message }) {
  const type = String(message?.type || '').toLowerCase()
  const url = message?.url || message?.mediaUrl || message?.attachmentUrl || null
  const caption = message?.caption || null

  if (!url) return null

  if (type === 'image') {
    return (
      <div className="va-attach va-attach-image">
        <a href={url} target="_blank" rel="noreferrer">
          {/* img simples; se quiser, depois a gente põe lightbox */}
          <img className="va-attach-img" src={url} alt={caption || 'imagem'} />
        </a>
        {caption ? <div className="va-attach-caption">{renderRichText(caption)}</div> : null}
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div className="va-attach va-attach-audio">
        <audio controls src={url} style={{ width: '100%' }} />
      </div>
    )
  }

  if (type === 'document') {
    const filename =
      message?.filename || (typeof url === 'string' ? url.split('/').pop() : 'documento')

    return (
      <div className="va-attach va-attach-doc">
        <a href={url} target="_blank" rel="noreferrer" className="va-attach-doclink">
          📎 {filename}
        </a>
        {caption ? <div className="va-attach-caption">{renderRichText(caption)}</div> : null}
      </div>
    )
  }

  return (
    <div className="va-attach">
      <a href={url} target="_blank" rel="noreferrer">
        Abrir anexo
      </a>
    </div>
  )
}

// =========================
// Component
// =========================
export default function MessageBubble({ message, isMe, contact, user }) {
  const text = message?.text ?? message?.body ?? message?.content ?? ''
  const emojiOnly = isEmojiOnly(text)

  const avatarUrl = isMe ? user?.avatarUrl : contact?.avatarUrl
  const displayName = isMe ? user?.name : contact?.name
  const initials = useMemo(() => getInitials(displayName), [displayName])

  // createdAt pode vir como createdAt ou at (você usa at na normalização)
  const time = safeTime(message?.createdAt) || safeTime(message?.at)

  // fallback: se tiver anexo e sem texto, não renderiza texto vazio
  const hasText = String(text || '').trim().length > 0

  // opcional: erro para tooltip em FAILED (se você guardar)
  const errorText = message?.error || message?.errorMessage || message?.details?.message

  return (
    <div className={`va-msg-row ${isMe ? 'va-me' : 'va-them'}`}>
      {!isMe && (
        <Avatar size={28} src={avatarUrl}>
          {initials}
        </Avatar>
      )}

      <div
        className={[
          'va-msg-bubble',
          emojiOnly ? 'va-emoji-only' : '',
          isMe ? 'va-tail-right' : 'va-tail-left',
          message?.optimistic ? 'va-optimistic' : '',
        ].join(' ')}
      >
        <Attachment message={message} />

        {hasText ? (
          <div className="va-msg-text">{emojiOnly ? text : renderRichText(text)}</div>
        ) : null}

        <div className="va-msg-meta">
          <span className="va-msg-time">{time}</span>
          {isMe ? <StatusMark status={message?.status} errorText={errorText} /> : null}
        </div>
      </div>

      {isMe && (
        <Avatar size={28} src={avatarUrl}>
          {initials}
        </Avatar>
      )}
    </div>
  )
}
