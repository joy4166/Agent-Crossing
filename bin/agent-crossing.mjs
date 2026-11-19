#!/usr/bin/env node

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Agent Crossing — Zero-token 2.5D AI Agent Village Supervisor

Usage:
  agent-crossing [options]

Options:
  --port, -p <number>   Port to serve the village UI (default: 4777)
  --open, --popout      Launch a dedicated app window after starting
  --help, -h            Show this help message

Supported Local Agent Logs (read-only, 0 LLM tokens):
  - Antigravity (~/.gemini/antigravity/conversation_summaries.db + brain/)
  - Claude Code (~/.claude/projects/*/*.jsonl)
  - Cursor IDE (~/.cursor/projects/*/agent-transcripts & state.vscdb)
  - OpenAI Codex (~/.codex/sessions/**/rollout-*.jsonl)
`);
  process.exit(0);
}

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--port' || arg === '-p') {
    const val = Number(args[i + 1]);
    if (Number.isInteger(val) && val > 0 && val < 65536) {
      process.env.PORT = String(val);
      i += 1;
    }
  } else if (arg.startsWith('--port=')) {
    const val = Number(arg.slice(7));
    if (Number.isInteger(val) && val > 0 && val < 65536) {
      process.env.PORT = String(val);
    }
  } else if (arg === '--open' || arg === '--popout') {
    process.env.AGENT_CROSSING_AUTO_OPEN = '1';
  }
}

await import('../sidecars/village/main.mjs');
