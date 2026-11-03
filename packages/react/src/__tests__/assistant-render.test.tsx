import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest'
import { render, cleanup, waitFor, act, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { Assistant } from '../assistant'
import { ToolSteps, UserTurn } from '../assistant/ToolSteps'
import { AssistantRuntimeContext } from '../assistant/context'
import { DistriContext } from '../DistriProvider'

beforeAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window.HTMLElement.prototype as any).scrollIntoView = vi.fn()
})

async function* emptyStream(): AsyncGenerator<never> {}

const client = () =>
  ({
    getThread: vi.fn(async () => null),
    listTasks: vi.fn(async () => []),
    getTaskById: vi.fn(async () => null),
    cancelTask: vi.fn(async () => {}),
  }) as never

function agentWith(invokeStream = vi.fn(async () => emptyStream())) {
  return {
    name: 'nook_concierge',
    getDefinition: () => ({ name: 'nook_concierge' }),
    client: { ensureAccessToken: vi.fn(async () => {}), completeTool: vi.fn(async () => {}) },
    invokeStream,
  }
}

function mount(props: Partial<React.ComponentProps<typeof Assistant>> = {}, agent = agentWith()) {
  const utils = render(
    <DistriContext.Provider value={{ client: client() }}>
      <Assistant agent={agent as never} threadId="t-1" {...props} />
    </DistriContext.Provider>,
  )
  return { ...utils, agent }
}

describe('<Assistant>', () => {
  afterEach(() => cleanup())

  it('carries theme, radius, layout and accent as attributes', () => {
    const { container } = mount({
      defaultOpen: true,
      experience: { theme: 'studio', radius: 'round', layout: 'panel', side: 'left', accent: '#ff6600' },
    })
    const root = container.querySelector('.dui-assistant') as HTMLElement
    expect(root.dataset.theme).toBe('studio')
    expect(root.dataset.radius).toBe('round')
    expect(root.dataset.layout).toBe('panel')
    expect(root.dataset.side).toBe('left')
    expect(root.style.getPropertyValue('--dui-accent')).toBe('#ff6600')
  })

  it('defaults to a closed launcher that opens on click and keeps its shell after closing', async () => {
    const { container } = mount()
    expect(container.querySelector('.dui-shell')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /open/i }))
    await waitFor(() => expect(container.querySelector('.dui-shell')).not.toBeNull())
    expect(container.querySelector('.dui-shell')!.hasAttribute('hidden')).toBe(false)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(container.querySelector('.dui-shell')!.hasAttribute('hidden')).toBe(true)
  })

  it('shows welcome, at most 4 suggestions and the placeholder, and sends a chip as a message', async () => {
    const invoke = vi.fn(async () => emptyStream())
    const { container } = mount(
      {
        defaultOpen: true,
        experience: {
          name: 'Nook',
          welcome: 'Plan your stay.',
          suggestions: ['One', 'Two', 'Three', 'Four', 'Five'],
          placeholder: 'Ask Nook',
        },
      },
      agentWith(invoke),
    )
    expect(await screen.findByText('Plan your stay.')).toBeTruthy()
    expect(container.querySelectorAll('.dui-chip')).toHaveLength(4)
    expect(container.querySelector('[data-placeholder="Ask Nook"]')).not.toBeNull()
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Two' }))
    })
    await waitFor(() => expect(invoke).toHaveBeenCalled())
  })

  it('sends experience.instructions as a dynamic section with every message', async () => {
    const invoke = vi.fn(async () => emptyStream())
    mount(
      { defaultOpen: true, experience: { suggestions: ['Hello there'], instructions: 'Keep it brief.' } },
      agentWith(invoke),
    )
    await act(async () => {
      fireEvent.click(await screen.findByRole('button', { name: 'Hello there' }))
    })
    await waitFor(() => expect(invoke).toHaveBeenCalled())
    const params = invoke.mock.calls[0][0] as { metadata?: { dynamic_sections?: Array<{ key: string; content: string }>; definition_overrides?: Record<string, unknown> } }
    const sections = params.metadata?.dynamic_sections ?? []
    expect(sections).toHaveLength(1)
    expect(sections[0].content).toContain('Keep it brief.')
    // the agent's own instructions are never replaced
    expect(params.metadata?.definition_overrides?.instructions).toBeUndefined()
  })

  it('renders no developer controls', async () => {
    const { container } = mount({ defaultOpen: true })
    await screen.findByText(/How can I help/)
    const html = container.innerHTML
    for (const banned of ['Message will be queued', 'Model:', 'Diagnose', 'Show tool details', 'Waiting for', 'tokens', 'subtask', 'Attach image']) {
      expect(html).not.toContain(banned)
    }
    expect(container.querySelector('select, [role="combobox"]')).toBeNull()
    expect(container.querySelector('[title="Show tool details"], [title="Attach image"]')).toBeNull()
  })

  it('inline layout has no close button and no launcher', () => {
    const { container } = mount({ experience: { layout: 'inline' } })
    expect(container.querySelector('.dui-launcher')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull()
    expect(container.querySelector('.dui-shell')).not.toBeNull()
  })
})

