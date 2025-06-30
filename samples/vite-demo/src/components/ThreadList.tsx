import React, { useState } from 'react'
import { useThreads, Thread } from '@distri/react'
import './ThreadList.css'

interface ThreadListProps {
  selectedThreadId: string | null
  onSelectThread: (threadId: string) => void
}

function ThreadList({ selectedThreadId, onSelectThread }: ThreadListProps) {
  const { threads, loading, error, createThread } = useThreads()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: ''
  })

  const handleCreateThread = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      const newThread = await createThread({
        title: formData.title,
        description: formData.description || undefined
      })
      setFormData({ title: '', description: '' })
      setShowCreateForm(false)
      onSelectThread(newThread.id)
    } catch (err) {
      console.error('Failed to create thread:', err)
    }
  }

  if (loading && threads.length === 0) {
    return (
      <div className="thread-list">
        <div className="thread-list-loading">Loading threads...</div>
      </div>
    )
  }

  if (error && threads.length === 0) {
    return (
      <div className="thread-list">
        <div className="thread-list-error">
          Failed to load threads: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="thread-list">
      <div className="thread-list-header">
        <button 
          className="btn btn-create"
          onClick={() => setShowCreateForm(!showCreateForm)}
        >
          {showCreateForm ? 'Cancel' : 'New Thread'}
        </button>
      </div>

      {showCreateForm && (
        <form className="create-thread-form" onSubmit={handleCreateThread}>
          <div className="form-group">
            <input
              type="text"
              placeholder="Thread title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <textarea
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn">Create</button>
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={() => setShowCreateForm(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="thread-list-items">
        {threads.map((thread) => (
          <ThreadItem
            key={thread.id}
            thread={thread}
            isSelected={thread.id === selectedThreadId}
            onSelect={() => onSelectThread(thread.id)}
          />
        ))}
        
        {threads.length === 0 && !loading && (
          <div className="thread-list-empty">
            No threads yet. Create your first thread!
          </div>
        )}
      </div>
    </div>
  )
}

interface ThreadItemProps {
  thread: Thread
  isSelected: boolean
  onSelect: () => void
}

function ThreadItem({ thread, isSelected, onSelect }: ThreadItemProps) {
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    
    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } else {
      return date.toLocaleDateString()
    }
  }

  return (
    <div 
      className={`thread-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="thread-item-header">
        <h3 className="thread-item-title">{thread.title}</h3>
        <span className="thread-item-date">{formatDate(thread.updatedAt)}</span>
      </div>
      {thread.description && (
        <p className="thread-item-description">{thread.description}</p>
      )}
      <div className="thread-item-meta">
        <span className="participant-count">
          {thread.participants.length} participant{thread.participants.length !== 1 ? 's' : ''}
        </span>
        <span className={`thread-status ${thread.status}`}>
          {thread.status}
        </span>
      </div>
    </div>
  )
}

export default ThreadList