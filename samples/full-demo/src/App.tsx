import React, { useState, useEffect } from 'react'
import { useDistri } from '@distri/react'
import { Activity, RefreshCw, AlertCircle, CheckCircle2, Wifi, WifiOff } from 'lucide-react'
import clsx from 'clsx'

import AgentList from './components/AgentList'
import Chat from './components/Chat'
import TaskMonitor from './components/TaskMonitor'
import AgentDetailsDialog from './components/AgentDetailsDialog'
import TaskDetailsDialog from './components/TaskDetailsDialog'

function App() {
  const { client, error, isLoading } = useDistri()
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null)
  const [showTaskMonitor, setShowTaskMonitor] = useState(false)
  const [selectedAgentForDetails, setSelectedAgentForDetails] = useState<string | null>(null)
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('connecting')

  // Monitor connection status
  useEffect(() => {
    if (isLoading) {
      setConnectionStatus('connecting')
    } else if (error) {
      setConnectionStatus('error')
    } else if (client) {
      setConnectionStatus('connected')
    } else {
      setConnectionStatus('disconnected')
    }
  }, [client, error, isLoading])

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connecting':
        return <RefreshCw className="w-4 h-4 animate-spin" />
      case 'connected':
        return <Wifi className="w-4 h-4" />
      case 'error':
        return <AlertCircle className="w-4 h-4" />
      case 'disconnected':
        return <WifiOff className="w-4 h-4" />
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'Connecting...'
      case 'connected':
        return 'Connected'
      case 'error':
        return 'Connection Error'
      case 'disconnected':
        return 'Disconnected'
    }
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connecting':
        return 'text-yellow-600'
      case 'connected':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      case 'disconnected':
        return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Connecting to Distri</h2>
            <p className="text-gray-600">Initializing client connection...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="card p-6 text-center space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Connection Error</h2>
              <p className="text-gray-600 mt-2">{error.message}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-left">
              <h3 className="font-medium text-gray-900 mb-2">Troubleshooting</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Make sure the Distri server is running on the configured URL</li>
                <li>• Check that the server is accessible and CORS is configured</li>
                <li>• Verify the API endpoints are available</li>
                <li>• Check the browser console for additional error details</li>
              </ul>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary w-full"
            >
              Retry Connection
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <WifiOff className="w-8 h-8 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Client Not Available</h2>
            <p className="text-gray-600">Distri client is not initialized</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Activity className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Distri Platform</h1>
                <p className="text-sm text-gray-500">Full-Featured Demo</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className={clsx('flex items-center space-x-2 text-sm', getConnectionStatusColor())}>
                {getConnectionStatusIcon()}
                <span>{getConnectionStatusText()}</span>
              </div>
              
              <button
                onClick={() => setShowTaskMonitor(!showTaskMonitor)}
                className={clsx(
                  'btn btn-ghost',
                  showTaskMonitor && 'bg-gray-100'
                )}
              >
                Task Monitor
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Agents</h2>
          </div>
          <div className="flex-1 overflow-hidden">
            <AgentList 
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
              onViewAgentDetails={setSelectedAgentForDetails}
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedAgentId ? (
            <Chat 
              agentId={selectedAgentId} 
              onTaskCreated={(taskId) => setSelectedTaskForDetails(taskId)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center space-y-4 max-w-md">
                <Activity className="w-16 h-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Welcome to Distri</h3>
                  <p className="text-gray-600 mt-1">
                    Select an agent from the sidebar to start a conversation. 
                    Explore the capabilities of the Distri platform with real-time 
                    streaming and task management.
                  </p>
                </div>
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>Real-time streaming</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Task Monitor Sidebar */}
        {showTaskMonitor && (
          <div className="w-80 bg-white border-l border-gray-200">
            <TaskMonitor onViewTaskDetails={setSelectedTaskForDetails} />
          </div>
        )}
      </div>

      {/* Dialogs */}
      {selectedAgentForDetails && (
        <AgentDetailsDialog 
          agentId={selectedAgentForDetails}
          onClose={() => setSelectedAgentForDetails(null)}
        />
      )}
      
      {selectedTaskForDetails && (
        <TaskDetailsDialog 
          taskId={selectedTaskForDetails}
          onClose={() => setSelectedTaskForDetails(null)}
        />
      )}
    </div>
  )
}

export default App