describe('tool activity modes', () => {
  afterEach(() => cleanup())

  const call = { tool_call_id: 'c1', tool_name: 'search_restaurants', input: { city: 'Lisbon', party_size: 2 } }
  const done = {
    tool_call_id: 'c1',
    tool_name: 'search_restaurants',
    input: call.input,
    status: 'completed',
    result: { parts: [{ part_type: 'data', data: [{ n: 1 }, { n: 2 }, { n: 3 }] }] },
  }
  const states = new Map([['c1', done]])

  const show = (toolActivity: 'hidden' | 'steps' | 'detailed', map = states) =>
    render(
      <AssistantRuntimeContext.Provider value={{ toolActivity, toolLabels: {} }}>
        <ToolSteps
          toolCalls={[call] as never}
          toolCallStates={map as never}
          labels={['x']}
          summary="1 step"
          grouped
        >
          <span>RAW CARD</span>
        </ToolSteps>
      </AssistantRuntimeContext.Provider>,
    )

  it('hidden renders nothing', () => {
    const { container } = show('hidden')
    expect(container.innerHTML).toBe('')
  })

  it('steps shows a plain sentence and a count, never JSON or arguments', () => {
    const { container } = show('steps')
    expect(screen.getByText('Searched restaurants')).toBeTruthy()
    expect(screen.getByText('3 results')).toBeTruthy()
    expect(container.textContent).not.toContain('Lisbon')
    expect(container.textContent).not.toContain('{')
    expect(container.querySelector('button')).toBeNull()
    expect(container.textContent).not.toContain('RAW CARD')
  })

  it('detailed reveals arguments and result on demand', () => {
    const { container } = show('detailed')
    expect(container.textContent).not.toContain('Lisbon')
    fireEvent.click(screen.getByRole('button', { expanded: false }))
    expect(container.textContent).toContain('Lisbon')
    expect(container.textContent).toContain('party size')
  })

  it('shows a running step with the running wording', () => {
    show('steps', new Map([['c1', { ...done, status: 'running', result: undefined }]]))
    expect(screen.getByText('Searching restaurants')).toBeTruthy()
  })

  it('keeps the approval card when a call needs the user', () => {
    show('steps', new Map([['c1', { ...done, status: 'user_action_required', result: undefined }]]))
    expect(screen.getByText('RAW CARD')).toBeTruthy()
  })
})

describe('user turn', () => {
  it('renders plain text in a pill', () => {
    const { container } = render(
      <UserTurn message={{ id: '1', role: 'user', created_at: 0, parts: [{ part_type: 'text', data: 'Table for two?' }] } as never} />,
    )
    expect(container.querySelector('.dui-user-pill')!.textContent).toBe('Table for two?')
  })
})

describe('composer placeholder', () => {
  afterEach(() => cleanup())
  it('uses experience.placeholder before and after the first message', async () => {
    const { container } = mount({ defaultOpen: true, experience: { placeholder: 'Ask Nook', suggestions: ['Go'] } })
    await screen.findByRole('button', { name: 'Go' })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    })
    await waitFor(() => expect(container.querySelector('.dui-welcome')).toBeNull())
    expect(container.querySelector('[data-placeholder="Ask Nook"]')).not.toBeNull()
  })
})
