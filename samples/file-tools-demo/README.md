# Distri File Tools Demo

This Vite app demonstrates how to combine the `distrifs-js` workspace component with the generated filesystem tools and optional chat workflow.

## Getting started

```bash
pnpm install
pnpm dev
```

By default the page renders the workspace-only experience backed by IndexedDB. To enable the chat widget that drives filesystem tools and the script runner, provide:

```bash
export VITE_DISTRI_API_URL="http://localhost:8080/api/v1"
export VITE_DISTRI_AGENT_ID="workspace_agent"
```

With those variables in place the demo renders `FileWorkspace` with custom panels on both sides (notes on the left, chat + testing on the right), wiring the generated filesystem tools (and the embedded script runner UI tool) into the Distri agent workflow.
