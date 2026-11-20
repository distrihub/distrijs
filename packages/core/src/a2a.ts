/**
 * A2A 1.0 on the wire, and distri's A2A extensions.
 *
 * distri speaks plain A2A 1.0 (method names `SendMessage`, `SendStreamingMessage`,
 * …; `ROLE_*` / `TASK_STATE_*` enums; ISO-8601 timestamps; field-presence parts
 * `{text}` / `{url|raw}` / `{data}`; stream frames `{task}` / `{message}` /
 * `{statusUpdate}` / `{artifactUpdate}`). Everything distri adds is an A2A
 * extension, used only when the client activates it with the `A2A-Extensions`
 * request header; the server echoes the activated set back in the same header.
 *
 * Inside the client the A2A objects keep the `kind`-tagged shape of the
 * `@a2a-js/sdk` types (`{kind:'message', role:'agent', parts:[{kind:'text'}]}`),
 * so the decoders and the stores built on them are unchanged. This module is
 * the boundary: {@link toWireSendParams} encodes outgoing 1.0, {@link fromWire}
 * normalizes incoming 1.0 (and still accepts the 0.x shapes).
 *
 * Contract: distri-cloud docs/specs/2026-11-20-a2a-wire-contract.md and
 * distri `docs/a2a-extensions/*.md`.
 */
import type { Message, MessageSendParams, Part, Task, TaskStatusUpdateEvent, TaskArtifactUpdateEvent } from '@a2a-js/sdk';

// ---------------------------------------------------------------------------
// Protocol
// ---------------------------------------------------------------------------

/** A2A protocol version this client speaks (`A2A-Version` header). */
export const A2A_VERSION = '1.0';
export const A2A_VERSION_HEADER = 'A2A-Version';
/** Request: extensions the client activates. Response: the ones the server activated. */
export const A2A_EXTENSIONS_HEADER = 'A2A-Extensions';

/** A2A 1.0 JSON-RPC method names. */
export const A2A_METHODS = {
  SEND_MESSAGE: 'SendMessage',
  SEND_STREAMING_MESSAGE: 'SendStreamingMessage',
  GET_TASK: 'GetTask',
  LIST_TASKS: 'ListTasks',
  CANCEL_TASK: 'CancelTask',
  SUBSCRIBE_TO_TASK: 'SubscribeToTask',
  GET_EXTENDED_AGENT_CARD: 'GetExtendedAgentCard',
} as const;

/** `Part.metadata` key naming a distri part kind carried as a DataPart. */
export const PART_TYPE_KEY = 'distri/part_type';

/** Distri part kinds A2A has no type for; they travel as DataParts. */
const DISTRI_DATA_PART_TYPES = new Set(['tool_call', 'tool_result', 'artifact', 'resource_link']);

// ---------------------------------------------------------------------------
// Extensions
// ---------------------------------------------------------------------------

export const DISTRI_EXTENSION_URI_PREFIX = 'https://distri.dev/a2a/extensions/';

/** distri's activatable A2A extensions (`https://distri.dev/a2a/extensions/<name>/v1`). */
export type DistriExtensionName =
  | 'client-tools'
  | 'durable-runs'
  | 'event-stream'
  | 'hooks'
  | 'run-config'
  | 'context'
  | 'mcp-apps'
  | 'browser'
  | 'observability'
  | 'channels';

export const DISTRI_EXTENSIONS: readonly DistriExtensionName[] = [
  'client-tools',
  'durable-runs',
  'event-stream',
  'hooks',
  'run-config',
  'context',
  'mcp-apps',
  'browser',
  'observability',
  'channels',
];

/** `https://distri.dev/a2a/extensions/<name>/v1`. */
export function extensionUri(name: DistriExtensionName): string {
  return `${DISTRI_EXTENSION_URI_PREFIX}${name}/v1`;
}

/** The `agent` descriptor extension on every card (declarative, never activated). */
export const AGENT_EXTENSION_URI = `${DISTRI_EXTENSION_URI_PREFIX}agent/v1`;

