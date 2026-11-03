import { describe, it, expect } from 'vitest'
import {
  resolveExperience,
  sanitizeAccent,
  humanizeAgentName,
  experienceSections,
  EXPERIENCE_DEFAULTS,
  EXPERIENCE_SECTION_KEY,
} from '../assistant/experience'
import { humanizeToolName, stepText, summarizeResult, describeArguments } from '../assistant/humanize'
import { buildAssistantMetadata, readableOn } from '../assistant/Assistant'

describe('resolveExperience', () => {
  it('gives the documented defaults for nothing', () => {
    const e = resolveExperience(undefined, 'nook_concierge')
    expect(e.theme).toBe(EXPERIENCE_DEFAULTS.theme)
    expect(e.radius).toBe('soft')
    expect(e.layout).toBe('launcher')
    expect(e.side).toBe('right')
    expect(e.toolActivity).toBe('steps')
    expect(e.placeholder).toBe('Ask anything')
    expect(e.name).toBe('Nook concierge')
    expect(e.suggestions).toEqual([])
    expect(e.instructions).toBeUndefined()
    expect(e.accent).toBeUndefined()
  })

  it('falls back on unknown enum values and non-objects', () => {
    const e = resolveExperience({ theme: 'neon', radius: 'blob', layout: 'popup', side: 'top', toolActivity: 'all' } as never)
    expect([e.theme, e.radius, e.layout, e.side, e.toolActivity]).toEqual(['paper', 'soft', 'launcher', 'right', 'steps'])
    expect(resolveExperience('nope' as never).theme).toBe('paper')
    expect(resolveExperience(null).layout).toBe('launcher')
  })

  it('clamps lengths and caps suggestions at 4, dropping blanks', () => {
    const e = resolveExperience({
      name: 'x'.repeat(200),
      welcome: 'w'.repeat(1000),
      suggestions: ['a', '  ', 'b', 'c', 'd', 'e', 5 as never, 'f'],
      instructions: 'i'.repeat(9000),
    })
    expect(e.name).toHaveLength(60)
    expect(e.welcome).toHaveLength(280)
    expect(e.suggestions).toEqual(['a', 'b', 'c', 'd'])
    expect(e.instructions).toHaveLength(4000)
  })

  it('keeps tool labels that carry text and drops junk', () => {
    const e = resolveExperience({
      toolLabels: { search_restaurants: { running: 'Searching restaurants', done: 'Found restaurants' }, empty: {}, bad: 3 as never },
    })
    expect(e.toolLabels).toEqual({ search_restaurants: { running: 'Searching restaurants', done: 'Found restaurants' } })
  })

  it('accepts real colours and refuses anything that could escape a declaration', () => {
    expect(sanitizeAccent('#7c5cff')).toBe('#7c5cff')
    expect(sanitizeAccent(' oklch(60% 0.2 280) ')).toBe('oklch(60% 0.2 280)')
    expect(sanitizeAccent('red; background:url(x)')).toBeUndefined()
    expect(sanitizeAccent('url(https://x/y.png)')).toBeUndefined()
    expect(sanitizeAccent(42)).toBeUndefined()
    expect(resolveExperience({ accent: 'red}body{' }).accent).toBeUndefined()
  })

  it('humanises agent ids', () => {
    expect(humanizeAgentName('nook_concierge')).toBe('Nook concierge')
    expect(humanizeAgentName('helpDesk-bot')).toBe('Help desk bot')
    expect(humanizeAgentName(undefined)).toBe('Assistant')
  })
})

describe('humanizer', () => {
  it('turns tool ids into sentences', () => {
    expect(humanizeToolName('search_restaurants')).toBe('Search restaurants')
    expect(humanizeToolName('getOrderStatus')).toBe('Get order status')
    expect(humanizeToolName('mcp__crm__list-contacts')).toBe('List contacts')
  })

  it('conjugates known verbs and keeps unknown names readable', () => {
    expect(stepText('search_restaurants', 'running')).toBe('Searching restaurants')
    expect(stepText('search_restaurants', 'done')).toBe('Searched restaurants')
    expect(stepText('frobnicate_widget', 'running')).toBe('Frobnicate widget…')
    expect(stepText('frobnicate_widget', 'done')).toBe('Frobnicate widget')
  })

  it('prefers host labels per state', () => {
    const o = { running: 'Looking for tables', done: 'Found tables' }
    expect(stepText('x', 'running', o)).toBe('Looking for tables')
    expect(stepText('x', 'done', o)).toBe('Found tables')
  })

  it('summarises results as counts, never JSON', () => {
    const wrap = (data: unknown) => ({ parts: [{ part_type: 'data', data }] })
    expect(summarizeResult(wrap([1, 2, 3]))).toBe('3 results')
    expect(summarizeResult(wrap([1]))).toBe('1 result')
    expect(summarizeResult(wrap({ restaurants: [1, 2] }))).toBe('2 restaurants')
    expect(summarizeResult(wrap({ total: 7 }))).toBe('7 results')
    expect(summarizeResult(wrap({ ok: true }))).toBeUndefined()
    expect(summarizeResult(undefined)).toBeUndefined()
  })

  it('describes arguments for the detailed view', () => {
    expect(describeArguments({ party_size: 2, note: '', city: 'Lisbon' })).toEqual([
      ['party size', '2'],
      ['city', 'Lisbon'],
    ])
  })
})

describe('instructions travel as a dynamic section', () => {
  it('adds exactly one section and keeps the host metadata', async () => {
    const exp = resolveExperience({ instructions: 'Answer in two sentences.' })
    const md = await buildAssistantMetadata(exp, async () => ({
      foo: 1,
      dynamic_sections: [{ key: 'host', content: 'h' }],
    }))
    expect(md.foo).toBe(1)
    expect(md.dynamic_sections).toHaveLength(2)
    expect(md.dynamic_sections![0]).toEqual({ key: 'host', content: 'h' })
    expect(md.dynamic_sections![1].key).toBe(EXPERIENCE_SECTION_KEY)
    expect(md.dynamic_sections![1].content).toContain('Answer in two sentences.')
    expect(md).not.toHaveProperty('definition_overrides')
  })

  it('adds nothing without instructions', async () => {
    expect(experienceSections(resolveExperience({}))).toEqual([])
    expect(await buildAssistantMetadata(resolveExperience({}))).toEqual({})
  })
})

describe('readableOn', () => {
  it('picks dark text on light accents and white on dark', () => {
    expect(readableOn('#ffd54a')).toBe('#16130f')
    expect(readableOn('#4a3ff0')).toBe('#ffffff')
    expect(readableOn('rebeccapurple')).toBeUndefined()
  })
})
