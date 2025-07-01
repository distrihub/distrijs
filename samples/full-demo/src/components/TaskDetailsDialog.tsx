import React, { useState, useEffect } from 'react'
import { useDistri } from '@distri/react'
import { 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pause,
  Copy,
  Download,
  ExternalLink
} from 'lucide-react'
import clsx from 'clsx'

interface TaskDetailsDialogProps {
  taskId: string
  onClose: () => void
}

interface MockTaskDetails {
  id: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  createdAt: Date
  updatedAt: Date
  completedAt?: Date
  progress?: number
  lastMessage?: string
  logs: Array<{
    timestamp: Date
    level: 'info' | 'warning' | 'error'
    message: string
  }>
  metadata: {
    userMessage: string
    configuration: any
  }
}

function TaskDetailsDialog({ taskId, onClose }: TaskDetailsDialogProps) {
  const { client } = useDistri()
  const [task, setTask] = useState<MockTaskDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    // Mock task details for demonstration
    const mockTask: MockTaskDetails = {
      id: taskId,
      agentId: 'agent-1',
      agentName: 'Code Assistant',
      status: 'completed',
      createdAt: new Date(Date.now() - 1000 * 60 * 30),
      updatedAt: new Date(Date.now() - 1000 * 60 * 15),
      completedAt: new Date(Date.now() - 1000 * 60 * 15),
      progress: 100,
      lastMessage: 'Generated React component successfully',
      logs: [
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          level: 'info',
          message: 'Task created and queued for execution'
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 25),
          level: 'info',
          message: 'Started processing request'
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 20),
          level: 'info',
          message: 'Analyzing code requirements'
        },
        {
          timestamp: new Date(Date.now() - 1000 * 60 * 15),
          level: 'info',
          message: 'Task completed successfully'
        }
      ],
      metadata: {
        userMessage: 'Create a React component for displaying user profiles',
        configuration: {
          acceptedOutputModes: ['text/plain'],
          blocking: false
        }
      }
    }

    setTimeout(() => {
      setTask(mockTask)
      setLoading(false)
    }, 500)
  }, [taskId])

  const getStatusIcon = (status: MockTaskDetails['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />
      case 'running':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'canceled':
        return <Pause className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: MockTaskDetails['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'running':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'canceled':
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getLevelColor = (level: 'info' | 'warning' | 'error') => {
    switch (level) {
      case 'info':
        return 'text-blue-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
    }
  }

  const formatTimestamp = (date: Date) => {
    return date.toLocaleString()
  }

  const handleCopyTaskId = async () => {
    try {
      await navigator.clipboard.writeText(taskId)
    } catch (err) {
      console.error('Failed to copy task ID:', err)
    }
  }

  const handleExportLogs = () => {
    if (!task) return
    
    const logsData = {
      taskId: task.id,
      agentId: task.agentId,
      status: task.status,
      logs: task.logs,
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(logsData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `task-logs-${task.id}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
            {task && (
              <span className={clsx(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                getStatusColor(task.status)
              )}>
                {getStatusIcon(task.status)}
                <span className="ml-2">{task.status.charAt(0).toUpperCase() + task.status.slice(1)}</span>
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading task details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-500 mb-4">Error loading task details</div>
              <p className="text-gray-600">{error.message}</p>
            </div>
          ) : task ? (
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Task Information</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-700">Task ID:</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-600 font-mono">{task.id}</span>
                        <button
                          onClick={handleCopyTaskId}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Agent:</span>
                      <span className="text-gray-600">{task.agentName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Created:</span>
                      <span className="text-gray-600">{formatTimestamp(task.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium text-gray-700">Last Updated:</span>
                      <span className="text-gray-600">{formatTimestamp(task.updatedAt)}</span>
                    </div>
                    {task.completedAt && (
                      <div className="flex justify-between">
                        <span className="font-medium text-gray-700">Completed:</span>
                        <span className="text-gray-600">{formatTimestamp(task.completedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Progress</h3>
                  {task.progress !== undefined && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Completion</span>
                        <span className="font-medium">{task.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={clsx(
                            'h-2 rounded-full transition-all duration-300',
                            task.status === 'completed' ? 'bg-green-500' :
                            task.status === 'failed' ? 'bg-red-500' :
                            task.status === 'running' ? 'bg-blue-500' : 'bg-gray-400'
                          )}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {task.lastMessage && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Last Message</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">{task.lastMessage}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Original Request */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Original Request</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-700">{task.metadata.userMessage}</p>
                </div>
              </div>

              {/* Logs */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Execution Logs</h3>
                  <button
                    onClick={handleExportLogs}
                    className="btn btn-ghost btn-sm"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Logs
                  </button>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {task.logs.map((log, index) => (
                      <div key={index} className="flex items-start space-x-3 text-sm">
                        <span className="text-gray-500 font-mono text-xs mt-0.5 whitespace-nowrap">
                          {log.timestamp.toLocaleTimeString()}
                        </span>
                        <span className={clsx('font-medium uppercase text-xs mt-0.5', getLevelColor(log.level))}>
                          {log.level}
                        </span>
                        <span className="text-gray-700 flex-1">{log.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Task not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200">
          <div className="flex items-center space-x-2">
            {task && (
              <button className="btn btn-ghost btn-sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                View in Agent Chat
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskDetailsDialog