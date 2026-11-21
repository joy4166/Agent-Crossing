import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { buildVillageSnapshot, mapUniversalTool, cleanQuestTopic } from '../sidecars/village/adapters.mjs';

function makeTempFixtures() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-crossing-test-'));
  const sharedRepoWin = 'C:\\Repos\\shared-studio';
  const sharedRepoUri = 'file:///C:/Repos/shared-studio';

  // 1. Antigravity fixture
  const agyDir = path.join(root, 'antigravity');
  const agyProjDir = path.join(agyDir, 'projects');
  const agyBrainDir = path.join(agyDir, 'brain', 'agy-conv-1', '.system_generated', 'logs');
  fs.mkdirSync(agyProjDir, { recursive: true });
  fs.mkdirSync(agyBrainDir, { recursive: true });
  fs.writeFileSync(
    path.join(agyProjDir, 'shared.json'),
    JSON.stringify({
      id: 'proj-shared',
      name: 'shared-studio',
      projectResources: { resources: [{ folderUri: sharedRepoUri }] },
    })
  );
  const agyDb = new DatabaseSync(path.join(agyDir, 'conversation_summaries.db'));
  agyDb.exec(`
    CREATE TABLE conversation_summaries (
      conversation_id TEXT PRIMARY KEY,
      title TEXT,
      preview TEXT,
      step_count INTEGER,
      last_modified_time TEXT,
      workspace_uris TEXT,
      status TEXT,
      project_id TEXT,
      agent_name TEXT,
      parent_conversation_id TEXT,
      nesting_depth INTEGER,
      not_fully_idle INTEGER,
      killed INTEGER
    );
  `);
  const nowIso = new Date().toISOString();
  agyDb
    .prepare(`INSERT INTO conversation_summaries VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(
      'agy-conv-1',
      'Build 2.5D island diorama shader',
      'Build 2.5D',
      18,
      nowIso,
      JSON.stringify([sharedRepoUri]),
      'CASCADE_RUN_STATUS_RUNNING',
      'proj-shared',
      'Planner',
      '',
      0,
      1,
      0
    );
  agyDb.close();
  fs.writeFileSync(
    path.join(agyBrainDir, 'transcript.jsonl'),
    `${JSON.stringify({
      type: 'PLANNER_RESPONSE',
      status: 'RUNNING',
      created_at: nowIso,
      tool_calls: [{ name: 'edit_file', args: { Path: `${sharedRepoWin}\\sprites.js` } }],
    })}\n`
  );

  // 2. Claude Code fixture (same repo -> should merge into proj-shared island! + a subagent!)
  const claudeProjDir = path.join(root, 'claude', 'projects', 'c--Repos-shared-studio');
  const claudeSubDir = path.join(claudeProjDir, 'claude-main-1', 'subagents');
  fs.mkdirSync(claudeSubDir, { recursive: true });
  fs.writeFileSync(
    path.join(claudeProjDir, 'claude-main-1.jsonl'),
    [
      JSON.stringify({
        type: 'user',
        sessionId: 'claude-main-1',
        cwd: sharedRepoWin,
        timestamp: nowIso,
        message: { role: 'user', content: 'Can you refactor the auth middleware please' },
      }),
      JSON.stringify({
        type: 'assistant',
        sessionId: 'claude-main-1',
        cwd: sharedRepoWin,
        timestamp: nowIso,
        message: {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tu_1', name: 'Read', input: { file_path: `${sharedRepoWin}\\auth.ts` } }],
        },
      }),
    ].join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(claudeSubDir, 'agent-research.jsonl'),
    [
      JSON.stringify({
        type: 'user',
        sessionId: 'claude-main-1',
        isSidechain: true,
        cwd: sharedRepoWin,
        timestamp: nowIso,
        message: { role: 'user', content: 'Inspect token tests' },
      }),
      JSON.stringify({
        type: 'assistant',
        sessionId: 'claude-main-1',
        isSidechain: true,
        cwd: sharedRepoWin,
        timestamp: nowIso,
        message: {
          role: 'assistant',
          content: [{ type: 'tool_use', id: 'tu_2', name: 'Bash', input: { command: 'npm test', description: 'Run auth tests' } }],
        },
      }),
    ].join('\n') + '\n'
  );

  // 3. Cursor fixture (workspaceStorage state.vscdb + agent-transcripts jsonl on same repo)
  const cursorWsDir = path.join(root, 'cursor', 'user-data', 'workspaceStorage', 'abc123');
  const cursorSlugDir = path.join(root, 'cursor', 'dot-cursor', 'projects', 'c-repos-shared-studio', 'agent-transcripts');
  fs.mkdirSync(cursorWsDir, { recursive: true });
  fs.mkdirSync(cursorSlugDir, { recursive: true });
  fs.writeFileSync(
    path.join(cursorWsDir, 'workspace.json'),
    JSON.stringify({ folder: sharedRepoUri })
  );
  const cursorDb = new DatabaseSync(path.join(cursorWsDir, 'state.vscdb'));
  cursorDb.exec('CREATE TABLE ItemTable (key TEXT PRIMARY KEY, value BLOB);');
  cursorDb
    .prepare('INSERT INTO ItemTable (key, value) VALUES (?, ?)')
    .run(
      'composer.composerData',
      JSON.stringify({
        allComposers: [
          {
            composerId: 'cur-comp-1',
            name: 'Polish responsive grid in styles.css',
            lastUpdatedAt: Date.now(),
            unifiedMode: 'agent',
            isGenerating: true,
          },
        ],
      })
    );
  cursorDb.close();
  fs.writeFileSync(
    path.join(cursorSlugDir, 'cur-comp-1.jsonl'),
    [
      JSON.stringify({ role: 'user', message: { content: 'Polish responsive grid' }, timestamp: nowIso }),
      JSON.stringify({
        role: 'assistant',
        timestamp: nowIso,
        message: { content: [{ type: 'tool_use', name: 'edit_file_v2', input: { relative_workspace_path: 'styles.css' } }] },
      }),
    ].join('\n') + '\n'
  );

  // 4. OpenAI Codex CLI fixture (on a second island)
  const codexSessDir = path.join(root, 'codex', 'sessions', '2026', '11', '20');
  fs.mkdirSync(codexSessDir, { recursive: true });
  fs.writeFileSync(
    path.join(codexSessDir, 'rollout-20261120-codex1.jsonl'),
    [
      JSON.stringify({
        timestamp: nowIso,
        type: 'session_meta',
        payload: { id: 'codex-sess-1', cwd: 'C:\\Repos\\codex-cli-tool' },
      }),
      JSON.stringify({
        timestamp: nowIso,
        type: 'event_msg',
        payload: { type: 'user_message', message: 'Build release CLI binary' },
      }),
      JSON.stringify({
        timestamp: nowIso,
        type: 'response_item',
        payload: {
          type: 'function_call',
          name: 'shell',
          call_id: 'call_9',
          arguments: JSON.stringify({ command: ['cargo', 'build', '--release'] }),
        },
      }),
    ].join('\n') + '\n'
  );

  return root;
}

const tempRoot = makeTempFixtures();
const prevFixtures = process.env.AGENT_CROSSING_FIXTURES_DIR;
process.env.AGENT_CROSSING_FIXTURES_DIR = tempRoot;

try {
  // Verify universal tool mappings
  assert.equal(mapUniversalTool('Read', { file_path: 'a/b.ts' }).station, 'bookshelf');
  assert.equal(mapUniversalTool('Bash', { command: 'vitest' }).station, 'generator');
  assert.equal(mapUniversalTool('apply_patch', { input: '*** Update File: src/app.js' }).detail, 'app.js');
  assert.equal(mapUniversalTool('WebSearch', { query: 'acnh clouds' }).station, 'airport');

  // Verify bilingual title cleaning
  const cleanedEn = cleanQuestTopic('Can you fix auth bug please', 'mayor', false);
  assert.equal(cleanedEn.questTitle, 'fix auth bug please');
  const cleanedKo = cleanQuestTopic('지금 이 레포를 분석해줘', 'mayor', false);
  assert.equal(cleanedKo.questTitle, '분석');

  // Build snapshot over synthetic 4-provider workspace
  const snapshot = buildVillageSnapshot();

  assert.equal(snapshot.islands.length, 2, 'Should merge Antigravity, Claude, and Cursor onto 1 shared island + 1 Codex island');
  const shared = snapshot.islands.find((i) => i.name === 'shared-studio');
  assert.ok(shared, 'shared-studio island should exist');
  assert.deepEqual(
    [...shared.sources].sort(),
    ['antigravity', 'claude', 'cursor'],
    'shared-studio island should list all 3 participating sources'
  );

  const codexIsland = snapshot.islands.find((i) => i.name === 'codex-cli-tool');
  assert.ok(codexIsland, 'codex-cli-tool island should exist');
  assert.deepEqual(codexIsland.sources, ['codex']);

  assert.equal(snapshot.sourceCounts.antigravity, 1);
  assert.equal(snapshot.sourceCounts.claude, 2);
  assert.equal(snapshot.sourceCounts.cursor, 1);
  assert.equal(snapshot.sourceCounts.codex, 1);

  const claudeMain = snapshot.villagers.find((v) => v.conversationId === 'claude:claude-main-1');
  assert.equal(claudeMain?.station, 'bookshelf');
  assert.equal(claudeMain?.actionKey, 'reading');
  assert.equal(claudeMain?.isSubagent, false);

  const claudeSub = snapshot.villagers.find((v) => v.conversationId.includes('agent-research'));
  assert.equal(claudeSub?.station, 'generator');
  assert.equal(claudeSub?.isSubagent, true);

  const cursorVillager = snapshot.villagers.find((v) => v.conversationId === 'cursor:cur-comp-1');
  assert.equal(cursorVillager?.station, 'workbench');
  assert.equal(cursorVillager?.detail, 'styles.css');

  const codexVillager = snapshot.villagers.find((v) => v.conversationId === 'codex:codex-sess-1');
  assert.equal(codexVillager?.station, 'generator');
  assert.equal(codexVillager?.detail, 'cargo build --release');

  // Also test real host scan (with fixtures disabled) never throws
  delete process.env.AGENT_CROSSING_FIXTURES_DIR;
  const hostSnap = buildVillageSnapshot();
  assert.ok(Array.isArray(hostSnap.islands) && Array.isArray(hostSnap.villagers));

  console.log(
    `PASS: 4 multi-agent adapters verified (fixtures: ${snapshot.islands.length} islands, ${snapshot.villagers.length} villagers; host: ${hostSnap.islands.length} islands, ${hostSnap.villagers.length} villagers)`
  );
} finally {
  if (prevFixtures === undefined) {
    delete process.env.AGENT_CROSSING_FIXTURES_DIR;
  } else {
    process.env.AGENT_CROSSING_FIXTURES_DIR = prevFixtures;
  }
  try {
    fs.rmSync(tempRoot, { recursive: true, force: true, maxRetries: 3, retryDelay: 50 });
  } catch {
    // Windows SQLite WAL handle may linger briefly until process exit
  }
}
