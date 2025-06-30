import React, { useState, useRef, useEffect } from 'react'
import { useTask, Task, A2AMessage } from '@distri/react'
import './Chat.css'

interface ChatProps {
  agentId: string
}

function Chat({ agentId }: ChatProps) {
  const { 
    task, 
    loading, 
    error, 
    streamingText, 
    isStreaming, 
    sendMessage, 
    clearTask 
  } = useTask({ agentId, autoSubscribe: true })
  
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [task, streamingText])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending) return

    try {
      setSending(true)
      await sendMessage(content)
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

  const handleClearTask = () => {
    clearTask()
    setNewMessage('')
  }

  if (loading && !task) {
    return (
      <div className="chat">
        <div className="chat-loading">Initializing chat...</div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="chat">
        <div className="chat-error">
          Failed to initialize chat: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="chat">
      <div className="chat-header">
        <h2>Chat with Agent</h2>
        <div className="chat-actions">
          {task && (
            <button onClick={handleClearTask} className="btn btn-secondary">
              Clear Chat
            </button>
          )}
        </div>
      </div>

      <div className="chat-messages">
        {task && task.messages.map((message, index) => (
          <MessageItem key={index} message={message} />
        ))}
        
        {isStreaming && streamingText && (
          <div className="message-item streaming">
            <div className="message-header">
              <span className="message-author">Assistant</span>
              <span className="message-time">Streaming...</span>
            </div>
            <div className="message-content streaming-content">
              {streamingText}
              <span className="cursor">|</span>
            </div>
          </div>
        )}
        
        {!task && !loading && (
          <div className="chat-empty">
            Start a conversation by sending a message!
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
            disabled={sending || isStreaming}
            rows={1}
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!newMessage.trim() || sending || isStreaming}
          >
            {sending ? 'Sending...' : isStreaming ? 'Streaming...' : 'Send'}
          </button>
        </div>
      </form>

      {task && (
        <div className="task-info">
          <small>Task ID: {task.id} | Status: {task.status}</small>
        </div>
      )}
    </div>
  )
}

interface MessageItemProps {
  message: A2AMessage
}

function MessageItem({ message }: MessageItemProps) {
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const renderContent = () => {
    return message.parts.map((part, index) => {
      switch (part.kind) {
        case 'text':
          return <span key={index}>{part.text}</span>
        case 'image':
          return (
            <img 
              key={index} 
              src={part.image} 
              alt="Message attachment" 
              className="message-image"
            />
          )
        case 'file':
          return (
            <a 
              key={index} 
              href={part.file} 
              className="message-file"
              target="_blank" 
              rel="noopener noreferrer"
            >
              📎 File attachment
            </a>
          )
        default:
          return null
      }
    })
  }

  return (
    <div className={`message-item ${message.role}`}>
      <div className="message-header">
        <span className="message-author">
          {message.role === 'user' ? 'You' : 'Assistant'}
        </span>
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
      
      <div className="message-content">
        {renderContent()}
      </div>
      
      {message.contextId && (
        <div className="message-context">
          Context: {message.contextId}
        </div>
      )}
    </div>
  )
}

export default Chat