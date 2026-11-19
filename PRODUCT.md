# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Developers and makers orchestrating parallel AI coding agents across **Google Antigravity**, **Claude Code**, **Cursor**, and **OpenAI Codex CLI** across multiple workspaces — whether supervising via the narrow Antigravity sidecar pane (`390px`) or a standalone pop-out companion window (`960x640`).

## Product Purpose

Provide a calm, legible, zero-overhead 2.5D *Animal Crossing* village view of every active and resting main agent and subagent across all local projects. Lets users track what each agent is doing at a glance, filter by active workspaces or AI tools, focus onto a single island, hide unwanted scratch islands, and jump straight to the underlying workspace folder or Antigravity session.

## Positioning

- **0 Extra LLM Tokens · 0% Agent Latency**: Strictly read-only inspection of existing IDE/CLI artifacts (`conversation_summaries.db` + `transcript.jsonl` for Antigravity; `~/.claude/projects/*/*.jsonl` for Claude Code; `workspaceStorage/*/state.vscdb` + `~/.cursor/projects/*/agent-transcripts/*.jsonl` for Cursor; `~/.codex/sessions/**/rollout-*.jsonl` for Codex CLI).
- **Cross-Tool Island Merging**: Agents working inside the same local repository path share that workspace's island regardless of which IDE or CLI spawned them.

## Operating Context

- Runs as an **Antigravity Sidecar Plugin (`SIDECAR_UI_ENTRYPOINT_AUX_PANE`)** via `sidecars/village/sidecar.json` AND as a **universal standalone local web server / CLI (`bin/agent-crossing.mjs`)** for Cursor, Claude Code, Codex, and browser PiP windows.
- Self-hosted assets (`NanumSquareRound` WOFF2 fonts, `sprites.js`, `i18n.js`, `village.js`, `adapters.mjs`) with zero external network dependencies.

## Capabilities and Constraints

- **True 2.5D Stylized Diorama**: Oblique 2.5D multi-tiered faceted cliff walls, sandy coral reefs, cascading 2-tier waterfalls, Resident Services clock pavilion, three-quarter 2.5D cottages with visible side walls & fenced porches, and 5 animated stations.
- **Bilingual Localization (`EN` / `KO`)**: Full English product out of the box with live `EN / KO` switching persisted in `localStorage`.
- **Supervisory UX Controls**: Action-oriented `Active Only <-> Show All` filter label, Single-Island Focus Mode (`Z`), Exclude/Hide Islands + Restore Accordion, AI source filter pills, and read-only Nook Passport inspector.

## Evidence on Hand

- `package.json`, `plugin.json`, `bin/agent-crossing.mjs`, `sidecars/village/{sidecar.json,adapters.mjs,main.mjs,i18n.js,sprites.js,village.js,index.html,styles.css}`, `skills/{open-agent-village,agent-crossing}/SKILL.md`, `tests/verify-adapters.mjs`, `README.md`, `README.ko.md`.
- Verified read-only multi-agent parsing (`npm test`) covering all 4 ecosystems plus live host Antigravity DB integration.

## Product Principles

1. **Zero Overhead Supervision**: Never burn LLM tokens or lock active agent databases (`{ readOnly: true }`).
2. **Spatial Identity vs. Task Clarity**: Short animal villager personas live on canvas nameplates; cleaned quest topics live on house doorplates and full titles in Nook Passport cards.
3. **Calm Focus Controls**: Users stay in command of noise via Focus Mode, Hide/Restore Islands, Active/All filtering, and real-time Day/Sunset/Night lighting.
4. **Universal Portability**: Runs cleanly across Windows, macOS, and Linux inside Antigravity or standalone CLI.
