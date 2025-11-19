export type Step = {
  id: string
  title: string
  instruction: string
}

export type ChatMessage = {
  id: string
  role: 'user' | 'agent'
  text: string
  timestamp: string
  context?: string
}
