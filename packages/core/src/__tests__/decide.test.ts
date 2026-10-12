import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DistriClient } from '../distri-client'
import { ApiError } from '../types'

/**
 * DistriClient.decide → POST /decisions (TypeSafe System One wire format).
 * The response fixture is a real llama-server (Kev-0.8B) answer.
 */

const BASE_URL = 'http://localhost:9999/v1'

let fetchMock: ReturnType<typeof vi.fn>
const originalFetch = globalThis.fetch

function makeClient(): DistriClient {
  return new DistriClient({
    baseUrl: BASE_URL,
    headers: { Authorization: 'Bearer test-token' },
    retryAttempts: 0,
  })
}

const KEV_ANSWER = {
  model: 'models/ggml-org-Kev-0.8B-Q8_0.gguf',
  answers: {
    route: {
      type: 'choice',
      choice: 'finance_ops',
      probabilities: { support: 0.0436, finance_ops: 0.9255, research: 0.0292, scheduler: 0.0017 },
      confidence: 0.9007,
    },
    needs_approval: { type: 'noul', noul: 0.4584 },
    urgency: {
      type: 'score',
      score: 1.2458,
      legend: { '0': 'not urgent', '1': 'normal', '2': 'urgent', '3': 'critical' },
      probabilities: { '0': 0.2436, '1': 0.4167, '2': 0.19, '3': 0.1497 },
      confidence: 0.267,
    },
  },
  usage: { input_tokens: 173, output_tokens: 0 },
}

beforeEach(() => {
  fetchMock = vi.fn()
  globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe('DistriClient.decide', () => {
  it('POSTs the request to /decisions and returns typed answers', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(KEV_ANSWER), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )

    const res = await makeClient().decide({
      model: 'custom_llama/kev',
      state: { channel: 'telegram', user_message: 'pull last month invoices from stripe' },
      questions: {
        route: {
          type: 'choice',
          instructions: 'Which agent should handle this message?',
          criteria: { support: null, finance_ops: 'Billing, invoices', research: null, scheduler: null },
        },
        needs_approval: { type: 'noul', instructions: 'Does this need approval?' },
        urgency: { type: 'score', instructions: 'How urgent?', criteria: ['not urgent', 'normal', 'urgent', 'critical'] },
      },
    })

    const [url, init] = fetchMock.mock.calls[0]
    expect(String(url)).toBe(`${BASE_URL}/decisions`)
    expect(init.method).toBe('POST')
    const sent = JSON.parse(init.body as string)
    expect(sent.model).toBe('custom_llama/kev')
    expect(Object.keys(sent.questions)).toEqual(['route', 'needs_approval', 'urgency'])

    // Typed per question: `choice` is narrowed to the option keys.
    const choice: 'support' | 'finance_ops' | 'research' | 'scheduler' = res.answers.route.choice
    expect(choice).toBe('finance_ops')
    expect(res.answers.needs_approval.noul).toBeCloseTo(0.4584)
    expect(res.answers.urgency.legend['0']).toBe('not urgent')
    expect(res.usage.output_tokens).toBe(0)
  })

  it('throws ApiError carrying the server message and status', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ error: 'TypeSafe is not configured. Set TYPESAFE_API_KEY in Settings > Secrets.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      ),
    )

    const err = await makeClient()
      .decide({
        model: 'typesafe/jev-latest',
        state: 'hello',
        questions: { greeting: { type: 'noul', instructions: 'Is this a greeting?' } },
      })
      .catch((e: unknown) => e)

    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).message).toContain('TYPESAFE_API_KEY')
    expect((err as ApiError).statusCode).toBe(400)
  })
})
