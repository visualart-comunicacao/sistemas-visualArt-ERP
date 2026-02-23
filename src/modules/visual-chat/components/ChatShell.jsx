import React, { useState } from 'react'
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
}) {
  const [showRight, setShowRight] = useState(true)

  return (
    <div className={`vc-shell ${showRight ? '' : 'no-right'}`}>
      <div className="vc-panel vc-left">
        <LeftSidebar
          user={user}
          presenceOptions={presenceOptions}
          onChangePresence={onChangePresence}
          threads={threads}
          activeThreadId={activeThreadId}
          onSelectThread={onSelectThread}
        />
      </div>

      <div className="vc-panel vc-center">
        <div className="vc-chat-header">
          <ChatHeader
            contact={contact}
            thread={thread}
            agents={agents}
            onChangeTicket={onChangeTicket}
            onTransfer={onTransfer}
            onShare={onShare}
            onToggleRight={() => setShowRight((v) => !v)}
          />
        </div>

        <div className="vc-messages">
          <MessagesList messages={messages} />
        </div>

        <div className="vc-composer">
          <Composer
            onSend={onSendMessage}
            onSendImageMock={onSendMockImage}
            disabled={!activeThreadId}
          />
        </div>
      </div>

      <div className="vc-panel vc-right">
        <ContactInfoPanel contact={contact} />
      </div>
    </div>
  )
}
