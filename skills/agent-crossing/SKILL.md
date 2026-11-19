---
name: agent-crossing
description: Launch and supervise a cozy 2.5D Animal Crossing village monitor across Antigravity, Claude Code, Cursor, and OpenAI Codex workspaces with zero extra LLM tokens.
---

# Agent Crossing — Universal AI Agent Village Supervisor

Monitor all active main agents and subagents across your repositories in one calm 2.5D island diorama without consuming extra API tokens or interfering with running sessions.

## When to Use

Trigger this skill when the user wants to:
- Watch what multiple parallel agents (Antigravity, Claude Code, Cursor, Codex CLI) are doing across projects
- Check whether long-running subagents or terminal builds finished, are waiting, or hit an error
- Pop out a lightweight desk companion window to supervise agent progress while multitasking

## How It Works (Zero-Token Read-Only Watchers)

- **Antigravity**: Reads `~/.gemini/antigravity/conversation_summaries.db` (read-only SQLite) and `brain/<id>/.system_generated/logs/transcript.jsonl`
- **Claude Code**: Reads `~/.claude/projects/<slug>/*.jsonl` and nested `subagents/*.jsonl`
- **Cursor IDE**: Reads `workspaceStorage/*/state.vscdb` (`composer.composerData`, read-only SQLite) and `~/.cursor/projects/*/agent-transcripts/*.jsonl`
- **OpenAI Codex CLI**: Reads `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`

Sessions sharing the same repository folder path automatically live together as villagers on that repository's island!

## Launching Agent Crossing

1. **Standalone CLI / Universal Agents (Claude Code, Cursor, Codex, Terminal)**:
   ```bash
   npx agent-crossing --open --port 4777
   ```
   Or from the cloned repository:
   ```bash
   npm run open
   ```
2. **Antigravity Sidecar Panel**:
   Install via `npm run install-plugin`, then open `[Agent Crossing](sidecar://agent-village/village/)`.

## Supervisory Features in the UI

- **EN / KO Localization**: Default English UI with instant `EN / KO` switch in the top bar or Help sheet
- **Active Only / Show All Toggle**: Action-oriented filter showing what clicking the button will display
- **Single-Island Focus Mode (`Z`)**: Isolate a single project island to watch every station clearly
- **Hide & Restore Unwanted Islands**: Declutter temporary scratch repos and restore them anytime from the Directory's Hidden Islands section
- **Time-of-Day Lighting**: Cycles smoothly across Auto, Day, Sunset, and Night (warm lit cottage windows & fireflies)
