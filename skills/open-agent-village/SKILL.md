---
name: open-agent-village
description: Open the Agent Crossing (에이전트의 숲) 2.5D sidecar or standalone village monitor to supervise Antigravity, Claude Code, Cursor, and Codex agents with zero extra LLM tokens.
---

# Agent Crossing (에이전트의 숲)

When the user asks to monitor their active coding agents across projects, inspect subagent progress, or open the **Agent Crossing** visualizer:

- In **Antigravity IDE**, present the sidecar and plugin links:
  - Open Sidecar Panel: `[Agent Crossing](sidecar://agent-village/village/)`
  - Plugin Settings: `[Agent Crossing Plugin](customization://agent-village)`
- In **standalone / CLI / Claude Code / Cursor / Codex** environments, run or share:
  - `npx agent-crossing --open` (or `npm run open` inside the repository) -> `http://127.0.0.1:4777`

Agent Crossing consumes **0 extra LLM tokens** and operates strictly read-only over local IDE/CLI session files.