/**
 * Extensions this client activates on every A2A call by default: it renders
 * the full event stream, runs client tools (durably when the server can),
 * answers hooks, and shows context, MCP-Apps and browser events. `run-config`
 * and `observability` are added per request when it sends their metadata keys
 * (see {@link extensionsForMetadata}); `channels` is server-side only.
 */
export const DEFAULT_CLIENT_EXTENSIONS: readonly DistriExtensionName[] = [
  'event-stream',
  'client-tools',
  'durable-runs',
  'hooks',
  'context',
  'mcp-apps',
  'browser',
];

/** The extension a request-metadata key belongs to (mirrors `DistriExtension::for_metadata_key`). */
export function extensionForMetadataKey(key: string): DistriExtensionName | undefined {
  switch (key) {
    case 'external_tools':
    case 'runtime_mode':
    case 'tool_metadata':
      return 'client-tools';
    case 'dynamic_values':
    case 'dynamic_sections':
      return 'hooks';
    case 'definition_overrides':
    case 'load_skills':
    case 'env_vars':
    case 'dry_run':
    case 'is_sandbox':
    case 'additional_attributes':
      return 'run-config';
    case 'browser_session_id':
      return 'browser';
    case 'tags':
    case 'trace_context':
      return 'observability';
    default:
      return undefined;
  }
}

/** Extensions implied by the distri keys present in request metadata. */
export function extensionsForMetadata(metadata: Record<string, unknown> | undefined | null): DistriExtensionName[] {
  if (!metadata || typeof metadata !== 'object') return [];
  const out = new Set<DistriExtensionName>();
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined) continue;
    const ext = extensionForMetadataKey(key);
    if (ext) out.add(ext);
  }
  return [...out];
}

/**
 * The URIs to activate for one request: the configured set, plus what the
 * request's metadata needs, plus requirements (`durable-runs` needs
 * `client-tools`). Entries may be short names or full URIs (other parties'
 * extensions pass through).
 */
export function resolveExtensions(
  configured: readonly string[],
  metadata?: Record<string, unknown> | null,
): string[] {
  const uris: string[] = [];
  const add = (u: string) => { if (!uris.includes(u)) uris.push(u); };
  const toUri = (e: string) => ((DISTRI_EXTENSIONS as readonly string[]).includes(e) ? extensionUri(e as DistriExtensionName) : e);
  for (const e of configured) add(toUri(e));
  for (const e of extensionsForMetadata(metadata)) add(extensionUri(e));
  if (uris.includes(extensionUri('durable-runs'))) add(extensionUri('client-tools'));
  return uris;
}

/** Parse `A2A-Extensions` values (comma-separated and/or repeated). */
export function parseExtensionsHeader(value: string | null | undefined): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const raw of value.split(',')) {
    const v = raw.trim();
    if (v && !out.includes(v)) out.push(v);
  }
  return out;
}

/** Whether `uris` (activated or echoed) include the distri extension `name`. */
export function hasExtension(uris: readonly string[], name: DistriExtensionName): boolean {
  return uris.includes(extensionUri(name));
}

// ---------------------------------------------------------------------------
// Agent card (1.0) and the `agent` descriptor
// ---------------------------------------------------------------------------

export interface A2AAgentExtension {
  uri: string;
  description?: string;
  required?: boolean;
  params?: Record<string, unknown>;
}

export interface A2AAgentInterface {
  url: string;
  protocolBinding: string;
  protocolVersion: string;
  tenant?: string;
}

export interface A2AAgentSkill {
  id: string;
  name: string;
  description: string;
  tags?: string[];
  examples?: string[];
  inputModes?: string[];
  outputModes?: string[];
}

/**
 * An A2A 1.0 agent card (`GET /agents/{name}/.well-known/agent-card.json`).
 * `url` / `protocolVersion` are the 0.x places for what 1.0 keeps in
 * `supportedInterfaces[0]`; they are optional and only read as a fallback.
 */
