import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FloatButton, Form, Input, message, Modal } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import ChatShell from '../components/ChatShell'
import { mockUser, PRESENCE_OPTIONS, mockAgents } from '../mock/data'

import {
  listTickets,
  listTicketMessages,
  sendTicketMessage,
  openInboxStream,
  getApiErrorMessage,
  assignTicket,
} from '@/api/visualChat.api'

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

export default function VisualChatPage() {
  const [user, setUser] = useState(mockUser)

  // ✅ filtro da sidebar controlado aqui (OPÇÃO 1)
  const [queue, setQueue] = useState('Meus')

  const [threads, setThreads] = useState([])
  const [messagesByThread, setMessagesByThread] = useState({})
  const [activeThreadId, setActiveThreadId] = useState(null)

  const [loadingThreads, setLoadingThreads] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const contactsRef = useRef(new Map())
  const sseRef = useRef(null)

  const [newOpen, setNewOpen] = useState(false)
  const [newForm] = Form.useForm()

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
      toWaId: t.contact?.waId || null,

      title: t.contact?.name || t.contact?.waId || 'Sem nome',
      lastMessage: last?.text || '',
      updatedAt: t.lastMessageAt
        ? new Date(t.lastMessageAt).toLocaleTimeString('pt-BR').slice(0, 5)
        : '',
      unread: t.unreadCount || 0,

      queue: t.assignedToId ? 'Meus' : 'Espera',
      assignedTo: t.assignedTo?.name || null,
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
      createdAt: m.createdAt, // ✅ ajuda o bubble a formatar hora
    }
  }

  // =========================
  // 1) Carregar tickets
  // =========================
  useEffect(() => {
    let aborted = false

    async function loadThreads() {
      try {
        setLoadingThreads(true)

        const res = await listTickets({ queue: 'espera', take: 50, skip: 0 })
        const items = pickTicketsItems(res)
        const normalized = items.map(normalizeTicketToThread)

        if (aborted) return

        setThreads(normalized)

        setActiveThreadId((prev) => {
          const next =
            prev && normalized.some((t) => t.id === prev) ? prev : normalized[0]?.id || null
          return next
        })
      } catch (err) {
        console.error('[VisualChat] loadThreads error:', err)
        message.error(getApiErrorMessage(err))
      } finally {
        setLoadingThreads(false)
      }
    }

    loadThreads()
    return () => {
      aborted = true
    }
  }, [])

  // =========================
  // 2) Carregar mensagens do ticket ativo
  // =========================
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
        setLoadingMessages(false)
      }
    }

    loadMessages()
    return () => {
      aborted = true
    }
  }, [activeThreadId])

  // =========================
  // 3) SSE - tempo real
  // =========================
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

          setThreads((prev) => {
            const exists = prev.some((t) => t.id === threadId)

            const normalizedThread = normalizeTicketToThread({
              ...ticket,
              messages: [{ text: msg.text || '' }],
              lastMessageAt: ticket.lastMessageAt || msg.createdAt,
            })

            if (!exists) return [normalizedThread, ...prev]

            const updated = prev.map((t) =>
              t.id === threadId
                ? {
                    ...t,
                    lastMessage: msg.text || t.lastMessage,
                    updatedAt: new Date(msg.createdAt).toLocaleTimeString('pt-BR').slice(0, 5),
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
            return { ...prev, [threadId]: [...arr, normalizedMsg] }
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
  }, [])

  // =========================
  // Presença (mock)
  // =========================
  function onChangePresence(nextPresence) {
    setUser((prev) => ({ ...prev, presence: nextPresence }))
  }

  // =========================
  // Enviar mensagem (optimistic)
  // =========================
  async function sendMessageReal(text) {
    if (!activeThreadId || !activeThread) return

    // ✅ AUTO-ASSIGN ao responder se estiver em "Espera"
    const shouldAutoAssign = activeThread.queue === 'Espera' || !activeThread.assignedTo

    if (shouldAutoAssign) {
      try {
        const assignResp = await assignTicket(activeThreadId)
        setQueue('Meus')
        const assignedTicket = assignResp?.ticket || null

        if (assignedTicket) {
          const normalizedAssigned = normalizeTicketToThread(assignedTicket)

          setThreads((prev) =>
            prev.map((t) => (t.id === activeThreadId ? { ...t, ...normalizedAssigned } : t)),
          )

          // ✅ agora sim, só muda se veio atribuído
          if (assignedTicket.assignedToId) setQueue('Meus')
        }
      } catch (err) {
        console.error('[VisualChat] auto-assign failed:', err)
        message.error(getApiErrorMessage(err))
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
    }

    setMessagesByThread((prev) => ({
      ...prev,
      [activeThreadId]: [...(prev[activeThreadId] || []), optimistic],
    }))

    setThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, lastMessage: trimmed, updatedAt: now.toLocaleTimeString('pt-BR').slice(0, 5) }
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
              ? { ...m, id: saved.id, status: saved.status || m.status, optimistic: false }
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
    if (action === 'export') message.info('Export mock (sem backend)')
  }

  async function onCreateConversation() {
    const v = await newForm.validateFields()
    message.info(`Nova conversa ainda mock. Nome: ${v.name} / Telefone: ${v.phone}`)
    setNewOpen(false)
    newForm.resetFields()
  }

  return (
    <>
      <ChatShell
        user={user}
        presenceOptions={PRESENCE_OPTIONS}
        onChangePresence={onChangePresence}
        agents={mockAgents}
        threads={threads}
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
        loadingThreads={loadingThreads}
        loadingMessages={loadingMessages}
        onNewConversation={() => setNewOpen(true)}
        queue={queue}
        onChangeQueue={setQueue}
        onContactUpdated={(updated) => {
          if (!updated?.id) return
          contactsRef.current.set(updated.id, {
            id: updated.id,
            name: updated.name || null,
            phone: updated.phoneE164 || updated.phone || null,
            waId: updated.waId || null,
          })

          // atualiza título do ticket atual (e de todos que sejam desse contato)
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
    </>
  )
}
