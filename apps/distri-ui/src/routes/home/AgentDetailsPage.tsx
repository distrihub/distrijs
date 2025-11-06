import { useParams } from 'react-router-dom'
import { useAgent } from '@distri/react'
import { SkeletonCard } from '@/components/ReplayChat'
import { AgentChatView } from '@/components/AgentChatView'
import { WorkflowDetailsView } from '@/components/WorkflowDetailsView'

export default function AgentDetailsPage() {
  const { agentId: encodedAgentId } = useParams<{ agentId: string }>()
  const agentId = encodedAgentId ? decodeURIComponent(encodedAgentId) : undefined

  const { agent, loading } = useAgent({ agentIdOrDef: agentId || '' })

  if (loading) {
    return (
      <div className="flex-1 flex overflow-hidden min-h-0 gap-2">
        <div className="flex-1 overflow-hidden">
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-muted-foreground">
          <p>Agent not found</p>
        </div>
      </div>
    )
  }

  const agentType = agent.agentType
  // Determine if this is a workflow agent type
  const isWorkflowAgent = agentType === 'sequential_workflow_agent' ||
    agentType === 'dag_workflow_agent' ||
    agentType === 'custom_agent'

  console.log('AgentDetailsPage - agent.agent_type:', agentType)
  console.log('AgentDetailsPage - isWorkflowAgent:', isWorkflowAgent)

  // Render the appropriate view component
  if (isWorkflowAgent) {
    console.log('Rendering WorkflowDetailsView')
    return <WorkflowDetailsView agent={agent} />
  } else {
    console.log('Rendering AgentChatView')
    return <AgentChatView agent={agent} agentId={agentId || ''} />
  }
}