import type { ChatMessage, Step } from '../types'

export type BotDraft = {
  goal: string
  steps: Step[]
  brainstorm: ChatMessage[]
  introComplete: boolean
  runLog: string[]
}

const STORAGE_KEY_PREFIX = 'browsr.draft'

const makeEmptyDraft = (): BotDraft => ({
  goal: '',
  steps: [],
  brainstorm: [],
  introComplete: false,
  runLog: [],
})

const isChatMessage = (value: unknown): value is ChatMessage => {
  if (!value || typeof value !== 'object') {
    return false
  }
  const candidate = value as Partial<ChatMessage>
  return (
    typeof candidate.id === 'string' &&
    (candidate.role === 'user' || candidate.role === 'agent') &&
    typeof candidate.text === 'string' &&
    typeof candidate.timestamp === 'string'
  )
}

const keyFor = (threadId: string) => `${STORAGE_KEY_PREFIX}.${threadId}`

export const DraftStorage = {
  load(threadId: string): BotDraft {
    if (typeof window === 'undefined') {
      return makeEmptyDraft()
    }

    try {
      const raw = window.localStorage.getItem(keyFor(threadId))
      if (!raw) {
        return makeEmptyDraft()
      }

      const parsed = JSON.parse(raw) as BotDraft
      return {
        goal: parsed.goal ?? '',
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
        brainstorm: Array.isArray(parsed.brainstorm)
          ? parsed.brainstorm.filter(isChatMessage)
          : [],
        introComplete: Boolean(parsed.introComplete),
        runLog: Array.isArray(parsed.runLog) ? parsed.runLog : [],
      }
    } catch (error) {
      console.warn('[browsr] Failed to parse stored draft', error)
      return makeEmptyDraft()
    }
  },
  save(threadId: string, draft: BotDraft) {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(keyFor(threadId), JSON.stringify(draft))
    } catch (error) {
      console.warn('[browsr] Failed to persist draft', error)
    }
  },
  remove(threadId: string) {
    if (typeof window === 'undefined') {
      return
    }

    window.localStorage.removeItem(keyFor(threadId))
  },
  empty(): BotDraft {
    return makeEmptyDraft()
  },
}