export interface AgentCard {
  name: string;
  description?: string;
  version?: string;
  supportedInterfaces?: A2AAgentInterface[];
  capabilities?: {
    streaming?: boolean;
    pushNotifications?: boolean;
    extensions?: A2AAgentExtension[];
    extendedAgentCard?: boolean;
  };
  defaultInputModes?: string[];
  defaultOutputModes?: string[];
  skills?: A2AAgentSkill[];
  provider?: { organization: string; url: string };
  documentationUrl?: string;
  iconUrl?: string;
  /** @deprecated 0.x; use `supportedInterfaces[0].url`. */
  url?: string;
  /** @deprecated 0.x; use `supportedInterfaces[0].protocolVersion`. */
  protocolVersion?: string;
  [key: string]: unknown;
}

/**
 * `params` of the card's `agent` extension: what a client needs to *use*
 * the agent. Never instructions, tool internals, MCP, model or connections.
 */
export interface AgentDescriptor {
  /** `standard_agent` or `workflow_agent`. */
  agent_type: string;
  /** Client (external) tool names the agent expects (`"*"` excluded). */
  external_tools: string[];
  /** The agent accepts any client tool (`tools.external = ["*"]`). */
  any_tool: boolean;
  /** `web`, `server` or `cli`; absent when unset. */
  runtime?: string;
  /** The agent streams a browser session. */
  browser_streaming: boolean;
  /** Saved version number (hosts that version agents). */
  version_no?: number;
}

/** A card's extension entry by URI. */
export function cardExtension(card: unknown, uri: string): A2AAgentExtension | undefined {
  if (!card || typeof card !== 'object') return undefined;
  const caps = (card as { capabilities?: unknown }).capabilities;
  const exts = caps && typeof caps === 'object' ? (caps as { extensions?: unknown }).extensions : undefined;
  if (!Array.isArray(exts)) return undefined;
  return exts.find((e): e is A2AAgentExtension => !!e && typeof e === 'object' && (e as { uri?: unknown }).uri === uri);
}

/** The `agent` descriptor from a card; `null` when the card has none (older server). */
export function agentDescriptorFromCard(card: unknown): AgentDescriptor | null {
  const params = cardExtension(card, AGENT_EXTENSION_URI)?.params;
  if (!params || typeof params !== 'object') return null;
  const p = params as Record<string, unknown>;
  const tools = Array.isArray(p.external_tools)
    ? p.external_tools.filter((t): t is string => typeof t === 'string' && t.trim().length > 0 && t !== '*')
    : [];
  return {
    agent_type: typeof p.agent_type === 'string' ? p.agent_type : 'standard_agent',
    external_tools: tools,
    any_tool: p.any_tool === true,
    ...(typeof p.runtime === 'string' ? { runtime: p.runtime } : {}),
    browser_streaming: p.browser_streaming === true,
    ...(typeof p.version_no === 'number' ? { version_no: p.version_no } : {}),
  };
}

// ---------------------------------------------------------------------------
// Enums and timestamps
// ---------------------------------------------------------------------------

/** Internal (0.x) task state names. */
export type TaskStateName =
  | 'submitted'
  | 'working'
  | 'completed'
  | 'failed'
  | 'canceled'
  | 'input-required'
  | 'auth-required'
  | 'rejected'
  | 'unknown';

/** `TASK_STATE_COMPLETED` / `completed` / `inputRequired` … → internal name. */
export function normalizeTaskState(state: unknown): TaskStateName {
  if (typeof state === 'number') {
    return (['unknown', 'submitted', 'working', 'completed', 'failed', 'canceled', 'input-required', 'rejected', 'auth-required'] as const)[state] ?? 'unknown';
  }
  if (typeof state !== 'string') return 'unknown';
  const s = state.replace(/^TASK_STATE_/, '').toLowerCase().replace(/_/g, '-');
  switch (s) {
    case 'submitted':
    case 'working':
    case 'completed':
    case 'failed':
    case 'rejected':
      return s;
    case 'canceled':
    case 'cancelled':
      return 'canceled';
    case 'input-required':
    case 'inputrequired':
      return 'input-required';
    case 'auth-required':
    case 'authrequired':
      return 'auth-required';
    default:
      return 'unknown';
  }
}

