import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useTask, A2AMessage } from '@distri/react'
import { 
  Send, 
  Loader2, 
  Trash2, 
  Copy, 
  Download,
  Image,
  FileText,
  RotateCcw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pause
} from 'lucide-react'
import clsx from 'clsx'
import MessageRenderer from './MessageRenderer'

interface ChatProps {
  agentId: string
  onTaskCreated?: (taskId: string) => void
}

function Chat({ agentId, onTaskCreated }: ChatProps) {
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
  const [showCopyFeedback, setShowCopyFeedback] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Auto-scroll when new messages arrive or when streaming
  useEffect(() => {
    const timeoutId = setTimeout(scrollToBottom, 100)
    return () => clearTimeout(timeoutId)
  }, [task, streamingText, scrollToBottom])

  // Notify parent when task is created
  useEffect(() => {
    if (task && onTaskCreated) {
      onTaskCreated(task.id)
    }
  }, [task, onTaskCreated])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    const content = newMessage.trim()
    if (!content || sending || isStreaming) return

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
    if (window.confirm('Are you sure you want to clear this conversation? This action cannot be undone.')) {
      clearTask()
      setNewMessage('')
    }
  }

  const handleCopyConversation = async () => {
    if (!task) return
    
    const conversationText = task.messages.map((msg: any) => {
      const role = msg.role === 'user' ? 'You' : 'Assistant'
      const content = msg.parts.map((part: any) => {
        if (part.kind === 'text') return part.text
        return '[Non-text content]'
      }).join(' ')
      return `${role}: ${content}`
    }).join('\n\n')

    try {
      await navigator.clipboard.writeText(conversationText)
      setShowCopyFeedback('copied')
      setTimeout(() => setShowCopyFeedback(null), 2000)
    } catch (err) {
      setShowCopyFeedback('error')
      setTimeout(() => setShowCopyFeedback(null), 2000)
    }
  }

  const handleExportConversation = () => {
    if (!task) return
    
    const conversationData = {
      taskId: task.id,
      agentId: agentId,
      timestamp: new Date().toISOString(),
      messages: task.messages
    }
    
    const blob = new Blob([JSON.stringify(conversationData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `conversation-${task.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTaskStatusIcon = () => {
    if (!task) return null
    
    switch (task.status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'canceled':
        return <Pause className="w-4 h-4 text-gray-500" />
      default:
        return null
    }
  }

  const getTaskStatusText = () => {
    if (!task) return 'No active task'
    
    switch (task.status) {
      case 'pending':
        return 'Task pending...'
      case 'running':
        return 'Task running...'
      case 'completed':
        return 'Task completed'
      case 'failed':
        return 'Task failed'
      case 'canceled':
        return 'Task canceled'
      default:
        return `Status: ${task.status}`
    }
  }

  if (loading && !task) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-500">Initializing chat...</p>
        </div>
      </div>
    )
  }

  if (error && !task) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-gray-900">Chat Error</h3>
            <p className="text-sm text-gray-600 mt-1">Failed to initialize chat: {error.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex-shrink-0 bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <MessageSquare className="w-5 h-5 text-primary-600" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {getTaskStatusIcon()}
                <span>{getTaskStatusText()}</span>
                {task && (
                  <span className="text-xs text-gray-400">
                    • Task: {task.id.substring(0, 8)}...
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {task && (
              <>
                <button
                  onClick={handleCopyConversation}
                  className="btn btn-ghost btn-sm"
                  title="Copy conversation"
                >
                  {showCopyFeedback === 'copied' ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : showCopyFeedback === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                
                <button
                  onClick={handleExportConversation}
                  className="btn btn-ghost btn-sm"
                  title="Export conversation"
                >
                  <Download className="w-4 h-4" />
                </button>
                
                <button
                  onClick={handleClearTask}
                  className="btn btn-ghost btn-sm text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Clear conversation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto scrollbar-thin bg-gray-50"
      >
        {task && task.messages.length > 0 ? (
          <div className="space-y-4 p-4">
            {task.messages.map((message: any, index: number) => (
              <MessageItem key={index} message={message} />
            ))}
            
            {isStreaming && streamingText && (
              <div className="flex space-x-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-primary-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="text-sm font-medium text-gray-900">Assistant</span>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-gray-500">Streaming...</span>
                      </div>
                    </div>
                    <div className="prose prose-sm max-w-none">
                      <MessageRenderer content={streamingText} isStreaming={true} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-8">
            <div className="text-center space-y-4 max-w-md">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Start a conversation</h3>
                <p className="text-gray-600 mt-1">
                  Send a message to begin chatting with this agent. 
                  Your conversation will support real-time streaming responses.
                </p>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              className="textarea w-full pr-12 resize-none"
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              value={newMessage}
              onChange={handleTextareaChange}
              onKeyPress={handleKeyPress}
              disabled={sending || isStreaming}
              rows={1}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending || isStreaming}
              className={clsx(
                'absolute right-2 bottom-2 p-2 rounded-md transition-colors',
                !newMessage.trim() || sending || isStreaming
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-primary-600 hover:text-primary-700 hover:bg-primary-50'
              )}
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {(sending || isStreaming) && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{sending ? 'Sending message...' : 'Receiving response...'}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}

interface MessageItemProps {
  message: A2AMessage
}

function MessageItem({ message }: MessageItemProps) {
  const [showCopied, setShowCopied] = useState(false)
  
  const formatTime = (timestamp?: number) => {
    if (!timestamp) return ''
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const handleCopyMessage = async () => {
    const content = message.parts.map(part => {
      if (part.kind === 'text') return part.text
      return '[Non-text content]'
    }).join(' ')

    try {
      await navigator.clipboard.writeText(content)
      setShowCopied(true)
      setTimeout(() => setShowCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy message:', err)
    }
  }

  const isUser = message.role === 'user'

  return (
    <div className={clsx('flex space-x-3', isUser && 'flex-row-reverse space-x-reverse')}>
      <div className="flex-shrink-0">
        <div className={clsx(
          'w-8 h-8 rounded-full flex items-center justify-center',
          isUser 
            ? 'bg-primary-600 text-white' 
            : 'bg-gray-200 text-gray-600'
        )}>
          {isUser ? (
            <span className="text-sm font-medium">U</span>
          ) : (
            <MessageSquare className="w-4 h-4" />
          )}
        </div>
      </div>
      
      <div className={clsx('flex-1 min-w-0', isUser && 'flex justify-end')}>
        <div className={clsx(
          'rounded-lg shadow-sm border p-4 max-w-3xl',
          isUser 
            ? 'bg-primary-600 text-white border-primary-600' 
            : 'bg-white text-gray-900 border-gray-200'
        )}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className={clsx(
                'text-sm font-medium',
                isUser ? 'text-primary-100' : 'text-gray-900'
              )}>
                {isUser ? 'You' : 'Assistant'}
              </span>
              <span className={clsx(
                'text-xs',
                isUser ? 'text-primary-200' : 'text-gray-500'
              )}>
                {formatTime(message.timestamp)}
              </span>
            </div>
            
            <button
              onClick={handleCopyMessage}
              className={clsx(
                'p-1 rounded hover:bg-opacity-20 transition-colors',
                isUser 
                  ? 'text-primary-200 hover:bg-white' 
                  : 'text-gray-400 hover:bg-gray-100'
              )}
            >
              {showCopied ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
          
          <div className={clsx(
            'prose prose-sm max-w-none',
            isUser && 'prose-invert'
          )}>
            <MessageRenderer 
              content={message.parts.map(part => {
                if (part.kind === 'text') return part.text
                return '[Non-text content]'
              }).join(' ')} 
            />
          </div>
          
          {message.contextId && (
            <div className={clsx(
              'mt-3 pt-3 border-t text-xs',
              isUser 
                ? 'border-primary-500 text-primary-200' 
                : 'border-gray-200 text-gray-500'
            )}>
              Context: {message.contextId}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Chat