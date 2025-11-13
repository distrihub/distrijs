import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, WandSparkles, Bot, Workflow, Eye } from "lucide-react"
import { useAgentDefinitions, ChatInput } from "@distri/react"
import { AgentDefinition, DistriPart } from "@distri/core"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { v4 as uuidv4 } from "uuid"

const AgentListing = () => {
  const navigate = useNavigate()
  const { agents, loading } = useAgentDefinitions()
  const [heroPrompt, setHeroPrompt] = useState('')
  const [showCreator, setShowCreator] = useState(false)

  const preferredAgent = useMemo(() => {
    if (!agents.length) {
      return undefined
    }
    return (
      agents.find((agent) => agent.id === 'scripter' || agent.name?.toLowerCase() === 'scripter') ||
      agents[0]
    )
  }, [agents])

  const handleHeroSend = (content: string | DistriPart[]) => {
    const text = typeof content === 'string'
      ? content
      : content.map(part => part.part_type === 'text' ? part.data : '').join('\n')

    if (!text.trim()) return
    if (preferredAgent) {
      const params = new URLSearchParams()
      params.set('prefill', text.trim())
      params.set('threadId', uuidv4())
      navigate(`/home/agents/${encodeURIComponent(preferredAgent.id)}?${params.toString()}`)
    }
    setHeroPrompt('')
    setShowCreator(false)
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
    <div className="flex h-full w-full overflow-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {showCreator ? (
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">New agent</p>
                <h3 className="text-lg font-semibold">Describe the workflow you want</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowCreator(false)}>
                Close
              </Button>
            </div>
            <ChatInput
              value={heroPrompt}
              onChange={setHeroPrompt}
              onSend={handleHeroSend}
              placeholder="Describe the agent’s goals, inputs, and tools."
              variant="hero"
            />
          </section>
        ) : null}

        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em]">Distri Agents</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" className="gap-2" onClick={() => setShowCreator(true)}>
                  Create new agent
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : agents.length === 0 ? (
            <div className="text-center text-muted-foreground">No agents found. Create a new one to get started.</div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {agents.map((agent: AgentDefinition) => (
                <Card
                  key={agent.id}
                  className="group border border-border/70 bg-card/95 text-foreground shadow-none transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
                >
                  <CardContent className="p-5">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-1 items-center gap-3 min-w-0">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/20">
                            <Avatar>
                              <AvatarImage src={agent.icon_url} />
                              <AvatarFallback className="bg-transparent text-primary">
                                {getAgentIcon(agent)}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate" title={agent.name}>
                              {agent.name}
                            </p>
                            <p className="text-xs capitalize text-muted-foreground truncate" title={agent.agent_type?.replace(/_/g, ' ') || 'standard'}>
                              {agent.agent_type?.replace(/_/g, ' ') || 'standard'}
                            </p>
                          </div>
                        </div>
                        {getActionButton(agent)}
                      </div>

                      <p className="line-clamp-1 text-sm text-muted-foreground">{agent.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default AgentListing
