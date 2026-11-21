#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const command = args[0] && !args[0].startsWith('-') ? args[0] : '';

if (args.includes('--help') || args.includes('-h')) {
  console.log(`Agent Crossing — Zero-token 2.5D Antigravity Multi-Agent Supervisor

Usage:
  npx agent-crossing [command] [options]

Commands:
  install                 Install the Antigravity sidecar plugin to ~/.gemini/config/plugins/agent-village
  (default)               Start the local Agent Crossing village server

Options:
  --port, -p <number>     Port to serve the village UI (default: 4777)
  --open, --popout        Launch a dedicated app window after starting
  --experimental-adapters Enable archived Claude Code / Cursor / Codex log readers
  --help, -h              Show this help message
`);
  process.exit(0);
}

if (command === 'install') {
  const dst = path.join(os.homedir(), '.gemini', 'config', 'plugins', 'agent-village');
  fs.mkdirSync(dst, { recursive: true });
  fs.cpSync(PKG_ROOT, dst, {
    recursive: true,
    force: true,
    filter: (src) => {
      const rel = path.relative(PKG_ROOT, src);
      if (!rel) return true;
      const top = rel.split(path.sep)[0];
      return top !== '.git' && top !== '.impeccable' && top !== 'node_modules' && top !== 'tests';
    },
  });
  console.log(`[agent-crossing] Installed Antigravity sidecar plugin to:\n  ${dst}`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Restart or refresh Antigravity plugins if it is already open.');
  console.log('  2. Open "Agent Crossing" in the sidecar pane, or run:');
  console.log('     npx agent-crossing --open');
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
  } else if (arg === '--experimental-adapters') {
    process.env.AGENT_CROSSING_EXPERIMENTAL_ADAPTERS = '1';
  }
}

await import('../sidecars/village/main.mjs');
