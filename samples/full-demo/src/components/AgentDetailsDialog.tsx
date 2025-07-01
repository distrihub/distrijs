import React, { useState, useEffect } from 'react'
import { useAgents } from '@distri/react'
import { X, Zap, Globe, Code, Database, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

interface AgentDetailsDialogProps {
  agentId: string
  onClose: () => void
}

function AgentDetailsDialog({ agentId, onClose }: AgentDetailsDialogProps) {
  const { getAgent } = useAgents()
  const [agent, setAgent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchAgent = async () => {
      try {
        setLoading(true)
        const agentData = await getAgent(agentId)
        setAgent(agentData)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [agentId, getAgent])

  const getCapabilityIcon = (capability: string) => {
    if (capability.toLowerCase().includes('code')) return <Code className="w-4 h-4" />
    if (capability.toLowerCase().includes('data')) return <Database className="w-4 h-4" />
    if (capability.toLowerCase().includes('web')) return <Globe className="w-4 h-4" />
    if (capability.toLowerCase().includes('chat')) return <MessageSquare className="w-4 h-4" />
    return <Zap className="w-4 h-4" />
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Agent Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading agent details...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-500 mb-4">Error loading agent details</div>
              <p className="text-gray-600">{error.message}</p>
            </div>
          ) : agent ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">{agent.name}</h3>
                <p className="text-gray-600 mb-4">{agent.description}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Agent ID:</span>
                    <span className="ml-2 text-gray-600 font-mono">{agent.id}</span>
                  </div>
                  {agent.version && (
                    <div>
                      <span className="font-medium text-gray-700">Version:</span>
                      <span className="ml-2 text-gray-600">{agent.version}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Capabilities */}
              {agent.capabilities && agent.capabilities.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Capabilities</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {agent.capabilities.map((capability: string, index: number) => (
                      <div 
                        key={index}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        {getCapabilityIcon(capability)}
                        <span className="text-gray-700">{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Info */}
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-3">Additional Information</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-sm text-gray-600">
                    <p>This agent is available for conversation and task execution.</p>
                    <p className="mt-2">
                      To interact with this agent, select it from the agent list and start a conversation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Agent not found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-200">
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

export default AgentDetailsDialog