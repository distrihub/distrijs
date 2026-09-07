import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { DistriClient, bytesToBase64 } from '../distri-client'
import { ApiError } from '../types'

interface Captured { url: string; init: RequestInit }
let captured: Captured[] = []
let responder: (c: Captured) => Response = () => new Response(null, { status: 204 })
const originalFetch = globalThis.fetch

beforeEach(() => {
  captured = []
  globalThis.fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const c = { url: typeof url === 'string' ? url : url.toString(), init: init ?? {} }
    captured.push(c)
    return responder(c)
  }) as typeof fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

const client = () => new DistriClient({ baseUrl: 'http://distri.test/v1', headers: { 'x-api-key': 'dak_test' } })

describe('DistriClient voice endpoints', () => {
  it('sttToken POSTs to /audio/stt/token and returns the parsed token', async () => {
    const token = { token_id: 'stt_1', provider: 'deepgram', model: 'nova-3', token: 'jwt', expires_at: '2026-09-06T10:41:00Z', single_use: false, connect: { url: 'wss://x' } }
    responder = () => new Response(JSON.stringify(token), { status: 201, headers: { 'Content-Type': 'application/json' } })
    const result = await client().sttToken({ model: 'deepgram/nova-3', language: 'en' })
    expect(result).toEqual(token)
    expect(captured[0].url).toMatch(/\/audio\/stt\/token$/)
    expect(captured[0].init.method).toBe('POST')
    expect(JSON.parse(captured[0].init.body as string)).toEqual({ model: 'deepgram/nova-3', language: 'en' })
  })

  it('sttToken surfaces the server error body as ApiError', async () => {
    responder = () => new Response(JSON.stringify({ error: 'model is not a streaming STT model' }), { status: 400 })
    await expect(client().sttToken({ model: 'openai/whisper-1' })).rejects.toMatchObject({ name: 'ApiError', statusCode: 400, message: 'model is not a streaming STT model' })
  })

  it('sttUsage POSTs a keepalive report and accepts 204', async () => {
    responder = () => new Response(null, { status: 204 })
    await client().sttUsage({ token_id: 'stt_1', audio_ms: 1234.6 })
    expect(captured[0].url).toMatch(/\/audio\/stt\/usage$/)
    expect(captured[0].init.keepalive).toBe(true)
    expect(JSON.parse(captured[0].init.body as string)).toEqual({ token_id: 'stt_1', audio_ms: 1235 })
  })

  it('ttsSpeechStream POSTs stream:true and returns the body plus headers', async () => {
    const bytes = new Uint8Array([1, 2, 3])
    responder = () => new Response(new Blob([bytes]).stream(), {
      status: 200,
      headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Provider': 'openai', 'X-TTS-Model': 'tts-1', 'X-TTS-Voice': 'nova' },
    })
    const result = await client().ttsSpeechStream({ input: 'Hello there.', voice: 'nova' })
    expect(JSON.parse(captured[0].init.body as string)).toEqual({ input: 'Hello there.', voice: 'nova', stream: true })
    expect(result.contentType).toBe('audio/mpeg')
    expect(result.provider).toBe('openai')
    expect(result.model).toBe('tts-1')
    expect(result.voice).toBe('nova')
    const reader = result.body.getReader()
    const { value } = await reader.read()
    expect(Array.from(value!)).toEqual([1, 2, 3])
  })

  it('ttsSpeechStream throws ApiError on non-2xx', async () => {
    responder = () => new Response('provider down', { status: 502 })
    const err = await client().ttsSpeechStream({ input: 'x' }).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err.statusCode).toBe(502)
    expect(err.message).toContain('provider down')
  })
})

describe('bytesToBase64', () => {
  it('encodes large buffers without overflowing the stack', () => {
    const big = new Uint8Array(300_000).map((_, i) => i % 251)
    const encoded = bytesToBase64(big)
    const decoded = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(big)
  })
})
