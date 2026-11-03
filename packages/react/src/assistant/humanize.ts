// Plain-language wording for tool activity. Guests never see tool ids or JSON.

const GERUND: Record<string, [string, string]> = {
  // verb -> [running ("Searching"), done ("Searched")]
  search: ['Searching', 'Searched'],
  find: ['Finding', 'Found'],
  get: ['Getting', 'Got'],
  fetch: ['Fetching', 'Fetched'],
  read: ['Reading', 'Read'],
  list: ['Listing', 'Listed'],
  lookup: ['Looking up', 'Looked up'],
  look: ['Looking', 'Looked'],
  check: ['Checking', 'Checked'],
  create: ['Creating', 'Created'],
  make: ['Making', 'Made'],
  add: ['Adding', 'Added'],
  update: ['Updating', 'Updated'],
  edit: ['Editing', 'Edited'],
  delete: ['Deleting', 'Deleted'],
  remove: ['Removing', 'Removed'],
  cancel: ['Cancelling', 'Cancelled'],
  book: ['Booking', 'Booked'],
  reserve: ['Reserving', 'Reserved'],
  send: ['Sending', 'Sent'],
  open: ['Opening', 'Opened'],
  show: ['Showing', 'Showed'],
  load: ['Loading', 'Loaded'],
  save: ['Saving', 'Saved'],
  compare: ['Comparing', 'Compared'],
  calculate: ['Calculating', 'Calculated'],
  compute: ['Computing', 'Computed'],
  analyze: ['Analysing', 'Analysed'],
  summarize: ['Summarising', 'Summarised'],
  filter: ['Filtering', 'Filtered'],
  query: ['Querying', 'Queried'],
  run: ['Running', 'Ran'],
  call: ['Calling', 'Called'],
  validate: ['Validating', 'Validated'],
  verify: ['Verifying', 'Verified'],
  schedule: ['Scheduling', 'Scheduled'],
  navigate: ['Opening', 'Opened'],
  select: ['Selecting', 'Selected'],
  set: ['Setting', 'Set'],
  fill: ['Filling in', 'Filled in'],
}

/** Words of a tool id, ignoring namespaces such as `mcp__server__tool` or `crm.search_contacts`. */
export function toolWords(name: string): string[] {
  const last = String(name ?? '')
    .split(/__|\.|\/|:/)
    .filter(Boolean)
    .pop() ?? ''
  return last
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\s]+/g, ' ')
    .trim()
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
}

/** "search_restaurants" -> "Search restaurants". */
export function humanizeToolName(name: string): string {
  const words = toolWords(name)
  if (words.length === 0) return 'Working'
  const s = words.join(' ')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export type StepStatus = 'running' | 'done' | 'error'

export interface StepLabelOverrides {
  running?: string
  done?: string
}

/**
 * The line shown for one tool call.
 * Overrides win; otherwise the leading verb is conjugated ("Searching restaurants" / "Searched restaurants"),
 * and unknown verbs fall back to the humanised name ("Fetch menu…" is never invented).
 */
export function stepText(name: string, status: StepStatus, overrides?: StepLabelOverrides): string {
  if (status === 'running' && overrides?.running) return overrides.running
  if (status !== 'running' && overrides?.done) return overrides.done
  const words = toolWords(name)
  if (words.length === 0) return status === 'running' ? 'Working…' : 'Done'
  const known = GERUND[words[0]]
  if (!known) {
    const base = humanizeToolName(name)
    return status === 'running' ? `${base}…` : base
  }
  const rest = words.slice(1).join(' ')
  const verb = status === 'running' ? known[0] : known[1]
  return rest ? `${verb} ${rest}` : verb
}

function dataOf(result: unknown): unknown {
  const parts = (result as { parts?: Array<{ part_type?: string; data?: unknown }> } | undefined)?.parts
  if (!Array.isArray(parts)) return undefined
  for (const p of parts) {
    if (p?.part_type === 'data' && p.data != null) return p.data
  }
  return undefined
}

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`
}

/** "3 results" when the tool result carries a list or a count; otherwise nothing (never raw JSON). */
export function summarizeResult(result: unknown): string | undefined {
  const data = dataOf(result)
  if (Array.isArray(data)) return plural(data.length, 'result')
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    for (const key of ['count', 'total', 'total_count']) {
      const v = obj[key]
      if (typeof v === 'number' && Number.isFinite(v)) return plural(v, 'result')
    }
    const lists = Object.entries(obj).filter(([, v]) => Array.isArray(v)) as Array<[string, unknown[]]>
    if (lists.length === 1) {
      const [key, list] = lists[0]
      const singular = key.replace(/_/g, ' ').replace(/s$/, '')
      return plural(list.length, singular || 'result')
    }
  }
  return undefined
}

/** Compact "key: value" lines for the `detailed` view. Long or nested values are trimmed. */
export function describeArguments(input: unknown, maxValue = 80): Array<[string, string]> {
  if (!input || typeof input !== 'object') return []
  return Object.entries(input as Record<string, unknown>)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .slice(0, 8)
    .map(([k, v]) => {
      const raw = typeof v === 'string' ? v : JSON.stringify(v)
      const value = raw.length > maxValue ? `${raw.slice(0, maxValue)}…` : raw
      return [k.replace(/_/g, ' '), value] as [string, string]
    })
}

/** Distri's own plumbing tools. A guest never needs to see them; `toolActivity: 'detailed'` still does. */
const INTERNAL_TOOLS = new Set(['tool_search', 'final', 'load_skill', 'invoke_agent', 'get_task', 'wait_task', 'cancel_task', 'write_todos', 'todos', 'transfer_to_agent'])
export const isInternalTool = (name: string): boolean => INTERNAL_TOOLS.has(name)
