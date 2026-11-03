// How an integrated assistant looks and talks in a host app. One JSON object, every field optional, so the
// defaults alone give a finished result. Cloud's Integrate screen produces it; the signed integration link carries it.

export interface ExperienceConfig {
  /** Shown in the header and welcome. Default: the agent's name, humanised. */
  name?: string
  /** One or two sentences under the name on the empty state. */
  welcome?: string
  /** Up to 4 starter prompts shown as chips on the empty state. */
  suggestions?: string[]
  /** Composer placeholder. Default "Ask anything". */
  placeholder?: string
  /** Built-in look. Default 'paper'. 'auto' follows prefers-color-scheme (paper <-> ink). */
  theme?: 'paper' | 'ink' | 'studio' | 'plain' | 'auto'
  /** Accent colour, any CSS colour. Overrides the theme's accent. */
  accent?: string
  /** Corner style. Default 'soft'. */
  radius?: 'sharp' | 'soft' | 'round'
  /** 'launcher' = floating button + panel (default), 'panel' = fixed side panel, 'inline' = fills its container. */
  layout?: 'launcher' | 'panel' | 'inline'
  /** Launcher/panel side. Default 'right'. */
  side?: 'right' | 'left'
  /** How much tool activity a guest sees. Default 'steps'. */
  toolActivity?: 'hidden' | 'steps' | 'detailed'
  /** Plain wording per tool, e.g. { search_restaurants: { running: 'Searching restaurants', done: 'Found restaurants' } }. */
  toolLabels?: Record<string, { running?: string; done?: string }>
  /** Free-text guidance on how to present answers in this app. Sent with every message as a dynamic prompt section; the agent's own instructions are untouched. */
  instructions?: string
}

export const EXPERIENCE_THEMES = ['paper', 'ink', 'studio', 'plain', 'auto'] as const
export const EXPERIENCE_RADII = ['sharp', 'soft', 'round'] as const
export const EXPERIENCE_LAYOUTS = ['launcher', 'panel', 'inline'] as const
export const EXPERIENCE_TOOL_ACTIVITY = ['hidden', 'steps', 'detailed'] as const

export const EXPERIENCE_DEFAULTS = {
  placeholder: 'Ask anything',
  theme: 'paper',
  radius: 'soft',
  layout: 'launcher',
  side: 'right',
  toolActivity: 'steps',
} as const satisfies ExperienceConfig

// ---------------------------------------------------------------------------
// Resolution: turn whatever a host (or a signed link) hands us into a safe,
// fully-populated config. Unknown values fall back to defaults, lengths are
// clamped, nothing throws.
// ---------------------------------------------------------------------------

export const EXPERIENCE_LIMITS = {
  name: 60,
  welcome: 280,
  suggestions: 4,
  suggestion: 120,
  placeholder: 80,
  instructions: 4000,
  accent: 64,
  toolLabels: 50,
  toolLabel: 80,
} as const

export interface ResolvedExperience {
  name: string
  welcome: string
  suggestions: string[]
  placeholder: string
  theme: (typeof EXPERIENCE_THEMES)[number]
  accent?: string
  radius: (typeof EXPERIENCE_RADII)[number]
  layout: (typeof EXPERIENCE_LAYOUTS)[number]
  side: 'right' | 'left'
  toolActivity: (typeof EXPERIENCE_TOOL_ACTIVITY)[number]
  toolLabels: Record<string, { running?: string; done?: string }>
  instructions?: string
}

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback
}

function text(value: unknown, max: number): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : undefined
}

/** Accept plain CSS colours only; anything that could close a declaration or load a resource is dropped. */
export function sanitizeAccent(value: unknown): string | undefined {
  const accent = text(value, EXPERIENCE_LIMITS.accent)
  if (!accent) return undefined
  if (/[;{}<>\\"'@]|url\(|expression\(|var\(|\/\*/i.test(accent)) return undefined
  return accent
}

/** "nook_concierge" -> "Nook concierge". Used for the default assistant name. */
export function humanizeAgentName(id: string | undefined): string {
  if (!id) return 'Assistant'
  const words = id
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-.\s]+/g, ' ')
    .trim()
    .toLowerCase()
  if (!words) return 'Assistant'
  return words.charAt(0).toUpperCase() + words.slice(1)
}

export function resolveExperience(input?: ExperienceConfig | null, agentId?: string): ResolvedExperience {
  const cfg: ExperienceConfig = input && typeof input === 'object' ? input : {}
  const name = text(cfg.name, EXPERIENCE_LIMITS.name) ?? humanizeAgentName(agentId)

  const suggestions = (Array.isArray(cfg.suggestions) ? cfg.suggestions : [])
    .map((s) => text(s, EXPERIENCE_LIMITS.suggestion))
    .filter((s): s is string => Boolean(s))
    .slice(0, EXPERIENCE_LIMITS.suggestions)

  const toolLabels: ResolvedExperience['toolLabels'] = {}
  if (cfg.toolLabels && typeof cfg.toolLabels === 'object') {
    for (const [tool, label] of Object.entries(cfg.toolLabels).slice(0, EXPERIENCE_LIMITS.toolLabels)) {
      if (!label || typeof label !== 'object') continue
      const running = text(label.running, EXPERIENCE_LIMITS.toolLabel)
      const done = text(label.done, EXPERIENCE_LIMITS.toolLabel)
      if (running || done) toolLabels[tool] = { running, done }
    }
  }

  return {
    name,
    welcome: text(cfg.welcome, EXPERIENCE_LIMITS.welcome) ?? `Hi, I'm ${name}. How can I help?`,
    suggestions,
    placeholder: text(cfg.placeholder, EXPERIENCE_LIMITS.placeholder) ?? EXPERIENCE_DEFAULTS.placeholder,
    theme: pick(cfg.theme, EXPERIENCE_THEMES, EXPERIENCE_DEFAULTS.theme),
    accent: sanitizeAccent(cfg.accent),
    radius: pick(cfg.radius, EXPERIENCE_RADII, EXPERIENCE_DEFAULTS.radius),
    layout: pick(cfg.layout, EXPERIENCE_LAYOUTS, EXPERIENCE_DEFAULTS.layout),
    side: pick(cfg.side, ['right', 'left'] as const, EXPERIENCE_DEFAULTS.side),
    toolActivity: pick(cfg.toolActivity, EXPERIENCE_TOOL_ACTIVITY, EXPERIENCE_DEFAULTS.toolActivity),
    toolLabels,
    instructions: text(cfg.instructions, EXPERIENCE_LIMITS.instructions),
  }
}

/** Key of the dynamic prompt section that carries `experience.instructions`. */
export const EXPERIENCE_SECTION_KEY = 'app_presentation_guidance'

/** The `dynamic_sections` entry for the instructions, or none. The agent's own instructions are never replaced. */
export function experienceSections(exp: Pick<ResolvedExperience, 'instructions'>): Array<{ key: string; content: string }> {
  return exp.instructions
    ? [{ key: EXPERIENCE_SECTION_KEY, content: `How to present answers in this app:\n${exp.instructions}` }]
    : []
}
