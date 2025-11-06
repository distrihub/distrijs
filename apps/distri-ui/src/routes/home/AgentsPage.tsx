

import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, FileText, WandSparkles, Sparkles, Bot, Workflow, Eye } from "lucide-react"
import { Header } from "@/components/ui/header"
import { useAgentDefinitions } from "@distri/react"
import { AgentDefinition } from "@distri/core"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"


const AgentListing = () => {

  const navigate = useNavigate()
  const { agents, loading } = useAgentDefinitions()

  const createAgent = () => {
    console.log("createAgent")
  }

  const handleChatWithAgent = (agent: AgentDefinition) => {
    navigate(`/home/agents/${encodeURIComponent(agent.id)}`)
  }

  const getAgentIcon = (agent: AgentDefinition) => {
    if (agent.agent_type === 'sequential_workflow_agent' || 
        agent.agent_type === 'dag_workflow_agent' || 
        agent.agent_type === 'custom_agent') {
      return <Workflow className="h-6 w-6 text-primary" />
    }
    return <Bot className="h-6 w-6 text-primary" />
  }

  const getActionButton = (agent: AgentDefinition) => {
    if (agent.agent_type === 'sequential_workflow_agent' || 
        agent.agent_type === 'dag_workflow_agent' || 
        agent.agent_type === 'custom_agent') {
      return (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleChatWithAgent(agent)}
          className="h-8 w-8 p-0 rounded-lg hover:bg-muted flex-shrink-0"
          title="View Workflow"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
    return (
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleChatWithAgent(agent)}
        className="h-8 w-8 p-0 rounded-lg hover:bg-muted flex-shrink-0"
        title="Chat with Agent"
      >
        <MessageSquare className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <Header
        title="Agents & Workflows"
        subtitle={
          <p className="text-muted-foreground text-sm flex  gap-2">
            Chat with agents or run workflows! <WandSparkles className="h-4 w-4 text-primary" />
          </p>
        }
        rightElement={
          <Button
            onClick={() => createAgent()}
            variant="secondary"
            size="lg"
            className="flex items-center gap-3"
          >
            <FileText className="h-5 w-5" />
            <span>Create a new AI Agent</span>
          </Button>
        }
      />
      <div className="flex-1 px-4 py-6">
        <div className="max-w-7xl">

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col space-y-3">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </div>
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center py-12">
              <p>No agents found. Create a new one to get started.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {agents.map((agent: AgentDefinition, index: number) => (
                  <Card
                    key={index}
                    className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-border hover:border-primary/20"
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 bg-muted/50 rounded-lg p-2 flex items-center justify-center">
                              <Avatar>
                                <AvatarImage src={agent.icon_url} />
                                <AvatarFallback>
                                  {getAgentIcon(agent)}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-foreground truncate">{agent.name}</h3>
                            </div>
                          </div>

                          <div className="flex items-center space-x-1">
                            {getActionButton(agent)}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <p className="text-xs text-muted-foreground truncate">{agent.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentListing