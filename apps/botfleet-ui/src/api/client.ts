import type {
  BotRecord,
  Campaign,
  CreateBotPayload,
  FeedAction,
  FeedStatus,
  MemoryEntry,
} from '@/types'

const API_BASE = import.meta.env.VITE_BOTFLEET_API_BASE ?? ''

type Json = Record<string, unknown>

interface FeedQuery {
  status?: FeedStatus | 'all'
  bot_id?: string
}

interface MemoryQuery {
  bot_id?: string
}

function encodeQuery(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, value]) => Boolean(value))
  if (!entries.length) return ''
  const usp = new URLSearchParams(entries as [string, string][])
  return `?${usp.toString()}`
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.error ?? `Request failed with status ${response.status}`)
  }

  return response.json() as Promise<T>
}

export const BotFleetAPI = {
  getBots: () => request<BotRecord[]>('/api/bots'),
  getCampaigns: () => request<Campaign[]>('/api/campaigns'),
  createBot: (payload: CreateBotPayload) =>
    request<BotRecord>('/api/bots', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  createCampaign: (payload: Json) =>
    request<Campaign>('/api/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  kickoffBot: (botId: string) =>
    request<Json>(`/api/bots/${botId}/kickoff`, {
      method: 'POST',
    }),
  getFeed: (params: FeedQuery = {}) =>
    request<FeedAction[]>(
      `/api/feed${encodeQuery({
        status: params.status && params.status !== 'all' ? params.status : undefined,
        bot_id: params.bot_id,
      })}`,
    ),
  createFeedAction: (payload: Json) =>
    request<FeedAction>('/api/feed', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  decideFeedAction: (actionId: string, payload: { status: FeedStatus; note?: string }) =>
    request<FeedAction>(`/api/feed/${actionId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMemories: (params: MemoryQuery = {}) =>
    request<MemoryEntry[]>(`/api/memories${encodeQuery({ bot_id: params.bot_id })}`),
  createMemory: (payload: Json) =>
    request<MemoryEntry>('/api/memories', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  deleteMemory: (memoryId: number) =>
    request<void>(`/api/memories/${memoryId}`, {
      method: 'DELETE',
    }),
}