/** Internal state name → `TASK_STATE_*`. */
export function toWireTaskState(state: string): string {
  if (state.startsWith('TASK_STATE_')) return state;
  const n = normalizeTaskState(state);
  return n === 'unknown' ? 'TASK_STATE_UNSPECIFIED' : `TASK_STATE_${n.replace(/-/g, '_').toUpperCase()}`;
}

/** `ROLE_AGENT` / `agent` → `agent`; anything else is `user`. */
export function normalizeRole(role: unknown): 'agent' | 'user' {
  return role === 'ROLE_AGENT' || role === 'agent' || role === 2 ? 'agent' : 'user';
}

export function toWireRole(role: unknown): 'ROLE_AGENT' | 'ROLE_USER' {
  return normalizeRole(role) === 'agent' ? 'ROLE_AGENT' : 'ROLE_USER';
}

/**
 * An A2A timestamp as epoch milliseconds: ISO-8601 (1.0), or epoch
 * milliseconds as a number or numeric string (0.x). `undefined` when absent
 * or unparseable.
 */
export function parseA2ATimestamp(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value !== 'string' || !value.trim()) return undefined;
  if (/^-?\d+$/.test(value.trim())) return Number(value.trim());
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : undefined;
}

// ---------------------------------------------------------------------------
// Parts
// ---------------------------------------------------------------------------

type Json = Record<string, unknown>;
const isObj = (v: unknown): v is Json => !!v && typeof v === 'object' && !Array.isArray(v);

/** A 1.0 part (field presence). */
export type A2AWirePart = (
  | { text: string }
  | { url: string }
  | { raw: string }
  | { data: unknown }
) & { mediaType?: string; filename?: string; metadata?: Json };

/** An internal part, or a 1.0 one, → 1.0 part. Distri kinds become DataPart + `metadata["distri/part_type"]`. */
export function toWirePart(part: unknown): A2AWirePart {
  if (!isObj(part)) return { text: String(part ?? '') };
  const metadata = isObj(part.metadata) ? { ...part.metadata } : undefined;
  const withMeta = <T extends Json>(p: T, extra?: Json): T => {
    const meta = { ...(metadata ?? {}), ...(extra ?? {}) };
    return (Object.keys(meta).length > 0 ? { ...p, metadata: meta } : p) as T;
  };
  const kind = part.kind;
  if (kind === 'text' || (kind === undefined && typeof part.text === 'string')) {
    return withMeta({ text: String(part.text ?? '') }) as A2AWirePart;
  }
  if (kind === 'file' || (kind === undefined && isObj(part.file))) {
    const file = (part.file ?? {}) as Json;
    const base: Json = typeof file.uri === 'string' ? { url: file.uri } : { raw: String(file.bytes ?? '') };
    if (typeof file.mimeType === 'string') base.mediaType = file.mimeType;
    if (typeof file.name === 'string') base.filename = file.name;
    return withMeta(base) as A2AWirePart;
  }
  if (kind === undefined && (typeof part.url === 'string' || typeof part.raw === 'string')) {
    const rest: Json = { ...part };
    delete rest.kind;
    return rest as A2AWirePart;
  }
  if (kind === 'data' || 'data' in part) {
    const data = part.data;
    const typed = metadata?.[PART_TYPE_KEY];
    if (typeof typed !== 'string' && isLegacyWrapper(data)) {
      // 0.x `{part_type, data}` wrapper → DataPart + metadata.
      return withMeta({ data: data.data }, { [PART_TYPE_KEY]: data.part_type });
    }
    return withMeta({ data }) as A2AWirePart;
  }
  return { data: part };
}

/** The 0.x `{part_type, data}` DataPart wrapper for a distri kind. */
function isLegacyWrapper(data: unknown): data is { part_type: string; data: unknown } {
  return isObj(data)
    && Object.keys(data).length === 2
    && 'data' in data
    && typeof data.part_type === 'string'
    && DISTRI_DATA_PART_TYPES.has(data.part_type);
}

