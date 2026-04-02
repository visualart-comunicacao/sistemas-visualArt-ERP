import { Input } from 'antd'
import { useMemo, useState } from 'react'
import { CHAT_EMOJIS } from '../constants/emojis'

export default function EmojiPicker({ onPick }) {
  const [search, setSearch] = useState('')

  const filteredEmojis = useMemo(() => {
    const q = String(search || '').trim()
    if (!q) return CHAT_EMOJIS
    return CHAT_EMOJIS.filter((emoji) => emoji.includes(q))
  }, [search])

  return (
    <div style={{ width: 320 }}>
      <Input
        size="small"
        placeholder="Buscar emoji..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: 6,
          maxHeight: 240,
          overflowY: 'auto',
          paddingRight: 4,
        }}
      >
        {filteredEmojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick?.(emoji)}
            style={{
              border: '1px solid #f0f0f0',
              background: '#fff',
              borderRadius: 10,
              fontSize: 20,
              cursor: 'pointer',
              height: 36,
              lineHeight: 1,
            }}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
