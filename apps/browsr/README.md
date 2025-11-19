# Browsr UI

This app mirrors the visual language of `distri-ui` but optimizes for building browser bots. Two reference mocks drive the layout:
- Screenshot 2025-11-19 at 2.23.22 PM — goal-first onboarding with a full-width textarea.
- Screenshot 2025-11-19 at 2.25.06 PM — step-focused board with AgentChat pinned on the right.

## Experience outline
1. **Bot goal composer** — giant textbox to describe the bot that should exist. Saving it creates a draft blueprint in `localStorage`.
2. **Step canvas** — pre-created slots for each browser step. Users can add, edit, delete, or reorder steps. Each step surfaces quick actions to open AgentChat for refinements.
3. **AgentChat rail** — right-hand column that proxies to the backend chat provider while keeping context about the selected step.
4. **Local drafts** — everything lives in `localStorage` under a single JSON blob until we add multi-user persistence.
5. **Test Run** — serializes the draft and calls `distri-browser` so we can see live execution output inline.

## TODO
- [ ] Flesh out shared layout primitives (top nav, resizable panes) in parity with `distri-ui`.
- [ ] Implement localStorage-driven stores for bots, steps, and chat threads.
- [ ] Wire AgentChat to the backend and surface logging/trace inspectors on the right column.
- [ ] Attach "Test Run" to a lightweight API route that invokes `distri-browser` with the current bot JSON.
- [ ] Add import/export modals so drafts can be moved around before server sync is ready.