/** A 1.0 (or 0.x) part → internal `kind`-tagged part (metadata kept). */
export function fromWirePart(part: unknown): Part {
  if (!isObj(part)) return { kind: 'text', text: String(part ?? '') };
  if (typeof part.kind === 'string') return part as unknown as Part;
  const metadata = isObj(part.metadata) ? part.metadata : undefined;
  const meta = metadata ? { metadata } : {};
  if (typeof part.text === 'string') return { kind: 'text', text: part.text, ...meta };
  const mimeType = typeof part.mediaType === 'string' ? part.mediaType
    : typeof part.media_type === 'string' ? part.media_type : undefined;
  const name = typeof part.filename === 'string' ? part.filename : undefined;
  if (typeof part.url === 'string') {
    return { kind: 'file', file: { uri: part.url, ...(mimeType ? { mimeType } : {}), ...(name ? { name } : {}) }, ...meta };
  }
  if (typeof part.raw === 'string') {
    return { kind: 'file', file: { bytes: part.raw, ...(mimeType ? { mimeType } : {}), ...(name ? { name } : {}) }, ...meta };
  }
  const dataPart: Json = { kind: 'data', data: 'data' in part ? part.data : part, ...meta };
  return dataPart as unknown as Part;
}

// ---------------------------------------------------------------------------
// Messages and requests (outgoing)
// ---------------------------------------------------------------------------

export interface A2AWireMessage {
  messageId: string;
  contextId?: string;
  taskId?: string;
  role: 'ROLE_USER' | 'ROLE_AGENT';
  parts: A2AWirePart[];
  metadata?: Json;
  extensions?: string[];
  referenceTaskIds?: string[];
}

/** An internal (or 1.0) message → 1.0 message. */
export function toWireMessage(message: Message | Json): A2AWireMessage {
  const m = message as Json;
  const out: A2AWireMessage = {
    messageId: String(m.messageId ?? ''),
    role: toWireRole(m.role),
    parts: Array.isArray(m.parts) ? m.parts.map(toWirePart) : [],
  };
  if (typeof m.contextId === 'string' && m.contextId) out.contextId = m.contextId;
  if (typeof m.taskId === 'string' && m.taskId) out.taskId = m.taskId;
  if (isObj(m.metadata)) out.metadata = m.metadata;
  if (Array.isArray(m.extensions) && m.extensions.length) out.extensions = m.extensions as string[];
  if (Array.isArray(m.referenceTaskIds) && m.referenceTaskIds.length) out.referenceTaskIds = m.referenceTaskIds as string[];
  return out;
}

/** `MessageSendParams` → 1.0 `SendMessageRequest` params. */
export function toWireSendParams(params: MessageSendParams | Json): Json {
  const p = params as Json;
  const out: Json = { message: toWireMessage((p.message ?? {}) as Json) };
  if (isObj(p.configuration)) {
    const c = p.configuration;
    const cfg: Json = {};
    if (Array.isArray(c.acceptedOutputModes) && c.acceptedOutputModes.length) cfg.acceptedOutputModes = c.acceptedOutputModes;
    if (typeof c.blocking === 'boolean') cfg.blocking = c.blocking;
    if (typeof c.historyLength === 'number') cfg.historyLength = c.historyLength;
    if (isObj(c.pushNotificationConfig)) cfg.pushNotificationConfig = c.pushNotificationConfig;
    if (Object.keys(cfg).length) out.configuration = cfg;
  }
  if (isObj(p.metadata)) out.metadata = p.metadata;
  return out;
}

// ---------------------------------------------------------------------------
// Incoming: normalize 1.0 objects to the internal kind-tagged shapes
// ---------------------------------------------------------------------------

/** A decoded stream frame in the internal shape. */
export type A2AStreamFrame = Message | Task | TaskStatusUpdateEvent | TaskArtifactUpdateEvent;

