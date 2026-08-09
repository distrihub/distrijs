/**
 * The lesson plan being written.
 *
 * A ~160-line observable store. Every mutation here is triggered by a tool the
 * agent called (`tools.ts`), and every pixel on the canvas is a projection of
 * this state. That is the whole architecture: **the agent moves state, the UI
 * renders state.** No agent-specific code lives in a component.
 */

export type PlanStatus =
  | 'empty'
  | 'awaiting_approval'
  | 'drafting'
  | 'ready'
  | 'scheduled';

export type QuestionKind = 'multiple_choice' | 'short_answer' | 'open_response';

export interface OutlineBeat {
  name: string;
  minutes: number;
  intent: string;
}

export interface Outline {
  title: string;
  objective: string;
  unitId: string;
  year: string;
  minutes: number;
  beats: OutlineBeat[];
  questionCount: number;
}

export interface Segment {
  id: string;
  name: string;
  minutes: number;
  markdown: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  prompt: string;
  options?: string[];
  answer?: string;
  hint?: string;
  feedback?: string;
  rubric?: string[];
}

export interface LogEntry {
  id: string;
  tool: string;
  detail: string;
  ok: boolean;
}

export interface PlanState {
  status: PlanStatus;
  outline: Outline | null;
  segments: Segment[];
  questions: Question[];
  log: LogEntry[];
  /** Set while a `propose_outline` tool call is parked waiting for a human. */
  awaitingApproval: boolean;
  scheduledIn: string | null;
}

const EMPTY: PlanState = {
  status: 'empty',
  outline: null,
  segments: [],
  questions: [],
  log: [],
  awaitingApproval: false,
  scheduledIn: null,
};

export type ApprovalDecision = { approved: true } | { approved: false; note: string };

let state: PlanState = EMPTY;
let seq = 0;
let approvalResolver: ((decision: ApprovalDecision) => void) | null = null;

const listeners = new Set<() => void>();
const set = (patch: Partial<PlanState>) => {
  state = { ...state, ...patch };
  listeners.forEach((fn) => fn());
};

const nextId = (prefix: string) => `${prefix}-${++seq}`;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Types `markdown` into a segment over ~700ms rather than pasting it.
 *
 * Cosmetic, but it is the beat that makes generation feel alive: the teacher
 * watches the plan take shape instead of watching a spinner. A tool handler is
 * just an async function, so "stream while you work" costs nothing.
 */
async function typeInto(segmentId: string, markdown: string) {
  const CHUNKS = 28;
  const size = Math.ceil(markdown.length / CHUNKS);
  for (let i = size; i < markdown.length; i += size) {
    set({
      segments: state.segments.map((s) =>
        s.id === segmentId ? { ...s, markdown: markdown.slice(0, i) } : s,
      ),
    });
    await sleep(22);
  }
  set({
    segments: state.segments.map((s) => (s.id === segmentId ? { ...s, markdown } : s)),
  });
}

export const planStore = {
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  getSnapshot(): PlanState {
    return state;
  },

  reset() {
    approvalResolver?.({ approved: false, note: 'The plan was reset.' });
    approvalResolver = null;
    state = EMPTY;
    listeners.forEach((fn) => fn());
  },

  log(tool: string, detail: string, ok = true) {
    set({ log: [...state.log, { id: nextId('log'), tool, detail, ok }] });
  },

  /**
   * Parks the tool call until the teacher clicks Approve or Request changes.
   *
   * This is the piece people are usually surprised by: a client-side tool can
   * simply *not resolve* until a human acts. The agent stays blocked on the
   * tool result, so the approval gate needs no special protocol support.
   */
  proposeOutline(outline: Outline): Promise<ApprovalDecision> {
    set({ status: 'awaiting_approval', outline, awaitingApproval: true });
    return new Promise((resolve) => {
      approvalResolver = (decision) => {
        approvalResolver = null;
        set({
          awaitingApproval: false,
          status: decision.approved ? 'drafting' : 'empty',
        });
        resolve(decision);
      };
    });
  },

  resolveApproval(decision: ApprovalDecision) {
    approvalResolver?.(decision);
  },

  async writeSegment(name: string, minutes: number, markdown: string) {
    const segment: Segment = { id: nextId('seg'), name, minutes, markdown: '' };
    set({ status: 'drafting', segments: [...state.segments, segment] });
    await typeInto(segment.id, markdown);
  },

  addQuestion(question: Omit<Question, 'id'>): Question {
    const withId = { ...question, id: nextId('q') };
    set({ questions: [...state.questions, withId] });
    return withId;
  },

  markReady() {
    set({ status: 'ready' });
  },

  markScheduled(unitTitle: string) {
    set({ status: 'scheduled', scheduledIn: unitTitle });
  },
};
