

```
| **`type` (snake\_case)** | **UI Interaction **                                               |
| ------------------------ | ----------------------------------------------------------------- |
| `run_started`            | Show “Agent is starting…” (spinner or subtle system message)      |
| `plan_started`           | Show “💡 Planning…” step bubble (only if `initial_plan: true`)     |
| `plan_finished`          | Display “Plan ready: n steps” with summary preview                |
| `plan_pruned`            | Show “Removed steps: …” as tooltip or system note                 |
| `step_started`           | Begin a new step card: title (from `step_title`) + spinner        |
| `tool_execution_start`   | Inside step: show “Calling tool: {tool\_name} ⏳”                  |
| `tool_execution_end`     | Update to “Tool complete ✅” or “⚠️ Tool failed”                    |
| `tool_rejected`          | Show rejection bubble: “Tool rejected – reason: …”                |
| `step_completed`         | Mark step as completed ✅ or errored ❌                             |
| `text_message_start`     | Start assistant bubble with “typing” indicator                    |
| `text_message_content`   | Append content to bubble as it streams                            |
| `text_message_end`       | Finalize assistant bubble                                         |
| `artifact`               | Show expandable artifact block (e.g., result JSON or output view) |
| `agent_handover`         | Show “Handover to: {agent}” bubble or system message              |
| `feedback_received`      | Display user feedback card: “You said: …”                         |
| `run_finished`           | Show final message like “✅ Done”                                  |
| `run_error`              | Display error bubble with retry suggestion                        |
```