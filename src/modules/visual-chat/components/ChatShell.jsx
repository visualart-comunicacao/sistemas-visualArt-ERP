import React, { useEffect, useMemo, useState } from 'react'
import { Button, Drawer } from 'antd'
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons'
import '../visualChat.css'
import LeftSidebar from './LeftSidebar'
import ChatHeader from './ChatHeader'
import MessagesList from './MessagesList'
import Composer from './Composer'
import ContactInfoPanel from './ContactInfoPanel'

export default function ChatShell({
  user,
  presenceOptions,
  onChangePresence,

  agents,

  threads,
  activeThreadId,
  onSelectThread,

  contact,
  thread,

  messages,

  onSendMessage,
  onSendMockImage,

  onChangeTicket,
  onTransfer,
  onShare,

  onAssumeThread,
  onCloseThread,
  onOpenHistory,

  loadingThreads,
  loadingMessages,

  queue,
  onChangeQueue,
}) {
  const [viewport, setViewport] = useState(() => {
    const w = window.innerWidth
    if (w <= 768) return 'mobile'
    if (w <= 1200) return 'medium'
    return 'desktop'
  })

  const [showRightDesktop, setShowRightDesktop] = useState(true)
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false)

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth
      if (w <= 768) setViewport('mobile')
      else if (w <= 1200) setViewport('medium')
      else setViewport('desktop')
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = viewport === 'mobile'
  const isMedium = viewport === 'medium'
  const isDesktop = viewport === 'desktop'

  const showRightColumn = useMemo(() => {
    return isDesktop && showRightDesktop
  }, [isDesktop, showRightDesktop])

  function handleToggleRight() {
    if (isDesktop) {
      setShowRightDesktop((v) => !v)
      return
    }

    setRightDrawerOpen(true)
  }

  const showMobileList = isMobile && !activeThreadId
  const showMobileChat = !isMobile || !!activeThreadId

  return (
    <div
      className={['vc-shell', `vc-shell--${viewport}`, showRightColumn ? '' : 'vc-shell--no-right']
        .filter(Boolean)
        .join(' ')}
    >
      {(!isMobile || showMobileList) && (
        <div className="vc-panel vc-left">
          <LeftSidebar
            user={user}
            presenceOptions={presenceOptions}
            onChangePresence={onChangePresence}
            agents={agents}
            threads={threads}
            activeThreadId={activeThreadId}
            onSelectThread={onSelectThread}
            loading={loadingThreads}
            queue={queue}
            onChangeQueue={onChangeQueue}
          />
        </div>
      )}

      {showMobileChat && (
        <div className="vc-panel vc-center">
          {isMobile && activeThreadId && (
            <div className="vc-mobile-topbar">
              <Button icon={<ArrowLeftOutlined />} onClick={() => onSelectThread(null)}>
                Conversas
              </Button>

              <Button icon={<UserOutlined />} onClick={() => setRightDrawerOpen(true)}>
                Detalhes
              </Button>
            </div>
          )}

          <div className="vc-chat-header">
            <ChatHeader
              user={user}
              contact={contact}
              thread={thread}
              agents={agents}
              onChangeTicket={onChangeTicket}
              onTransfer={onTransfer}
              onShare={onShare}
              showRight={showRightColumn || rightDrawerOpen}
              onToggleRight={handleToggleRight}
              onAssumeThread={onAssumeThread}
              onCloseThread={onCloseThread}
              onOpenHistory={onOpenHistory}
            />
          </div>

          <div className="vc-messages">
            <MessagesList messages={messages} loading={loadingMessages} />
          </div>

          <div className="vc-composer">
            <Composer
              onSend={onSendMessage}
              onSendImageMock={onSendMockImage}
              disabled={!activeThreadId}
            />
          </div>
        </div>
      )}

      {showRightColumn && (
        <div className="vc-panel vc-right">
          <ContactInfoPanel contact={contact} />
        </div>
      )}

      {!isDesktop && (
        <Drawer
          title="Informações do contato"
          placement="right"
          width={isMobile ? '100%' : 360}
          open={rightDrawerOpen}
          onClose={() => setRightDrawerOpen(false)}
        >
          <ContactInfoPanel contact={contact} />
        </Drawer>
      )}
    </div>
  )
}
