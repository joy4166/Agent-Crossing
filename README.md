<p align="center">
  <img src="./assets/logo.svg" alt="Agent Crossing Logo" width="76" />
</p>

# Agent Crossing

> **English** | [한국어 (Korean)](./README.ko.md)

A **zero-token, read-only 2.5D Animal Crossing–style supervisor** for watching your AI coding agents work in real time across **Google Antigravity**, **Claude Code**, **Cursor**, and **OpenAI Codex CLI**.

Watch every main agent (**Mayor**) and subagent (**Curator, Pilot, Rescue, Atelier, Planner, Helper**) across all local repositories gather on cozy 2.5D island dioramas — completely free of extra LLM calls or execution latency.

---

## Highlights

- **Universal Multi-Agent Discovery (0 Extra LLM Tokens)**
  - Monitors all 4 agent ecosystems strictly read-only on disk using built-in Node.js modules (`node:sqlite` + tail-cached JSONL readers):
    - **Antigravity**: `conversation_summaries.db` + `brain/<id>/.system_generated/logs/transcript.jsonl` + `~/.gemini/config/projects/*.json`
    - **Claude Code**: `~/.claude/projects/*/*.jsonl` and nested `subagents/*.jsonl`
    - **Cursor IDE**: `workspaceStorage/*/state.vscdb` (`composer.composerData`) and `~/.cursor/projects/*/agent-transcripts/*.jsonl`
    - **OpenAI Codex CLI**: `~/.codex/sessions/YYYY/MM/DD/rollout-*.jsonl`
  - **Shared Repository Merging**: If Claude Code, Cursor, Antigravity, or Codex are working inside the same workspace folder, their villagers live together on that project's island with clear tool badges (`AGY`, `Claude`, `Cursor`, `Codex`).
- **True 2.5D ACNH Diorama & Real-Time Lighting**
  - Each workspace renders as a sculpted 2.5D island with faceted layered rock/soil cliffs, sandy coral reefs, fruit trees (apple, orange, cherry, peach, pear), mountain spring ponds, cascading 2-tier waterfalls, arched wooden bridges, a Resident Services clock pavilion, three-quarter 2.5D cottages with fences & porches, and 5 animated plaza stations.
  - Cycles smoothly across **Auto (real clock)**, **Day**, **Sunset**, and **Night** (glowing cottage windows, plaza streetlamps, and drifting fireflies).
- **Bilingual (`EN` / `KO`) Live Switcher**
  - Ships in full **English** by default with an instant `EN / KO` switcher in the top HUD bar and Guide sheet — updating UI labels, villager names (`Mayor Biscuit` / `촌장 보리`), roles, stations, and relative timestamps live without reload.
- **Supervisory Detail Controls**
  - **Action-Oriented Filter Button**: Displays `Active Only` while viewing all islands and `Show All` while filtered to active islands (`F`).
  - **Single-Island Focus Mode (`Z`)**: Isolate one chosen island cleanly on the stage with a floating top banner to return to the full archipelago.
  - **Hide & Restore Unwanted Islands**: Declutter finished or scratch projects via Inspector or Directory (`Hide Island`), and restore anytime from the **Hidden Islands** drawer section.
  - **Nook Passport Inspector**: Keeps short animal villager names on the map (`Mayor Biscuit`, `Curator Mochi`) and places untruncated conversation titles, error details, tool badges, and recent footprints inside the Nook Passport card.

---

## Activity & Station Mapping

| Station / Area | Role in Village | Tracked Agent Tools |
| :--- | :--- | :--- |
| **Mayoral Chimney Home** | Main session resting (`home`) | Idle main sessions across Antigravity, Claude, Cursor, Codex |
| **Sprout Cottage** | Subagent resting (`home`) | Nested subagents / sidechains (`nesting_depth > 0`, `isSidechain`, `agent-*.jsonl`) |
| **Book Cart** | Reading & Searching | `read_file`, `view_file`, `Read`, `Grep`, `Glob`, `codebase_search`, `grep_files` |
| **Notice Board** | Planning & Coordination | `invoke_subagent`, `swarm`, `Task`, `TodoWrite`, `update_plan`, reasoning |
| **DIY Bench** | Writing & Editing Code | `edit_file`, `write_file`, `Edit`, `MultiEdit`, `Write`, `edit_file_v2`, `apply_patch` |
| **Radio Tower** | Terminal & Errors | `run_command`, `Bash`, `run_terminal_command`, `shell`, `exec_command`, step errors |
| **Dodo Pier** | Web & Browser Recon | `search_web`, `WebSearch`, `WebFetch`, `browser` subagent actions |

