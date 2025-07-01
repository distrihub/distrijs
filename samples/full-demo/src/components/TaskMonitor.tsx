import React, { useState, useEffect } from 'react'
import { useDistri } from '@distri/react'
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pause,
  RefreshCw,
  Eye,
  MoreHorizontal
} from 'lucide-react'
import clsx from 'clsx'

interface TaskMonitorProps {
  onViewTaskDetails: (taskId: string) => void
}

interface MockTask {
  id: string
  agentId: string
  agentName: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
  createdAt: Date
  updatedAt: Date
  progress?: number
  lastMessage?: string
}

function TaskMonitor({ onViewTaskDetails }: TaskMonitorProps) {
  const { client } = useDistri()
  const [tasks, setTasks] = useState<MockTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // Mock tasks for demonstration
  useEffect(() => {
    const mockTasks: MockTask[] = [
      {
        id: 'task-1',
        agentId: 'agent-1',
        agentName: 'Code Assistant',
        status: 'completed',
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        updatedAt: new Date(Date.now() - 1000 * 60 * 15),
        progress: 100,
        lastMessage: 'Generated React component successfully'
      },
      {
        id: 'task-2',
        agentId: 'agent-2',
        agentName: 'Data Analyst',
        status: 'running',
        createdAt: new Date(Date.now() - 1000 * 60 * 10),
        updatedAt: new Date(Date.now() - 1000 * 30),
        progress: 65,
        lastMessage: 'Processing dataset...'
      },
      {
        id: 'task-3',
        agentId: 'agent-1',
        agentName: 'Code Assistant',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        updatedAt: new Date(Date.now() - 1000 * 60 * 5),
        lastMessage: 'Waiting for execution...'
      }
    ]
    setTasks(mockTasks)
  }, [])

  const getStatusIcon = (status: MockTask['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'canceled':
        return <Pause className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: MockTask['status']) => {
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

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  }

  const refreshTasks = () => {
    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setLoading(false)
    }, 1000)
  }

  const runningTasks = tasks.filter(t => t.status === 'running')
  const completedTasks = tasks.filter(t => t.status === 'completed')
  const failedTasks = tasks.filter(t => t.status === 'failed')

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold text-gray-900">Task Monitor</h2>
          </div>
          <button
            onClick={refreshTasks}
            disabled={loading}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{runningTasks.length}</div>
            <div className="text-xs text-gray-500">Running</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{completedTasks.length}</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">{failedTasks.length}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {tasks.length === 0 ? (
          <div className="h-full flex items-center justify-center p-4">
            <div className="text-center space-y-3">
              <Activity className="w-12 h-12 text-gray-300 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-900">No tasks yet</p>
                <p className="text-xs text-gray-500 mt-1">
                  Tasks will appear here when you start conversations
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-3">
            {tasks.map((task) => (
              <TaskItem 
                key={task.id}
                task={task}
                onViewDetails={() => onViewTaskDetails(task.id)}
                getStatusIcon={getStatusIcon}
                getStatusColor={getStatusColor}
                formatTimeAgo={formatTimeAgo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="text-xs text-gray-500 text-center">
          {tasks.length} total tasks
        </div>
      </div>
    </div>
  )
}

interface TaskItemProps {
  task: MockTask
  onViewDetails: () => void
  getStatusIcon: (status: MockTask['status']) => React.ReactNode
  getStatusColor: (status: MockTask['status']) => string
  formatTimeAgo: (date: Date) => string
}

function TaskItem({ 
  task, 
  onViewDetails, 
  getStatusIcon, 
  getStatusColor, 
  formatTimeAgo 
}: TaskItemProps) {
  return (
    <div className="card p-3 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            {getStatusIcon(task.status)}
            <span className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border',
              getStatusColor(task.status)
            )}>
              {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
            </span>
          </div>
          
          <div className="mb-2">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {task.agentName}
            </h3>
            <p className="text-xs text-gray-500">
              Task ID: {task.id.substring(0, 8)}...
            </p>
          </div>
          
          {task.lastMessage && (
            <p className="text-xs text-gray-600 line-clamp-2 mb-2">
              {task.lastMessage}
            </p>
          )}
          
          {task.progress !== undefined && task.status === 'running' && (
            <div className="mb-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">Progress</span>
                <span className="text-gray-700">{task.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Created {formatTimeAgo(task.createdAt)}</span>
            <span>Updated {formatTimeAgo(task.updatedAt)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={onViewDetails}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="View details"
          >
            <Eye className="w-4 h-4 text-gray-400" />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default TaskMonitor