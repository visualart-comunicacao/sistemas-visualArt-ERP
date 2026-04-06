import { useEffect, useMemo, useRef, useState } from 'react'
import { FloatButton, Form, Input, message, Modal, Space, Tag, Typography } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ChatShell from '../components/ChatShell'
import { PRESENCE_OPTIONS } from '../mock/data'
import { useAuth } from '@/store/auth/AuthContext'

import {
  listTickets,
  listTicketMessages,
  sendTicketMessage,
  assignTicket,
  closeTicket,
  openInboxStream,
  getApiErrorMessage,
  listInboxAgents,
} from '@/api/visualChat.api'

const { Text } = Typography

function pickTicketsItems(res) {
  const items =
    res?.items ??
    res?.data?.items ??
    (Array.isArray(res?.data) ? res.data : null) ??
    (Array.isArray(res) ? res : null) ??
    []
  return Array.isArray(items) ? items : []
}

function pickMessagesItems(res) {
  const items =
    res?.items ??
    (Array.isArray(res?.data) ? res.data : null) ??
    res?.data?.items ??
    (Array.isArray(res) ? res : null) ??
    []
  return Array.isArray(items) ? items : []
}

function getThreadQueue(ticket, currentUserId) {
  if (!ticket?.assignedToId) return 'Espera'
  if (ticket.assignedToId === currentUserId) return 'Meus'
  return 'Todos'
}

function formatTime(dateLike) {
  if (!dateLike) return ''
  return new Date(dateLike).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function VisualChatPage() {
  const { user } = useAuth()

  const [queue, setQueue] = useState('Meus')

  const [agents, setAgents] = useState([])
  const [loadingAgents, setLoadingAgents] = useState(false)

  const [threads, setThreads] = useState([])
  const [messagesByThread, setMessagesByThread] = useState({})
  const [activeThreadId, setActiveThreadId] = useState(null)

  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const contactsRef = useRef(new Map())
  const sseRef = useRef(null)

  const [newOpen, setNewOpen] = useState(false)
  const [newForm] = Form.useForm()

  const [historyOpen, setHistoryOpen] = useState(false)

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId) || null,
    [threads, activeThreadId],
  )

  const activeContact = useMemo(() => {
    if (!activeThread) return null
    return contactsRef.current.get(activeThread.contactId) || null
  }, [activeThread])

  const activeMessages = useMemo(() => {
    if (!activeThreadId) return []
    return messagesByThread[activeThreadId] || []
  }, [messagesByThread, activeThreadId])

  function normalizeTicketToThread(t) {
    if (t?.contact?.id) {
      contactsRef.current.set(t.contact.id, {
        id: t.contact.id,
        name: t.contact.name || null,
        phone: t.contact.phoneE164 || null,
        waId: t.contact.waId || null,
      })
    }

    const last = t?.messages?.[0] || null

    return {
      id: t.id,
      contactId: t.contactId,
      assignedToId: t.assignedToId || null,
      toWaId: t.contact?.waId || null,

      title: t.contact?.name || t.contact?.waId || 'Sem nome',
      lastMessage: last?.text || '',
      updatedAt: formatTime(t.lastMessageAt),
      unread: t.unreadCount || 0,

      queue: getThreadQueue(t, user?.id),
      assignedTo: t.assignedTo?.name || null,

      status: t.status || 'OPEN',
      waWindowUntil: t.waWindowUntil || null,
    }
  }

  function normalizeMessage(m) {
    return {
      id: m.id,
      threadId: m.ticketId,
      author: m.direction === 'OUT' ? 'me' : 'them',
      type:
        m.type === 'IMAGE'
          ? 'image'
          : m.type === 'AUDIO'
            ? 'audio'
            : m.type === 'DOCUMENT'
              ? 'document'
              : 'text',
      text: m.text || undefined,
      url: m.mediaUrl || undefined,
      caption: null,
      audioDuration: undefined,
      at: new Date(m.createdAt).toLocaleString('pt-BR'),
      status: m.status,
      createdAt: m.createdAt,
      senderName: m.senderName || null,
      senderUserId: m.senderUserId || null,
      senderType: m.senderType || null,
    }
  }

  async function handleAssumeThread() {
    if (!activeThreadId) return

    try {
      const resp = await assignTicket(activeThreadId, {})
      const updatedTicket = resp?.ticket || resp?.data || resp || null

      if (updatedTicket?.id) {
        const normalized = normalizeTicketToThread(updatedTicket)

        setThreads((prev) => {
          const next = prev.map((t) => (t.id === activeThreadId ? { ...t, ...normalized } : t))
          return next
        })

        if (queue === 'Espera') {
          setThreads((prev) => prev.filter((t) => t.id !== activeThreadId))
          setActiveThreadId(null)
        }
      } else {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === activeThreadId
              ? {
                  ...t,
                  assignedTo: user?.name || 'Eu',
                  assignedToId: user?.id || null,
                  queue: 'Meus',
                }
              : t,
          ),
        )
      }

      message.success('Conversa assumida com sucesso')
    } catch (err) {
      console.error('[VisualChat] handleAssumeThread error:', err)
      message.error(getApiErrorMessage(err))
    }
  }

  async function handleCloseThread() {
    if (!activeThreadId) return

    try {
      await closeTicket(activeThreadId)

      setThreads((prev) => prev.filter((t) => t.id !== activeThreadId))
      setMessagesByThread((prev) => {
        const copy = { ...prev }
        delete copy[activeThreadId]
        return copy
      })

      setActiveThreadId((prev) => {
        const remaining = threads.filter((t) => t.id !== prev)
        return remaining[0]?.id || null
      })

      message.success('Ticket encerrado com sucesso')
    } catch (err) {
      console.error('[VisualChat] handleCloseThread error:', err)
      message.error(getApiErrorMessage(err))
    }
  }

  function handleOpenHistory() {
    setHistoryOpen(true)
  }

  useEffect(() => {
    let aborted = false

    async function loadThreads() {
      try {
        setLoadingThreads(true)

        const res = await listTickets({
          queue: String(queue || 'Meus').toLowerCase(),
          take: 100,
          skip: 0,
        })

        const items = pickTicketsItems(res)
        const normalized = items.map(normalizeTicketToThread)

        if (aborted) return

        setThreads(normalized)

        setActiveThreadId((prev) => {
          if (prev && normalized.some((t) => t.id === prev)) return prev
          return normalized[0]?.id || null
        })
      } catch (err) {
        console.error('[VisualChat] loadThreads error:', err)
        message.error(getApiErrorMessage(err))
      } finally {
        if (!aborted) setLoadingThreads(false)
      }
    }

    if (user?.id) loadThreads()

    return () => {
      aborted = true
    }
  }, [queue, user?.id])

  useEffect(() => {
    if (!activeThreadId) return

    let aborted = false

    async function loadMessages() {
      try {
        setLoadingMessages(true)

        const res = await listTicketMessages(activeThreadId)
        const items = pickMessagesItems(res)
        const normalized = items.map(normalizeMessage)

        if (aborted) return
        setMessagesByThread((prev) => ({ ...prev, [activeThreadId]: normalized }))
      } catch (err) {
        console.error('[VisualChat] loadMessages error:', err)
        message.error(getApiErrorMessage(err))
      } finally {
        if (!aborted) setLoadingMessages(false)
      }
    }

    loadMessages()

    return () => {
      aborted = true
    }
  }, [activeThreadId])

  useEffect(() => {
    try {
      const es = openInboxStream()
      sseRef.current = es

      es.addEventListener('message.created', (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          const ticket = payload.ticket
          const msg = payload.message

          if (!ticket?.id || !msg?.id) return

          const threadId = ticket.id
          const normalizedMsg = normalizeMessage(msg)

          const normalizedThread = normalizeTicketToThread({
            ...ticket,
            messages: [{ text: msg.text || '' }],
            lastMessageAt: ticket.lastMessageAt || msg.createdAt,
          })

          const threadBelongsToCurrentQueue =
            queue === 'Meus'
              ? normalizedThread.assignedToId === user?.id
              : queue === 'Espera'
                ? !normalizedThread.assignedToId
                : true

          setThreads((prev) => {
            const exists = prev.some((t) => t.id === threadId)

            if (!threadBelongsToCurrentQueue) {
              return prev.filter((t) => t.id !== threadId)
            }

            if (!exists) return [normalizedThread, ...prev]

            const updated = prev.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    ...normalizedThread,
                    lastMessage: msg.text || t.lastMessage,
                    updatedAt: formatTime(msg.createdAt),
                  }
                : t,
            )

            const idx = updated.findIndex((t) => t.id === threadId)
            if (idx <= 0) return updated

            const [item] = updated.splice(idx, 1)
            return [item, ...updated]
          })

          setMessagesByThread((prev) => {
            const arr = prev[threadId] || []

            if (arr.some((m) => m.id === normalizedMsg.id)) return prev

            const withoutOptimisticDuplicate = arr.filter(
              (m) =>
                !(
                  m.optimistic &&
                  m.author === normalizedMsg.author &&
                  (m.text || '') === (normalizedMsg.text || '')
                ),
            )

            return {
              ...prev,
              [threadId]: [...withoutOptimisticDuplicate, normalizedMsg],
            }
          })
        } catch (e) {
          console.error('[VisualChat] SSE parse error:', e)
        }
      })

      es.onerror = (e) => {
        console.error('[VisualChat] SSE error:', e)
      }

      return () => es.close()
    } catch (err) {
      console.error('[VisualChat] SSE init failed:', err)
    }
  }, [queue, user?.id])

  function onChangePresence(nextPresence) {
    console.log('presence changed:', nextPresence)
  }

  async function sendMessageReal(text) {
    if (!activeThreadId || !activeThread) return

    const shouldAutoAssign = activeThread.queue === 'Espera' || !activeThread.assignedTo

    if (shouldAutoAssign) {
      try {
        const assignResp = await assignTicket(activeThreadId)
        const assignedTicket = assignResp?.ticket || assignResp?.data || assignResp || null

        if (assignedTicket?.id) {
          const normalizedAssigned = normalizeTicketToThread(assignedTicket)

          setThreads((prev) =>
            prev.map((t) => (t.id === activeThreadId ? { ...t, ...normalizedAssigned } : t)),
          )

          if (assignedTicket.assignedToId) {
            setQueue('Meus')
          }
        } else {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === activeThreadId
                ? {
                    ...t,
                    assignedTo: user?.name || 'Eu',
                    assignedToId: user?.id || null,
                    queue: 'Meus',
                  }
                : t,
            ),
          )
          setQueue('Meus')
        }
      } catch (err) {
        console.error('[VisualChat] auto-assign failed:', err)
        message.error(getApiErrorMessage(err))
        return
      }
    }

    const trimmed = String(text || '').trim()
    if (!trimmed) return

    const now = new Date()
    const optimisticId = `m_${Date.now()}`

    const optimistic = {
      id: optimisticId,
      threadId: activeThreadId,
      author: 'me',
      type: 'text',
      text: trimmed,
      at: now.toLocaleString('pt-BR'),
      createdAt: now.toISOString(),
      status: 'SENT',
      optimistic: true,
      senderName: user?.name || 'Eu',
      senderUserId: user?.id || null,
      senderType: 'AGENT',
    }

    setMessagesByThread((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), optimistic],
    }))

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: trimmed,
              updatedAt: formatTime(now),
              assignedTo: t.assignedTo || user?.name || null,
              assignedToId: t.assignedToId || user?.id || null,
              queue: getThreadQueue({ assignedToId: t.assignedToId || user?.id || null }, user?.id),
            }
          : t,
      ),
    )

    try {
      const resp = await sendTicketMessage(activeThreadId, trimmed)
      const saved = resp?.message || resp?.data || null

      if (saved?.id) {
        setMessagesByThread((prev) => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).map((m) =>
            m.id === optimisticId
              ? {
                  ...m,
                  id: saved.id,
                  status: saved.status || m.status,
                  optimistic: false,
                  senderName: saved.senderName || m.senderName,
                  senderUserId: saved.senderUserId || m.senderUserId,
                  senderType: saved.senderType || m.senderType,
                  createdAt: saved.createdAt || m.createdAt,
                  at: saved.createdAt ? new Date(saved.createdAt).toLocaleString('pt-BR') : m.at,
                }
              : m,
          ),
        }))
      } else {
        setMessagesByThread((prev) => ({
          ...prev,
          [activeThreadId]: (prev[activeThreadId] || []).map((m) =>
            m.id === optimisticId ? { ...m, optimistic: false } : m,
          ),
        }))
      }
    } catch (err) {
      console.error('[VisualChat] sendMessageReal error:', err)
      message.error(getApiErrorMessage(err))
      setMessagesByThread((prev) => ({
        ...prev,
        [activeThreadId]: (prev[activeThreadId] || []).map((m) =>
          m.id === optimisticId ? { ...m, status: 'FAILED', optimistic: false } : m,
        ),
      }))
    }
  }

  function sendMockImage() {
    message.info('Anexo mock ainda (sem backend).')
  }

  function changeTicket(nextTicket) {
    message.success(`Ticket alterado para ${nextTicket} (mock)`)
  }

  function transferThread(agentName) {
    message.success(`Conversa transferida para ${agentName} (mock)`)
  }

  function shareThread(action) {
    if (!activeThreadId) return

    if (action === 'copy') {
      navigator.clipboard
        .writeText(`visualchat://thread/${activeThreadId}`)
        .then(() => message.success('Copiado!'))
        .catch(() => message.error('Não foi possível copiar.'))
      return
    }

    if (action === 'export') {
      message.info('Export mock (sem backend)')
    }
  }

  async function onCreateConversation() {
    const v = await newForm.validateFields()
    message.info(`Nova conversa ainda mock. Nome: ${v.name} / Telefone: ${v.phone}`)
    setNewOpen(false)
    newForm.resetFields()
  }

  useEffect(() => {
    let aborted = false

    async function loadAgents() {
      try {
        setLoadingAgents(true)
        const res = await listInboxAgents()
        const items =
          res?.items ??
          res?.data?.items ??
          (Array.isArray(res?.data) ? res.data : null) ??
          (Array.isArray(res) ? res : null) ??
          []

        if (aborted) return

        setAgents(
          (Array.isArray(items) ? items : []).map((a) => ({
            id: a.id,
            name: a.name,
            email: a.email || null,
          })),
        )
      } catch (err) {
        console.error('[VisualChat] loadAgents error:', err)
        message.error(getApiErrorMessage(err))
      } finally {
        if (!aborted) setLoadingAgents(false)
      }
    }

    loadAgents()

    return () => {
      aborted = true
    }
  }, [])

  return (
    <>
      <ChatShell
        user={user}
        presenceOptions={PRESENCE_OPTIONS}
        onChangePresence={onChangePresence}
        agents={agents}
        threads={threads}
        queue={queue}
        onChangeQueue={setQueue}
        loadingAgents={loadingAgents}
        activeThreadId={activeThreadId}
        onSelectThread={setActiveThreadId}
        contact={activeContact}
        thread={activeThread}
        messages={activeMessages}
        onSendMessage={sendMessageReal}
        onSendMockImage={sendMockImage}
        onChangeTicket={changeTicket}
        onTransfer={transferThread}
        onShare={shareThread}
        onAssumeThread={handleAssumeThread}
        onCloseThread={handleCloseThread}
        onOpenHistory={handleOpenHistory}
        loadingThreads={loadingThreads}
        loadingMessages={loadingMessages}
        onNewConversation={() => setNewOpen(true)}
        onContactUpdated={(updated) => {
          if (!updated?.id) return

          contactsRef.current.set(updated.id, {
            id: updated.id,
            name: updated.name || null,
            phone: updated.phoneE164 || updated.phone || null,
            waId: updated.waId || null,
          })

          setThreads((prev) =>
            prev.map((t) =>
              t.contactId === updated.id ? { ...t, title: updated.name || t.title } : t,
            ),
          )
        }}
      />

      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        tooltip="Nova conversa"
        onClick={() => setNewOpen(true)}
      />

      <Modal
        open={newOpen}
        onCancel={() => setNewOpen(false)}
        onOk={onCreateConversation}
        okText="Criar"
        title="Nova conversa"
      >
        <Form form={newForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nome"
            rules={[{ required: true, message: 'Informe o nome' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Telefone"
            rules={[{ required: true, message: 'Informe o telefone' }]}
          >
            <Input placeholder="+55 (16) 9...." />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
        title="Histórico da conversa"
        width={720}
      >
        <div style={{ marginBottom: 12 }}>
          <Space wrap>
            <Tag color="blue">
              Contato: {activeContact?.name || activeContact?.waId || 'Sem nome'}
            </Tag>
            <Tag color="purple">Responsável: {activeThread?.assignedTo || 'Sem responsável'}</Tag>
            <Tag>{activeThread?.status || 'OPEN'}</Tag>
            <Tag color={activeThread?.queue === 'Meus' ? 'green' : 'red'}>
              {activeThread?.queue || 'Espera'}
            </Tag>
          </Space>
        </div>

        <div
          style={{
            maxHeight: 420,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            paddingRight: 6,
          }}
        >
          {activeMessages.length === 0 ? (
            <Text type="secondary">Nenhuma mensagem.</Text>
          ) : (
            activeMessages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.author === 'me' ? 'flex-end' : 'flex-start',
                  background: m.author === 'me' ? '#f1e6ff' : '#f5f5f5',
                  padding: '10px 12px',
                  borderRadius: 12,
                  maxWidth: '80%',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 500 }}>{m.text || '[mídia]'}</div>

                {m.author === 'me' && m.senderName ? (
                  <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{m.senderName}</div>
                ) : null}

                <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>{m.at}</div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