function normalizeMessage(m: Json): Message {
  const message: Json = {
    ...m,
    kind: 'message',
    messageId: String(m.messageId ?? ''),
    role: normalizeRole(m.role),
    parts: Array.isArray(m.parts) ? m.parts.map(fromWirePart) : [],
  };
  return message as unknown as Message;
}

function normalizeStatus(s: unknown): Json {
  const status = isObj(s) ? s : {};
  const out: Json = { ...status, state: normalizeTaskState(status.state) };
  if (isObj(status.message)) out.message = normalizeMessage(status.message);
  if (typeof status.timestamp === 'number') out.timestamp = new Date(status.timestamp).toISOString();
  return out;
}

function normalizeArtifact(a: unknown): Json {
  const art = isObj(a) ? a : {};
  return { ...art, parts: Array.isArray(art.parts) ? art.parts.map(fromWirePart) : [] };
}

function normalizeTask(t: Json): Task {
  return {
    ...(t as object),
    kind: 'task',
    status: normalizeStatus(t.status),
    ...(Array.isArray(t.history) ? { history: t.history.map((m) => normalizeMessage(m as Json)) } : {}),
    ...(Array.isArray(t.artifacts) ? { artifacts: t.artifacts.map(normalizeArtifact) } : {}),
  } as unknown as Task;
}

function normalizeStatusUpdate(u: Json): TaskStatusUpdateEvent {
  const status = normalizeStatus(u.status);
  const metadata = isObj(u.metadata) ? u.metadata : undefined;
  const state = status.state as TaskStateName;
  // 1.0 has no `final`: the event-stream envelope marks the root's end; a
  // standard stream's terminal / interrupted state ends it.
  const final = typeof u.final === 'boolean'
    ? u.final
    : metadata
      ? metadata.final === true
      : ['completed', 'failed', 'canceled', 'rejected', 'auth-required', 'input-required'].includes(state);
  return { ...(u as object), kind: 'status-update', status, final } as unknown as TaskStatusUpdateEvent;
}

function normalizeArtifactUpdate(u: Json): TaskArtifactUpdateEvent {
  return { ...(u as object), kind: 'artifact-update', artifact: normalizeArtifact(u.artifact) } as unknown as TaskArtifactUpdateEvent;
}

/**
 * A 1.0 `StreamResponse` (`{task}` / `{message}` / `{statusUpdate}` /
 * `{artifactUpdate}`) or a 0.x `kind`-tagged object → internal frame.
 * `null` for anything else.
 */
export function fromWire(frame: unknown): A2AStreamFrame | null {
  if (!isObj(frame)) return null;
  if (isObj(frame.statusUpdate)) return normalizeStatusUpdate(frame.statusUpdate);
  if (isObj(frame.artifactUpdate)) return normalizeArtifactUpdate(frame.artifactUpdate);
  if (isObj(frame.message) && !('kind' in frame) && !('status' in frame)) return normalizeMessage(frame.message);
  if (isObj(frame.task) && !('kind' in frame)) return normalizeTask(frame.task);
  switch (frame.kind) {
    case 'message': return normalizeMessage(frame);
    case 'status-update': return normalizeStatusUpdate(frame);
    case 'artifact-update': return normalizeArtifactUpdate(frame);
    case 'task': return normalizeTask(frame);
    default:
      // Bare 1.0 objects (no wrapper key), as some history endpoints return.
      if (typeof frame.messageId === 'string' && Array.isArray(frame.parts)) return normalizeMessage(frame);
      if (typeof frame.taskId === 'string' && isObj(frame.status)) return normalizeStatusUpdate(frame);
      return null;
  }
}

/** `SendMessage` result (`{task}` / `{message}`, or a bare 0.x object) → internal Task / Message. */
export function fromWireSendResult(result: unknown): Message | Task {
  const frame = fromWire(result);
  if (frame && (frame.kind === 'message' || frame.kind === 'task')) return frame;
  if (isObj(result) && 'status' in result) return normalizeTask(result);
  return normalizeMessage(isObj(result) ? result : {});
}
