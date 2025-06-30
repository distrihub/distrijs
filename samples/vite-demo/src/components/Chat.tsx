import React, { useState, useRef, useEffect } from 'react'
import { useMessages, Message } from '@distri/react'
import './Chat.css'

interface ChatProps {
  threadId: string
}

function Chat({ threadId }: ChatProps) {
  const { messages, loading, error, sendMessage, addReaction, removeReaction } = useMessages({ 
    threadId,
    autoSubscribe: true 
  })
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    try {
      setSending(true)
      await sendMessage({ content })
      setNewMessage('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (err) {
      console.error('Failed to send message:', err)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage(e)
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      // For demo purposes, we'll just add reactions
      // In a real app, you'd check if the user already reacted
      await addReaction(messageId, emoji)
    } catch (err) {
      console.error('Failed to add reaction:', err)
    }
  }

  if (loading && messages.length === 0) {
    return (
      <div className="chat">
        <div className="chat-loading">Loading messages...</div>
      </div>
    )
  }

  if (error && messages.length === 0) {
    return (
      <div className="chat">
        <div className="chat-error">
          Failed to load messages: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="chat">
      <div className="chat-messages">
        {messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onReaction={(emoji) => handleReaction(message.id, emoji)}
          />
        ))}
        
        {messages.length === 0 && !loading && (
          <div className="chat-empty">
            No messages yet. Start the conversation!
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSendMessage}>
        <div className="chat-input-container">
          <textarea
            ref={textareaRef}
            className="chat-input"
            placeholder="Type your message..."
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            disabled={sending}
            rows={1}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending}
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  )
}

interface MessageItemProps {
  message: Message
  onReaction: (emoji: string) => void
}

function MessageItem({ message, onReaction }: MessageItemProps) {
  const [showReactions, setShowReactions] = useState(false)

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatContent = (content: string, contentType: string) => {
    if (contentType === 'markdown') {
      // Simple markdown rendering (in a real app, use a proper markdown library)
      return content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
    }
    return content
  }

  const commonReactions = ['👍', '❤️', '😄', '😮', '😢', '😡']

  return (
    <div className="message-item">
      <div className="message-header">
        <span className="message-author">User {message.authorId.slice(-4)}</span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      
      <div 
        className="message-content"
        dangerouslySetInnerHTML={{ 
          __html: formatContent(message.content, message.contentType) 
        }}
      />
      
      {message.editedAt && (
        <span className="message-edited">(edited)</span>
      )}

      <div className="message-actions">
        <button
          className="reaction-btn"
          onClick={() => setShowReactions(!showReactions)}
        >
          😊
        </button>
        
        {showReactions && (
          <div className="reaction-picker">
            {commonReactions.map((emoji) => (
              <button
                key={emoji}
                className="reaction-option"
                onClick={() => {
                  onReaction(emoji)
                  setShowReactions(false)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      {message.reactions && message.reactions.length > 0 && (
        <div className="message-reactions">
          {message.reactions.map((reaction, index) => (
            <span key={index} className="reaction">
              {reaction.emoji}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

export default Chat