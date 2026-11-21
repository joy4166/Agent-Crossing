---
name: agent-crossing
description: Launch and supervise a cozy 2.5D Animal Crossing village monitor for Google Antigravity workspaces with zero extra LLM tokens.
---

# Agent Crossing — 2.5D Antigravity Multi-Agent Supervisor

Monitor all active main agents and subagents across your Google Antigravity repositories in one calm 2.5D island diorama without consuming extra API tokens or interfering with running sessions.

## When to Use

Trigger this skill when the user wants to:
- Watch what multiple parallel Antigravity agents and subagents are doing across projects
- Check whether long-running subagents or terminal builds finished, are waiting, or hit an error
- Pop out a lightweight desk companion window to supervise agent progress while multitasking

## How It Works (Zero-Token Read-Only Watchers)

- **Antigravity**: Reads `~/.gemini/antigravity/conversation_summaries.db` (read-only SQLite) and `brain/<id>/.system_generated/logs/transcript.jsonl`
- *(Archived experimental adapters for Claude Code, Cursor IDE, and Codex CLI are preserved in `sidecars/village/adapters.mjs` and can be enabled via `--experimental-adapters`.)*

## Launching Agent Crossing

1. **Quick Launch (Zero Clone)**:
   ```bash
   npx agent-crossing --open
   ```
2. **Install Antigravity Sidecar Plugin**:
   ```bash
   npx agent-crossing install
   ```
   Then open `[Agent Crossing](sidecar://agent-village/village/)` in Antigravity's sidecar pane.

## Supervisory Features in the UI

- **EN / KO Localization**: Default English UI with instant `EN / KO` switch in the top bar or Help sheet
- **Active Only / Show All Toggle**: Action-oriented filter showing what clicking the button will display
- **Single-Island Focus Mode (`Z`)**: Isolate a single project island to watch every station clearly
- **Hide & Restore Unwanted Islands**: Declutter temporary scratch repos and restore them anytime from the Directory's Hidden Islands section
- **Time-of-Day Lighting**: Cycles smoothly across Auto, Day, Sunset, and Night (warm lit cottage windows & fireflies)
