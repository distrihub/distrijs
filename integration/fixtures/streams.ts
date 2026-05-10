/**
 * Canned SSE event sequences. Each export is the exact list of events
 * a test would replay — keep them realistic (real fields, real shapes)
 * so failures look like real bugs, not synthetic fixture rot.
 */

export const ROOT = 'task-root-int-aaaaaa';
export const FORK1 = 'task-fork1-int-bbbbb';

/**
 * Minimal happy-path: assistant sends a text reply.
 */
export const helloWorldStream = [
  { type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-1' } },
  { type: 'text_message_start', taskId: ROOT, data: { messageId: 'm1' } },
  { type: 'text_message_content', taskId: ROOT, data: { messageId: 'm1', content: 'Hello, world.' } },
  { type: 'text_message_end', taskId: ROOT, data: { messageId: 'm1' } },
  { type: 'run_finished', taskId: ROOT, data: { taskId: ROOT, runId: 'run-1' } },
];

/**
 * Tool flow with a default tool (todo_write).
 * The renderer should pick TodosCompact for this tool.
 */
export const todoWriteStream = [
  { type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-2' } },
  {
    type: 'tool_calls',
    taskId: ROOT,
    data: {
      tool_calls: [{
        tool_call_id: 'tc_todo',
        tool_name: 'todo_write',
        input: { todos: [
          { id: 't1', content: 'do thing', activeForm: 'doing thing', status: 'pending' },
        ] },
      }],
    },
  },
  {
    type: 'tool_results',
    taskId: ROOT,
    data: {
      results: [{ tool_call_id: 'tc_todo', tool_name: 'todo_write', parts: [] }],
    },
  },
  { type: 'run_finished', taskId: ROOT, data: { taskId: ROOT, runId: 'run-2' } },
];

/**
 * ask_follow_up tool — should render the AskFollowUp UI and BLOCK
 * the run until user responds (interactive tool).
 */
export const askFollowUpStream = [
  { type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-3' } },
  {
    type: 'tool_calls',
    taskId: ROOT,
    data: {
      tool_calls: [{
        tool_call_id: 'tc_ask',
        tool_name: 'ask_follow_up',
        input: { question: 'What city?', suggestions: ['Paris', 'Tokyo'] },
      }],
    },
  },
  // Note: NO tool_results and NO run_finished — interactive tools
  // pause the run waiting for user input.
];

/**
 * Fork: parent run dispatches a sub-task via invoke_agent. The
 * sub-task emits its own run_started / run_finished. The parent's
 * stream MUST stay open until the parent's own run_finished arrives.
 */
export const forkStream = [
  { type: 'run_started', taskId: ROOT, data: { taskId: ROOT, runId: 'run-root' } },
  {
    type: 'tool_calls',
    taskId: ROOT,
    data: {
      tool_calls: [{
        tool_call_id: 'tc_invoke',
        tool_name: 'invoke_agent',
        input: { agent: 'helper', task: 'do a thing', mode: 'fork' },
      }],
    },
  },
  // Sub-task lifecycle — emitted on the same SSE stream with parentTaskId.
  { type: 'run_started', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1, runId: 'run-fork-1' } },
  { type: 'text_message_start', taskId: FORK1, parentTaskId: ROOT, data: { messageId: 'm-f1' } },
  { type: 'text_message_content', taskId: FORK1, parentTaskId: ROOT, data: { messageId: 'm-f1', content: 'sub-result' } },
  { type: 'text_message_end', taskId: FORK1, parentTaskId: ROOT, data: { messageId: 'm-f1' } },
  { type: 'run_finished', taskId: FORK1, parentTaskId: ROOT, data: { taskId: FORK1, runId: 'run-fork-1' } },
  // Tool result for the parent's invoke_agent call.
  {
    type: 'tool_results',
    taskId: ROOT,
    data: {
      results: [{ tool_call_id: 'tc_invoke', tool_name: 'invoke_agent', parts: [] }],
    },
  },
  { type: 'run_finished', taskId: ROOT, data: { taskId: ROOT, runId: 'run-root' } },
];
