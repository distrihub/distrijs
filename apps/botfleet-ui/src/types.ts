export type PlatformKind = 'twitter' | 'reddit' | 'linkedin' | 'custom'

export interface CampaignTargeting {
  tags?: string[]
  [key: string]: unknown
}

export interface CampaignSchedule {
  cadence?: string
  window?: string
  start_date?: string
  end_date?: string
  summary_markdown?: string
  [key: string]: unknown
}

export interface Campaign {
  id: string
  name: string
  description?: string
  status: string
  targeting: CampaignTargeting
  schedule: CampaignSchedule
  created_at: string
  updated_at: string
}

export interface BotRecord {
  id: string
  name: string
  description?: string
  platform: PlatformKind | string
  status: string
  avatar_url?: string
  config: Record<string, unknown>
  metadata: Record<string, unknown>
  campaigns: Campaign[]
  created_at: string
  updated_at: string
}

export interface BotFilters {
  scope: 'all' | 'twitter' | 'reddit'
}

export interface WizardAccountStep {
  handle: string
  password: string
  platform: PlatformKind
  connectType: 'oauth' | 'credentials'
}

export interface WizardInterestsStep {
  tags: string[]
  instructions: string
}

export interface WizardBehaviorStep {
  frequency: number
  postingStyle: 'proactive' | 'respond'
  followNewAccounts: boolean
  sendDMs: boolean
}

export interface CreateBotPayload {
  name: string
  description?: string
  platform: string
  avatar_url?: string
  config: Record<string, unknown>
  metadata: Record<string, unknown>
  campaign_ids: string[]
}

export type FeedStatus = 'pending' | 'approved' | 'rejected'

export interface FeedAction {
  id: string
  bot_id: string
  bot_name?: string
  bot_platform?: string
  action_type: string
  summary: string
  payload: Record<string, unknown>
  status: FeedStatus
  resolution_note?: string
  created_at: string
  updated_at: string
}

export interface MemoryEntry {
  id: number
  bot_id?: string
  bot_name?: string
  title: string
  content: string
  created_at: string
}
