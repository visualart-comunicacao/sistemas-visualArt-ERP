import React, { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble'

export default function MessagesList({ messages }) {
  const ref = useRef(null)

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: 'smooth' })
  }, [messages?.length])

  return (
    <div ref={ref} style={{ height: '100%', overflow: 'auto', paddingRight: 6 }}>
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  )
}
