import type { ToolCallState } from '@distri/react';

const now = Date.now();

export const mockStates: Record<string, ToolCallState> = {
  httpSuccess: {
    tool_call_id: 'tc-1',
    tool_name: 'distri_request',
    input: { method: 'GET', path: '/public/skills/zippy/grade' },
    status: 'completed',
    startTime: now - 200,
    endTime: now,
    result: {
      tool_call_id: 'tc-1',
      tool_name: 'distri_request',
      parts: [{ part_type: 'text' as const, data: '{"skills": ["grade", "feedback"]}' }],
    },
  },
  httpError: {
    tool_call_id: 'tc-2',
    tool_name: 'distri_request',
    input: { method: 'POST', path: '/api/sessions' },
    status: 'error',
    startTime: now - 100,
    endTime: now,
    error: 'Missing bearer token',
    result: undefined,
  },
  fileRead: {
    tool_call_id: 'tc-3',
    tool_name: 'read_file',
    input: { path: 'src/client_config.rs' },
    status: 'completed',
    startTime: now - 1100,
    endTime: now,
    result: {
      tool_call_id: 'tc-3',
      tool_name: 'read_file',
      parts: [{ part_type: 'text' as const, data: 'pub struct ClientConfig {\n    pub base_url: String,\n    pub api_key: Option<String>,\n}\n' }],
    },
  },
  fileEdit: {
    tool_call_id: 'tc-4',
    tool_name: 'edit_file',
    input: { path: 'Cargo.toml' },
    status: 'completed',
    startTime: now - 800,
    endTime: now,
    result: {
      tool_call_id: 'tc-4',
      tool_name: 'edit_file',
      parts: [{ part_type: 'text' as const, data: '--- a/Cargo.toml\n+++ b/Cargo.toml\n@@ -1,5 +1,7 @@\n+distri-types = { workspace = true }\n+serde = { workspace = true }\n-proxy_url: Option<String>\n-is_sandbox_mode: bool\n' }],
    },
  },
  searchResult: {
    tool_call_id: 'tc-5',
    tool_name: 'search',
    input: { query: 'bearer token' },
    status: 'completed',
    startTime: now - 300,
    endTime: now,
    result: {
      tool_call_id: 'tc-5',
      tool_name: 'search',
      parts: [{ part_type: 'text' as const, data: 'src/auth.rs:12: let token = bearer_token;\nsrc/client.rs:45: Authorization: bearer_token\nsrc/config.rs:88: // bearer token config\n' }],
    },
  },
  running: {
    tool_call_id: 'tc-6',
    tool_name: 'execute_shell',
    input: { command: 'cargo build --release' },
    status: 'running',
    startTime: now - 3200,
  },
};
