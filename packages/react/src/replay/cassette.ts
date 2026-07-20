import { CASSETTE_EVENT_KINDS, type Cassette, type CassetteEvent } from './types';

export class CassetteError extends Error {
  constructor(message: string) {
    super(`Invalid cassette: ${message}`);
    this.name = 'CassetteError';
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateEvent(raw: unknown, index: number): CassetteEvent {
  if (!isRecord(raw)) throw new CassetteError(`event ${index} is not an object`);

  const { kind, t } = raw;
  if (typeof kind !== 'string' || !(CASSETTE_EVENT_KINDS as readonly string[]).includes(kind)) {
    throw new CassetteError(`unknown event kind "${String(kind)}" at event ${index}`);
  }
  if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) {
    throw new CassetteError(`event ${index} (${kind}) needs a non-negative numeric "t"`);
  }

  switch (kind) {
    case 'user_message':
    case 'text_delta':
    case 'reasoning_delta':
      if (typeof raw.text !== 'string') {
        throw new CassetteError(`${kind} at event ${index} needs a string "text"`);
      }
      break;
    case 'tool_call':
      if (typeof raw.id !== 'string' || !raw.id) {
        throw new CassetteError(`tool_call at event ${index} needs a non-empty string "id"`);
      }
      if (typeof raw.name !== 'string' || !raw.name) {
        throw new CassetteError(`tool_call at event ${index} needs a non-empty string "name"`);
      }
      if (!isRecord(raw.args)) {
        throw new CassetteError(`tool_call at event ${index} needs an object "args"`);
      }
      break;
    case 'tool_result':
      if (typeof raw.id !== 'string' || !raw.id) {
        throw new CassetteError(`tool_result at event ${index} needs a non-empty string "id"`);
      }
      if (typeof raw.result !== 'string') {
        throw new CassetteError(`tool_result at event ${index} needs a string "result"`);
      }
      break;
    case 'user_tool_input':
      if (typeof raw.id !== 'string' || !raw.id) {
        throw new CassetteError(`user_tool_input at event ${index} needs a non-empty string "id"`);
      }
      if (typeof raw.response !== 'string') {
        throw new CassetteError(`user_tool_input at event ${index} needs a string "response"`);
      }
      break;
    case 'ui_mutation':
      if (typeof raw.method !== 'string' || !raw.method) {
        throw new CassetteError(`ui_mutation at event ${index} needs a non-empty string "method"`);
      }
      if (!Array.isArray(raw.args)) {
        throw new CassetteError(`ui_mutation at event ${index} needs an array "args"`);
      }
      if (raw.target !== undefined) {
        const target = raw.target;
        const ok =
          typeof target === 'string' ||
          (Array.isArray(target) && target.every((v) => typeof v === 'string'));
        if (!ok) {
          throw new CassetteError(
            `ui_mutation at event ${index} has a "target" that is not a string or string[]`,
          );
        }
      }
      break;
    case 'task_summary':
      if (!isRecord(raw.task) || typeof raw.task.id !== 'string' || !raw.task.id) {
        throw new CassetteError(`task_summary at event ${index} needs a "task" object with a non-empty string "id"`);
      }
      break;
    case 'workflow_step':
      if (!isRecord(raw.step) || typeof raw.step.id !== 'string' || !raw.step.id) {
        throw new CassetteError(`workflow_step at event ${index} needs a "step" object with a non-empty string "id"`);
      }
      break;
    case 'done':
      break;
  }

  return raw as unknown as CassetteEvent;
}

/**
 * Validate an untrusted cassette (imported JSON, hand-authored or exported
 * from a real thread) and narrow it to `Cassette`. Throws `CassetteError`
 * loudly rather than degrading, a broken demo must not silently render an
 * empty chat. This includes `tool_call`/`tool_result` id hygiene: a
 * duplicate `tool_call` id, or a `tool_result` whose `id` has no preceding
 * `tool_call` (e.g. a typo'd id in a hand-authored cassette), both throw
 * here rather than reaching `reducer.ts`, which stays total/pure and would
 * otherwise just silently drop the orphaned `tool_result`, leaving the
 * matching tool card stuck "running" forever with no error anywhere.
 */
export function parseCassette(input: unknown): Cassette {
  if (!isRecord(input)) throw new CassetteError('expected an object');
  if (input.version !== 1) throw new CassetteError(`unsupported version ${String(input.version)} (expected 1)`);
  if (typeof input.id !== 'string' || !input.id) throw new CassetteError('missing "id"');
  if (typeof input.agentId !== 'string' || !input.agentId) throw new CassetteError('missing "agentId"');
  if (typeof input.durationMs !== 'number' || !Number.isFinite(input.durationMs) || input.durationMs <= 0) {
    throw new CassetteError('"durationMs" must be a positive finite number');
  }
  if (!Array.isArray(input.events)) throw new CassetteError('"events" must be an array');

  const events = input.events.map(validateEvent);

  for (let i = 1; i < events.length; i++) {
    if (events[i].t < events[i - 1].t) {
      throw new CassetteError(`events must be sorted by "t" ascending (event ${i} goes backwards)`);
    }
  }

  // A `tool_result`/`user_tool_input` whose `id` doesn't match a preceding
  // `tool_call` (a typo'd id in a hand-authored cassette, most commonly) must
  // fail loudly: silently accepting it leaves the matching tool card stuck
  // "running" forever with no error anywhere, see this function's doc
  // comment. Likewise a duplicate `tool_call` id would make resolution
  // matching ambiguous (which call does it resolve?), reject it at parse time too.
  const seenToolCallIds = new Set<string>();
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (event.kind === 'tool_call') {
      if (seenToolCallIds.has(event.id)) {
        throw new CassetteError(`duplicate tool_call id "${event.id}" at event ${i}`);
      }
      seenToolCallIds.add(event.id);
    } else if (event.kind === 'tool_result') {
      if (!seenToolCallIds.has(event.id)) {
        throw new CassetteError(`tool_result at event ${i} references unknown tool_call id "${event.id}"`);
      }
    } else if (event.kind === 'user_tool_input') {
      if (!seenToolCallIds.has(event.id)) {
        throw new CassetteError(`user_tool_input at event ${i} references unknown tool_call id "${event.id}"`);
      }
    }
  }

  const lastT = events.length ? events[events.length - 1].t : 0;
  if (input.durationMs < lastT) {
    throw new CassetteError(`durationMs (${input.durationMs}) is shorter than the last event t (${lastT})`);
  }

  return {
    version: 1,
    id: input.id,
    agentId: input.agentId,
    durationMs: input.durationMs,
    events,
  };
}
