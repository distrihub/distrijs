import React from 'react'
import { useAgents, AgentCard } from '@distri/react'
import './AgentList.css'

interface AgentListProps {
  selectedAgentId: string | null
  onSelectAgent: (agentId: string) => void
}

function AgentList({ selectedAgentId, onSelectAgent }: AgentListProps) {
  const { agents, loading, error, refetch } = useAgents()

  // Defensive check to ensure agents is always an array
  const safeAgents = agents || []

  if (loading && safeAgents.length === 0) {
    return (
      <div className="agent-list">
        <div className="agent-list-loading">Loading agents...</div>
      </div>
    )
  }

  if (error && safeAgents.length === 0) {
    return (
      <div className="agent-list">
        <div className="agent-list-error">
          Failed to load agents: {error.message}
          <button onClick={refetch} className="retry-btn">Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="agent-list">
      <div className="agent-list-header">
        <button
          className="btn btn-refresh"
          onClick={refetch}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="agent-list-items">
        {safeAgents.map((agent: AgentCard) => (
          <AgentItem
            key={agent.name}
            agent={agent}
            isSelected={agent.name === selectedAgentId}
            onSelect={() => onSelectAgent(agent.name)}
          />
        ))}

        {safeAgents.length === 0 && !loading && (
          <div className="agent-list-empty">
            No agents available. Make sure your Distri server is running.
          </div>
        )}
      </div>
    </div>
  )
}

interface AgentItemProps {
  agent: AgentCard
  isSelected: boolean
  onSelect: () => void
}

function AgentItem({ agent, isSelected, onSelect }: AgentItemProps) {
  return (
    <div
      className={`agent-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <div className="agent-item-header">
        <h3 className="agent-item-name">{agent.name}</h3>
        {agent.version && (
          <span className="agent-item-version">v{agent.version}</span>
        )}
      </div>

      <p className="agent-item-description">{agent.description}</p>

      {agent.skills && agent.skills.length > 0 && (
        <div className="agent-item-capabilities">
          {agent.skills.slice(0, 3).map((skill, index: number) => (
            <span key={index} className="capability-tag">
              {skill.name}
            </span>
          ))}
          {agent.skills.length > 3 && (
            <span className="capability-tag more">
              +{agent.skills.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default AgentList