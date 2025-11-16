import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChatInput, useAgentDefinitions } from '@distri/react'
import type { DistriPart } from '@distri/core'
import { v4 as uuidv4 } from 'uuid'

const NewAgentPage = () => {
  const navigate = useNavigate()
  const { agents, loading } = useAgentDefinitions()
  const [prompt, setPrompt] = useState('')

  const preferredAgent = useMemo(() => {
    if (!agents.length) {
      return undefined
    }
    return (
      agents.find((agent) => agent.id === 'scripter' || agent.name?.toLowerCase() === 'scripter') ||
      agents[0]
    )
  }, [agents])

  const handleSend = (content: string | DistriPart[]) => {
    const text = typeof content === 'string'
      ? content
      : content.map((part) => (part.part_type === 'text' ? part.data : '')).join('\n')

    if (!text.trim() || !preferredAgent) {
      return
    }

    const params = new URLSearchParams()
    params.set('prefill', text.trim())
    params.set('threadId', uuidv4())
    navigate(`/home/agents/${encodeURIComponent(preferredAgent.id)}?${params.toString()}`)
    setPrompt('')
  }

  return (
    <div className="flex h-full w-full items-center justify-center ">
      <div className="w-full max-w-2xl space-y-6 p-4 shadow-sm sm:p-6 lg:p-8">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">New agent</p>
        </div>
        <ChatInput
          value={prompt}
          onChange={setPrompt}
          onSend={handleSend}
          placeholder={'Describe the agent you want to build'}
          disabled={!preferredAgent || loading}
          variant="hero"
        />
      </div>
    </div>
  )
}

export default NewAgentPage