---

## Installation & Usage

### Requirements

- **Node.js 22.5 or later** (uses built-in `node:sqlite` with zero native build steps or external runtime dependencies)

### Option 1: Standalone CLI (Works with Claude Code, Cursor, Codex, and Antigravity)

```bash
git clone https://github.com/joy4166/Agent-Crossing.git
cd Agent-Crossing
npm run open
```

Or run the CLI binary directly (opens `http://127.0.0.1:4777` in a sleek app-style mini window):

```bash
node bin/agent-crossing.mjs --open --port 4777
```

Click **Pop Out / Mini PiP** inside the UI to float the village above your terminal or IDE windows.

### Option 2: Antigravity Sidecar Plugin

```bash
git clone https://github.com/joy4166/Agent-Crossing.git
cd Agent-Crossing
npm run install-plugin
```

`npm run install-plugin` copies the plugin bundle into `~/.gemini/config/plugins/agent-village`.

> **Windows Note**: Antigravity's plugin scanner skips directory junctions/symlinks, so always copy real files via `npm run install-plugin`.

Once installed, open **Agent Crossing** from Antigravity's sidecar pane or ask your agent:
- `"Open Agent Crossing sidecar panel"`
- `"Show what my agents are working on right now"`

### Option 3: Portable `SKILL.md` (Claude Code, Cursor, Codex, Agensi.io)

Copy `skills/agent-crossing/SKILL.md` into your agent's skills folder (`~/.claude/skills/agent-crossing/`, `.cursor/skills/agent-crossing/`, etc.).

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `/` or `Ctrl+K` (`Cmd+K`) | Open Islands & Villagers Directory (`Up`/`Down` navigate, `Enter` select) |
| `[` / `]` | Cycle through visible islands |
| `Z` | Toggle Single-Island Focus Mode on selected island/villager |
| `F` | Toggle `Active Only` <-> `Show All` islands |
| `R` or Double-click | Fit visible islands to viewport |
| `+` / `−` or Scroll | Zoom in / out |
| Drag or Arrow Keys | Pan canvas (when canvas is focused) |
| `Esc` | Close open drawer/passport, or exit Focus Mode |

---

## Project Structure

```text
Agent-Crossing/
├── bin/agent-crossing.mjs              # Standalone CLI entrypoint (--port, --open)
├── plugin.json                         # Antigravity plugin manifest
├── package.json                        # CLI bin, start/open/test & install-plugin scripts
├── README.md / README.ko.md            # English & Korean documentation
├── assets/logo.svg                     # 2.5D island & leaf vector crest
├── skills/
│   ├── open-agent-village/SKILL.md     # Antigravity sidecar opener skill
│   └── agent-crossing/SKILL.md         # Universal multi-agent supervisor skill
├── tests/verify-adapters.mjs           # Integration tests for all 4 local agent adapters
└── sidecars/village/
    ├── sidecar.json                    # Antigravity AUX_PANE & restart_policy config
    ├── adapters.mjs                    # Read-only Antigravity, Claude, Cursor, Codex engine
    ├── main.mjs                        # SidecarApp & standalone HTTP/WebSocket backend
    ├── i18n.js                         # Bilingual EN/KO dictionary & bilingual demo generator
    ├── sprites.js                      # 2.5D cliffs, houses, pavilion, stations & SVG icons
    ├── index.html                      # NookPhone HUD, Directory & Nook Passport inspector
    ├── styles.css                      # Container-query adaptive styles & self-hosted fonts
    ├── village.js                      # Canvas loop, waypoints, Focus/Hide & live sync
    └── fonts/                          # Self-hosted NanumSquareRound (R/B/EB) WOFF2 fonts
```

---

## Privacy & Read-Only Guarantees

- Dynamically inspects local session directories (`ANTIGRAVITY_EXECUTABLE_DATA_DIR`, `~/.gemini`, `~/.claude`, `~/.cursor`, Cursor `User/workspaceStorage`, `~/.codex`) with zero hardcoded user paths.
- Opens SQLite stores strictly with `{ readOnly: true }` and performs bounded head/tail file reads (`<= 60 KB` per file cached by `mtimeMs`). Never edits user sessions, chats, or repositories.
