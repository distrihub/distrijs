import React, { useState, useEffect, useCallback } from 'react'
import { 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Pause,
  MoreHorizontal,
  Trash2,
  Info
} from 'lucide-react'
import clsx from 'clsx'
import TaskDetailsDialog from './TaskDetailsDialog'

interface TaskStatus {
  state: 'pending' | 'running' | 'completed' | 'failed' | 'canceled'
}

interface Task {
  id: string
  agentId: string
  agentName: string
  status: TaskStatus
  createdAt: Date
  lastMessage?: string
  progress?: number
}

function TaskMonitor() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all')

  const loadTasks = useCallback(async () => {
    // Mock tasks for demonstration
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        agentId: 'agent-1',
        agentName: 'Code Assistant',
        status: { state: 'completed' },
        createdAt: new Date(Date.now() - 1000 * 60 * 30),
        lastMessage: 'Generated React component successfully',
        progress: 100
      },
      {
        id: 'task-2',
        agentId: 'agent-2', 
        agentName: 'Data Analyst',
        status: { state: 'running' },
        createdAt: new Date(Date.now() - 1000 * 60 * 15),
        lastMessage: 'Analyzing dataset...',
        progress: 65
      },
      {
        id: 'task-3',
        agentId: 'agent-1',
        agentName: 'Code Assistant',
        status: { state: 'pending' },
        createdAt: new Date(Date.now() - 1000 * 60 * 5),
        lastMessage: 'Waiting to start...',
        progress: 0
      },
      {
        id: 'task-4',
        agentId: 'agent-3',
        agentName: 'Web Scraper',
        status: { state: 'failed' },
        createdAt: new Date(Date.now() - 1000 * 60 * 45),
        lastMessage: 'Failed to connect to target website',
        progress: 25
      }
    ]
    
    setTasks(mockTasks)
  }, [])

  useEffect(() => {
    loadTasks()
    // Set up polling for task updates
    const interval = setInterval(loadTasks, 5000)
    return () => clearInterval(interval)
  }, [loadTasks])

  const getStatusIcon = (status: TaskStatus) => {
    switch (status.state) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'running':
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'canceled':
        return <Pause className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: TaskStatus) => {
    switch (status.state) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'running':
        return 'text-blue-600 bg-blue-50'
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'canceled':
        return 'text-gray-600 bg-gray-50'
    }
  }

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true
    return task.status.state === filter
  })

  const handleCancelTask = async (taskId: string) => {
    // Mock task cancellation
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, status: { state: 'canceled' }, lastMessage: 'Task cancelled by user' }
        : task
    ))
  }

  const handleDeleteTask = async (taskId: string) => {
    // Mock task deletion
    setTasks(prev => prev.filter(task => task.id !== taskId))
  }

  const formatTimeAgo = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(minutes / 60)
    
    if (hours > 0) {
      return `${hours}h ago`
    } else if (minutes > 0) {
      return `${minutes}m ago`
    } else {
      return 'Just now'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Task Monitor</h2>
        <div className="flex items-center space-x-2">
          {/* Filter buttons */}
          {['all', 'running', 'completed', 'failed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption as any)}
              className={clsx(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                filter === filterOption
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              {filterOption !== 'all' && (
                <span className="ml-1 text-xs">
                  ({tasks.filter(t => t.status.state === filterOption).length})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length > 0 ? (
          filteredTasks.map((task) => (
            <div 
              key={task.id}
              className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(task.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        Task {task.id}
                      </h3>
                      <span className={clsx(
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getStatusColor(task.status)
                      )}>
                        {task.status.state.charAt(0).toUpperCase() + task.status.state.slice(1)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-500">
                        Agent: {task.agentName}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatTimeAgo(task.createdAt)}
                      </span>
                    </div>
                    {task.lastMessage && (
                      <p className="text-sm text-gray-600 mt-1 truncate">
                        {task.lastMessage}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {/* Progress bar for running tasks */}
                  {task.status.state === 'running' && task.progress !== undefined && (
                    <div className="w-20">
                      <div className="text-xs text-gray-500 text-right mb-1">
                        {task.progress}%
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setSelectedTaskId(task.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                      title="View details"
                    >
                      <Info className="w-4 h-4 text-gray-400" />
                    </button>
                    
                    {task.status.state === 'running' && (
                      <button
                        onClick={() => handleCancelTask(task.id)}
                        className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        title="Cancel task"
                      >
                        <Pause className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                    
                    {(task.status.state === 'completed' || task.status.state === 'failed' || task.status.state === 'canceled') && (
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                    
                    <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors">
                      <MoreHorizontal className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No tasks found</p>
            {filter !== 'all' && (
              <button
                onClick={() => setFilter('all')}
                className="text-primary-600 hover:text-primary-700 text-sm mt-2"
              >
                View all tasks
              </button>
            )}
          </div>
        )}
      </div>

      {/* Task Details Dialog */}
      {selectedTaskId && (
        <TaskDetailsDialog
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  )
}

export default TaskMonitor