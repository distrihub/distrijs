import React, { useState } from 'react'
import { useAgents, AgentCard } from '@distri/react'
import { 
  RefreshCw, 
  Search, 
  Info, 
  Zap, 
  Globe, 
  Code, 
  Database,
  MessageSquare,
  Filter,
  X
} from 'lucide-react'
import clsx from 'clsx'

interface AgentListProps {
  selectedAgentId: string | null
  onSelectAgent: (agentId: string) => void
  onViewAgentDetails?: (agentId: string) => void
}

function AgentList({ selectedAgentId, onSelectAgent, onViewAgentDetails }: AgentListProps) {
  const { agents, loading, error, refetch } = useAgents()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterByCapability, setFilterByCapability] = useState<string | null>(null)

  // Defensive check to ensure agents is always an array
  const safeAgents = agents || []

  // Filter agents based on search term and capability filter
  const filteredAgents = safeAgents.filter(agent => {
    const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         agent.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCapability = !filterByCapability || 
                             agent.capabilities?.includes(filterByCapability)
    
    return matchesSearch && matchesCapability
  })

  // Get unique capabilities for filter dropdown
  const allCapabilities = Array.from(
    new Set(safeAgents.flatMap(agent => agent.capabilities || []))
  ).sort()

  const getCapabilityIcon = (capability: string) => {
    if (capability.toLowerCase().includes('code')) return <Code className="w-3 h-3" />
    if (capability.toLowerCase().includes('data')) return <Database className="w-3 h-3" />
    if (capability.toLowerCase().includes('web')) return <Globe className="w-3 h-3" />
    if (capability.toLowerCase().includes('chat')) return <MessageSquare className="w-3 h-3" />
    return <Zap className="w-3 h-3" />
  }

  if (loading && safeAgents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-primary-500 mx-auto" />
          <p className="text-sm text-gray-500">Loading agents...</p>
        </div>
      </div>
    )
  }

  if (error && safeAgents.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">Failed to load agents</p>
            <p className="text-xs text-gray-500 mt-1">{error.message}</p>
          </div>
          <button onClick={refetch} className="btn btn-outline btn-sm">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search and Filter Header */}
      <div className="p-4 space-y-3 border-b border-gray-200">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 text-sm"
          />
        </div>

        {/* Filter and Refresh */}
        <div className="flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select 
              value={filterByCapability || ''}
              onChange={(e) => setFilterByCapability(e.target.value || null)}
              className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="">All capabilities</option>
              {allCapabilities.map(capability => (
                <option key={capability} value={capability}>
                  {capability}
                </option>
              ))}
            </select>
          </div>

          <button 
            onClick={refetch}
            disabled={loading}
            className="btn btn-ghost btn-sm"
          >
            <RefreshCw className={clsx('w-4 h-4', loading && 'animate-spin')} />
          </button>
        </div>

        {/* Filter indicators */}
        {(searchTerm || filterByCapability) && (
          <div className="flex items-center space-x-2 text-xs">
            {searchTerm && (
              <span className="badge badge-gray">
                Search: {searchTerm}
                <button 
                  onClick={() => setSearchTerm('')}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {filterByCapability && (
              <span className="badge badge-primary">
                {filterByCapability}
                <button 
                  onClick={() => setFilterByCapability(null)}
                  className="ml-1 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {filteredAgents.length === 0 ? (
          <div className="p-4 text-center">
            <div className="space-y-2">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-sm text-gray-500">
                {searchTerm || filterByCapability 
                  ? 'No agents match your filters' 
                  : 'No agents available'
                }
              </p>
              {(searchTerm || filterByCapability) && (
                <button 
                  onClick={() => {
                    setSearchTerm('')
                    setFilterByCapability(null)
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredAgents.map((agent: AgentCard) => (
              <AgentItem
                key={agent.id}
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onSelect={() => onSelectAgent(agent.id)}
                onViewDetails={onViewAgentDetails ? () => onViewAgentDetails(agent.id) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {filteredAgents.length} of {safeAgents.length} agents
          </span>
          {loading && (
            <span className="flex items-center space-x-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Refreshing...</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

interface AgentItemProps {
  agent: AgentCard
  isSelected: boolean
  onSelect: () => void
  onViewDetails?: () => void
}

function AgentItem({ agent, isSelected, onSelect, onViewDetails }: AgentItemProps) {
  const getCapabilityIcon = (capability: string) => {
    if (capability.toLowerCase().includes('code')) return <Code className="w-3 h-3" />
    if (capability.toLowerCase().includes('data')) return <Database className="w-3 h-3" />
    if (capability.toLowerCase().includes('web')) return <Globe className="w-3 h-3" />
    if (capability.toLowerCase().includes('chat')) return <MessageSquare className="w-3 h-3" />
    return <Zap className="w-3 h-3" />
  }

  return (
    <div 
      className={clsx(
        'group relative p-3 rounded-lg border cursor-pointer transition-all duration-200',
        isSelected 
          ? 'border-primary-500 bg-primary-50 shadow-sm' 
          : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
      )}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={clsx(
              'font-medium text-sm truncate',
              isSelected ? 'text-primary-900' : 'text-gray-900'
            )}>
              {agent.name}
            </h3>
            {agent.version && (
              <span className="badge badge-gray text-xs">
                v{agent.version}
              </span>
            )}
          </div>
          
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {agent.description}
          </p>
          
          {agent.capabilities && agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 3).map((capability: string, index: number) => (
                <div 
                  key={index} 
                  className="flex items-center space-x-1 bg-gray-100 rounded px-2 py-1"
                >
                  {getCapabilityIcon(capability)}
                  <span className="text-xs text-gray-700 truncate max-w-20">
                    {capability}
                  </span>
                </div>
              ))}
              {agent.capabilities.length > 3 && (
                <span className="text-xs text-gray-500 px-2 py-1">
                  +{agent.capabilities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {onViewDetails && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onViewDetails()
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
          >
            <Info className="w-4 h-4 text-gray-400" />
          </button>
        )}
      </div>
    </div>
  )
}

export default AgentList