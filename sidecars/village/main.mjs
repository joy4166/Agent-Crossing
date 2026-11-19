import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFile, spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 4777;
const HOST = '127.0.0.1';
const WS_GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';

const TAIL_BYTES = 49152;
const ACTIVE_RECENT_MS = 15 * 60 * 1000;
const IDLE_COFFEE_MS = 15 * 60 * 1000;
const TRANSCRIPT_ACTIVE_MS = 12 * 1000;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function resolveAppDataDir() {
  const execDataDir = process.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR;
  if (execDataDir) {
    for (let d = execDataDir; d !== path.dirname(d); d = path.dirname(d)) {
      if (path.basename(d) === 'sidecar_data') {
        return path.dirname(d);
      }
    }
  }
  const geminiBase = path.join(os.homedir(), '.gemini');
  for (const name of ['antigravity', 'antigravity-ide', 'antigravity-cli']) {
    const candidate = path.join(geminiBase, name);
    if (fs.existsSync(path.join(candidate, 'conversation_summaries.db'))) {
      return candidate;
    }
  }
  return path.join(geminiBase, 'antigravity');
}

const ANTIGRAVITY_DIR = resolveAppDataDir();
const GEMINI_DIR = path.dirname(ANTIGRAVITY_DIR);
const PROJECTS_DIR = fs.existsSync(path.join(GEMINI_DIR, 'config', 'projects'))
  ? path.join(GEMINI_DIR, 'config', 'projects')
  : path.join(os.homedir(), '.gemini', 'config', 'projects');
const SUMMARY_DB_PATH = path.join(ANTIGRAVITY_DIR, 'conversation_summaries.db');
const BRAIN_DIR = path.join(ANTIGRAVITY_DIR, 'brain');

let dbInstance = null;
let lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
const transcriptCache = new Map();
const wsClients = new Set();
let lastStateHash = '';
let lastBroadcastAt = 0;
let latestSnapshot = null;
let latestSnapshotAt = 0;

function normalizeUri(raw) {
  if (!raw) return { key: '', displayPath: '' };
  let value = String(raw).trim();
  if (value.startsWith('[')) {
    try {
      const arr = JSON.parse(value);
      value = Array.isArray(arr) && arr.length > 0 ? String(arr[0]) : '';
    } catch {
      // keep raw
    }
  }
  if (!value) return { key: '', displayPath: '' };
  let stripped = value.replace(/^file:\/\/\/?/i, '');
  try {
    stripped = decodeURIComponent(stripped);
  } catch {
    // ignore malformed percent encoding
  }
  const displayPath = stripped.replace(/\\/g, '/').replace(/\/+$/, '');
  return {
    key: displayPath.toLowerCase(),
    displayPath,
  };
}

function unwrapArg(v) {
  if (v === undefined || v === null) return '';
  if (typeof v !== 'string') return v;
  const trimmed = v.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
    (trimmed.startsWith('{') && trimmed.endsWith('}'))
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return v;
    }
  }
  return v;
}

function safeBasename(rawPath, fallback = '') {
  const unwrapped = unwrapArg(rawPath);
  if (!unwrapped) return fallback;
  if (Array.isArray(unwrapped)) {
    return unwrapped.map((item) => String(item)).join(', ');
  }
  const str = String(unwrapped).replace(/\\/g, '/').replace(/\/+$/, '');
  if (!str) return fallback;
  const idx = str.lastIndexOf('/');
  return idx >= 0 ? str.slice(idx + 1) || fallback : str;
}

function truncateText(text, max = 28) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function middleTruncate(text, max = 18) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= max) return clean;
  if (max <= 4) return `${clean.slice(0, Math.max(1, max - 1))}…`;
  const head = Math.ceil((max - 1) * 0.58);
  const tail = Math.max(3, max - 1 - head);
  return `${clean.slice(0, head)}…${clean.slice(-tail)}`;
}

function parseTimestampMs(ts) {
  if (!ts) return 0;
  const normalized = String(ts).replace(' ', 'T');
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDatabase() {
  if (dbInstance) return dbInstance;
  if (!fs.existsSync(SUMMARY_DB_PATH)) {
    lastDbDiagnostic = { ok: true, missingFile: true, message: '' };
    return null;
  }
  try {
    dbInstance = new DatabaseSync(SUMMARY_DB_PATH, {
      readOnly: true,
      readBigInts: true,
    });
    lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
    return dbInstance;
  } catch (err) {
    dbInstance = null;
    lastDbDiagnostic = {
      ok: false,
      missingFile: false,
      message: truncateText(err?.message || '대화 요약 DB를 열 수 없습니다.', 120),
    };
    return null;
  }
}

function resetDatabase() {
  if (dbInstance) {
    try {
      dbInstance.close();
    } catch {
      // ignore close error
    }
    dbInstance = null;
  }
}

function loadProjects() {
  const islandsById = new Map();
  const islandByFolderKey = new Map();

  if (!fs.existsSync(PROJECTS_DIR)) {
    return { islandsById, islandByFolderKey };
  }

  let files = [];
  try {
    files = fs.readdirSync(PROJECTS_DIR).filter((name) => name.endsWith('.json'));
  } catch {
    return { islandsById, islandByFolderKey };
  }

  for (const file of files) {
    try {
      const raw = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf8');
      const data = JSON.parse(raw);
      if (data.sidecar) continue;

      const folderUri = data.projectResources?.resources?.[0]?.folderUri || '';
      const { key: folderKey, displayPath: folderPath } = normalizeUri(folderUri);
      const fallbackName = folderPath ? safeBasename(folderPath, data.id) : data.id;
      const island = {
        id: String(data.id || file.replace(/\.json$/, '')),
        name: String(data.name || fallbackName || 'Project'),
        folderKey,
        folderPath,
        isRegistered: true,
        activeCount: 0,
        villagerCount: 0,
        lastActivityMs: 0,
      };
      islandsById.set(island.id, island);
      if (folderKey) {
        islandByFolderKey.set(folderKey, island);
      }
    } catch {
      // skip invalid project json
    }
  }

  return { islandsById, islandByFolderKey };
}

function mapToolToState(tool) {
  const name = String(tool?.name || '').toLowerCase();
  const args = tool?.args && typeof tool.args === 'object' ? tool.args : {};

  if (
    name === 'read_file' ||
    name === 'view_file' ||
    name === 'list_resources' ||
    name === 'read_resource' ||
    name === 'grep' ||
    /^(inspect_|list_|procedure_|search_procedures|search_strings|read_|find_xrefs)/.test(name)
  ) {
    const target = safeBasename(args.Path || args.Uri || args.ServerName || args.DirectoryPath, name);
    return {
      activity: 'reading',
      station: 'bookshelf',
      emoji: '📖',
      actionLabel: '코드·문서 읽는 중',
      detail: truncateText(target, 26),
    };
  }

  if (name === 'edit_file' || name === 'write_file') {
    const target = safeBasename(args.Path, 'file');
    return {
      activity: 'crafting',
      station: 'workbench',
      emoji: '🔨',
      actionLabel: 'DIY 코드 제작 중',
      detail: truncateText(target, 26),
    };
  }

  if (name === 'run_command' || name === 'manage_task') {
    const summary = unwrapArg(args.toolSummary) || unwrapArg(args.CommandLine) || unwrapArg(args.Action) || '명령 실행';
    return {
      activity: 'command',
      station: 'generator',
      emoji: '⚙️',
      actionLabel: '터미널 장치 가동 중',
      detail: truncateText(summary, 28),
    };
  }

  if (name === 'search_web' || name === 'search_marketplace' || name.includes('browser')) {
    const query = unwrapArg(args.query) || unwrapArg(args.queries) || '웹 탐색';
    return {
      activity: 'exploring',
      station: 'airport',
      emoji: '🔭',
      actionLabel: '바깥 세계 탐색 중',
      detail: truncateText(Array.isArray(query) ? query.join(', ') : query, 28),
    };
  }

  if (
    name === 'invoke_subagent' ||
    name === 'send_message' ||
    name === 'swarm' ||
    name === 'run_workflow' ||
    name === 'manage_subagents'
  ) {
    const role = unwrapArg(args.Role) || unwrapArg(args.TypeName) || unwrapArg(args.action) || '협업';
    return {
      activity: 'coordinating',
      station: 'board',
      emoji: '📣',
      actionLabel: '주민 에이전트 소집 중',
      detail: truncateText(role, 26),
    };
  }

  if (name === 'exit_plan_mode' || name === 'ask_question' || name === 'enter_plan_mode') {
    return {
      activity: 'planning',
      station: 'board',
      emoji: '📋',
      actionLabel: '마을 계획 정리 중',
      detail: name === 'ask_question' ? '질문 정리 중' : '설계 완료',
    };
  }

  const fallback = unwrapArg(args.ToolName) || name || '도구 실행';
  return {
    activity: 'crafting',
    station: 'workbench',
    emoji: '✨',
    actionLabel: '도구 작업 중',
    detail: truncateText(fallback, 24),
  };
}

function formatRelativeKo(ageMs) {
  if (ageMs < 60_000) return '방금 전 활동';
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}분 전 활동`;
  if (ageMs < 86_400_000) return `${Math.floor(ageMs / 3_600_000)}시간 전 활동`;
  return `${Math.floor(ageMs / 86_400_000)}일 전 활동`;
}

function buildIdleState(ageMs) {
  const rel = formatRelativeKo(ageMs);
  if (ageMs < IDLE_COFFEE_MS) {
    return {
      activity: 'coffee',
      station: 'home',
      emoji: '☕',
      actionLabel: '집 마당에서 티타임',
      detail: rel,
    };
  }
  return {
    activity: 'sleeping',
    station: 'home',
    emoji: '💤',
    actionLabel: '집에서 꿀잠 휴식 중',
    detail: rel,
  };
}

function extractErrorInfo(steps, errIndex) {
  const errStep = steps[errIndex] || {};
  let toolName = '';
  for (let i = errIndex; i >= Math.max(0, errIndex - 2); i -= 1) {
    const candidate = steps[i];
    if (candidate?.type === 'PLANNER_RESPONSE' && Array.isArray(candidate.tool_calls) && candidate.tool_calls.length > 0) {
      toolName = String(candidate.tool_calls[candidate.tool_calls.length - 1]?.name || '');
      break;
    }
  }
  const rawErr =
    (typeof errStep.error === 'string' && errStep.error.trim()) ||
    (typeof errStep.content === 'string' && errStep.content.trim().split(/\r?\n/)[0]) ||
    '';
  const cleanMsg = rawErr.replace(/\s+/g, ' ').trim();
  const combined =
    toolName && cleanMsg
      ? `${toolName}: ${cleanMsg}`
      : cleanMsg
        ? cleanMsg
        : toolName
          ? `${toolName} 실행 오류`
          : '단계 실행 오류';
  return {
    short: truncateText(combined, 32),
    full: truncateText(combined, 220),
  };
}

function readTranscriptTail(conversationId) {
  const transcriptPath = path.join(BRAIN_DIR, conversationId, '.system_generated', 'logs', 'transcript.jsonl');
  if (!fs.existsSync(transcriptPath)) {
    return null;
  }

  let stat;
  try {
    stat = fs.statSync(transcriptPath);
  } catch {
    return null;
  }

  const cached = transcriptCache.get(conversationId);
  if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
    return cached;
  }

  const readLen = Math.min(stat.size, TAIL_BYTES);
  const startOffset = Math.max(0, stat.size - readLen);
  let text = '';
  let fd;
  try {
    fd = fs.openSync(transcriptPath, 'r');
    const buf = Buffer.allocUnsafe(readLen);
    const bytesRead = fs.readSync(fd, buf, 0, readLen, startOffset);
    text = buf.toString('utf8', 0, bytesRead);
  } catch {
    return null;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore
      }
    }
  }

  const lines = text.split(/\r?\n/);
  if (startOffset > 0 && lines.length > 0) {
    lines.shift();
  }

  const steps = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      steps.push(JSON.parse(trimmed));
    } catch {
      // skip incomplete trailing line
    }
  }

  const rawFeed = [];
  const pushFeedItem = (time, emoji, label, baseDetail, fullDetail = '') => {
    const prev = rawFeed[rawFeed.length - 1];
    if (prev && prev.label === label && prev.baseDetail === baseDetail) {
      prev.count += 1;
      if (!prev.fullDetail && fullDetail) prev.fullDetail = fullDetail;
      return;
    }
    rawFeed.push({ time, emoji, label, baseDetail, fullDetail, count: 1 });
  };

  for (let i = steps.length - 1; i >= 0 && rawFeed.length < 6; i -= 1) {
    const step = steps[i];
    if (step.type === 'PLANNER_RESPONSE' && Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
      for (let j = step.tool_calls.length - 1; j >= 0 && rawFeed.length < 6; j -= 1) {
        const mapped = mapToolToState(step.tool_calls[j]);
        pushFeedItem(step.created_at || '', mapped.emoji, mapped.actionLabel, mapped.detail);
      }
    } else if (step.status === 'ERROR') {
      const errInfo = extractErrorInfo(steps, i);
      pushFeedItem(step.created_at || '', '💦', '오류 발생·점검 중', errInfo.short, errInfo.full);
    }
  }

  const feed = rawFeed.map(({ time, emoji, label, baseDetail, fullDetail, count }) => ({
    time,
    emoji,
    label,
    detail: count > 1 && baseDetail ? `${baseDetail} (×${count})` : baseDetail,
    ...(fullDetail ? { fullDetail } : {}),
  }));

  const entry = {
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    steps,
    feed,
  };
  transcriptCache.set(conversationId, entry);
  return entry;
}

function inspectTranscript(conversationId, isRunning, lastModifiedMs) {
  const now = Date.now();
  const tail = readTranscriptTail(conversationId);
  const steps = tail?.steps || [];
  const latest = steps.length > 0 ? steps[steps.length - 1] : null;
  const effectiveAgeMs = Math.max(
    0,
    now - Math.max(lastModifiedMs || 0, tail?.mtimeMs || 0)
  );

  if (latest?.status === 'ERROR') {
    const errInfo = extractErrorInfo(steps, steps.length - 1);
    return {
      state: {
        activity: 'error',
        station: 'generator',
        emoji: '💦',
        actionLabel: '오류 발생·점검 중',
        detail: errInfo.short,
        errorFull: errInfo.full,
      },
      isActive: Boolean(isRunning),
      feed: tail?.feed || [],
    };
  }

  const transcriptRecentlyUpdated =
    tail &&
    now - tail.mtimeMs < TRANSCRIPT_ACTIVE_MS &&
    !(latest?.type === 'PLANNER_RESPONSE' && (!latest.tool_calls || latest.tool_calls.length === 0) && latest.status === 'DONE');

  const isActive = Boolean(isRunning || transcriptRecentlyUpdated);

  if (isActive) {
    let chosenTool = null;

    if (latest?.type === 'PLANNER_RESPONSE' && Array.isArray(latest.tool_calls) && latest.tool_calls.length > 0) {
      chosenTool = latest.tool_calls[latest.tool_calls.length - 1];
    } else if (latest?.type === 'GENERIC' || latest?.type === 'SYSTEM_MESSAGE') {
      for (let i = steps.length - 1; i >= 0; i -= 1) {
        const s = steps[i];
        if (s.type === 'USER_INPUT') break;
        if (s.type === 'PLANNER_RESPONSE') {
          if (Array.isArray(s.tool_calls) && s.tool_calls.length > 0 && latest.status === 'RUNNING') {
            chosenTool = s.tool_calls[s.tool_calls.length - 1];
          } else if (Array.isArray(s.tool_calls) && s.tool_calls.length > 0 && now - tail.mtimeMs < 4000) {
            chosenTool = s.tool_calls[s.tool_calls.length - 1];
          }
          break;
        }
      }
    }

    if (chosenTool) {
      return {
        state: mapToolToState(chosenTool),
        isActive: true,
        feed: tail?.feed || [],
      };
    }

    return {
      state: {
        activity: 'thinking',
        station: 'board',
        emoji: '💭',
        actionLabel: '아이디어 구상 중',
        detail: '생각 정리 중...',
      },
      isActive: true,
      feed: tail?.feed || [],
    };
  }

  return {
    state: buildIdleState(effectiveAgeMs),
    isActive: false,
    feed: tail?.feed || [],
  };
}

function queryConversations() {
  const db = getDatabase();
  if (!db) return [];
  try {
    const rows = db
      .prepare(`
        SELECT conversation_id, title, substr(preview, 1, 80) AS preview,
               step_count, last_modified_time, workspace_uris, status,
               project_id, agent_name, parent_conversation_id,
               nesting_depth, not_fully_idle, killed
        FROM conversation_summaries
        WHERE killed = 0
        ORDER BY last_modified_time DESC
        LIMIT 80
      `)
      .all();

    const result = rows.map((r) => ({
      conversationId: String(r.conversation_id),
      title: String(r.title || ''),
      preview: String(r.preview || ''),
      stepCount: Number(r.step_count || 0),
      lastModifiedTime: String(r.last_modified_time || ''),
      lastModifiedMs: parseTimestampMs(r.last_modified_time),
      workspaceUris: String(r.workspace_uris || ''),
      status: String(r.status || ''),
      projectId: String(r.project_id || ''),
      agentName: String(r.agent_name || ''),
      parentConversationId: String(r.parent_conversation_id || ''),
      nestingDepth: Number(r.nesting_depth || 0),
      notFullyIdle: Number(r.not_fully_idle || 0),
      killed: Number(r.killed || 0),
    }));
    lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
    return result;
  } catch (err) {
    lastDbDiagnostic = {
      ok: false,
      missingFile: false,
      message: truncateText(err?.message || '대화 목록 DB 조회 오류', 120),
    };
    resetDatabase();
    return [];
  }
}

function buildSnapshot() {
  const now = Date.now();
  const { islandsById, islandByFolderKey } = loadProjects();
  const conversations = queryConversations();

  const resolveIsland = (conv) => {
    if (conv.projectId && islandsById.has(conv.projectId)) {
      return islandsById.get(conv.projectId);
    }

    const { key: folderKey, displayPath } = normalizeUri(conv.workspaceUris);
    if (folderKey && islandByFolderKey.has(folderKey)) {
      return islandByFolderKey.get(folderKey);
    }

    if (folderKey) {
      const dynamicId = `dir:${folderKey}`;
      if (!islandsById.has(dynamicId)) {
        islandsById.set(dynamicId, {
          id: dynamicId,
          name: safeBasename(displayPath, 'Workspace'),
          folderKey,
          folderPath: displayPath,
          isRegistered: false,
          activeCount: 0,
          villagerCount: 0,
          lastActivityMs: 0,
        });
      }
      return islandsById.get(dynamicId);
    }

    const freeId = 'outside-of-project';
    if (!islandsById.has(freeId)) {
      islandsById.set(freeId, {
        id: freeId,
        name: '자유 광장',
        folderKey: '',
        folderPath: '',
        isRegistered: false,
        activeCount: 0,
        villagerCount: 0,
        lastActivityMs: 0,
      });
    }
    return islandsById.get(freeId);
  };

  const selectedConvs = [];
  const selectedIds = new Set();
  const mainPerIslandCount = new Map();
  const subPerIslandCount = new Map();
  const activeOrRecentParents = new Set();

  for (const conv of conversations) {
    const isRunning = conv.status === 'CASCADE_RUN_STATUS_RUNNING' || conv.notFullyIdle === 1;
    const isRecent = now - conv.lastModifiedMs <= ACTIVE_RECENT_MS;
    if (conv.nestingDepth === 0 && (isRunning || isRecent)) {
      activeOrRecentParents.add(conv.conversationId);
    }
  }

  for (const conv of conversations) {
    const island = resolveIsland(conv);
    const isRunning = conv.status === 'CASCADE_RUN_STATUS_RUNNING' || conv.notFullyIdle === 1;
    const isRecent = now - conv.lastModifiedMs <= ACTIVE_RECENT_MS;

    if (isRunning || isRecent) {
      selectedConvs.push({ conv, island });
      selectedIds.add(conv.conversationId);
      if (conv.nestingDepth === 0) {
        mainPerIslandCount.set(island.id, (mainPerIslandCount.get(island.id) || 0) + 1);
      } else {
        subPerIslandCount.set(island.id, (subPerIslandCount.get(island.id) || 0) + 1);
      }
    }
  }

  for (const conv of conversations) {
    if (selectedIds.has(conv.conversationId)) continue;
    const island = resolveIsland(conv);

    if (conv.nestingDepth === 0) {
      const count = mainPerIslandCount.get(island.id) || 0;
      if (count < 2) {
        selectedConvs.push({ conv, island });
        selectedIds.add(conv.conversationId);
        mainPerIslandCount.set(island.id, count + 1);
      }
    } else if (activeOrRecentParents.has(conv.parentConversationId)) {
      const subCount = subPerIslandCount.get(island.id) || 0;
      if (subCount < 2) {
        selectedConvs.push({ conv, island });
        selectedIds.add(conv.conversationId);
        subPerIslandCount.set(island.id, subCount + 1);
      }
    }
  }

  const villagers = selectedConvs.map(({ conv, island }) => {
    const isRunning = conv.status === 'CASCADE_RUN_STATUS_RUNNING' || conv.notFullyIdle === 1;
    const inspected = inspectTranscript(conv.conversationId, isRunning, conv.lastModifiedMs);
    const active = Boolean(isRunning || inspected.isActive);

    island.villagerCount += 1;
    if (active) island.activeCount += 1;
    if (conv.lastModifiedMs > island.lastActivityMs) {
      island.lastActivityMs = conv.lastModifiedMs;
    }

    const displayTitle = (
      conv.nestingDepth > 0
        ? conv.agentName || 'subagent'
        : conv.title || conv.preview || '메인 에이전트'
    ).replace(/\s+/g, ' ').trim();

    return {
      conversationId: conv.conversationId,
      islandId: island.id,
      islandName: island.name,
      title: conv.title || conv.preview || displayTitle,
      rawDisplayName: displayTitle,
      displayName: middleTruncate(displayTitle, 18),
      role: conv.nestingDepth > 0 ? conv.agentName || 'subagent' : '촌장',
      isSubagent: conv.nestingDepth > 0,
      parentConversationId: conv.parentConversationId,
      stepCount: conv.stepCount,
      status: conv.status,
      isRunning: active,
      lastModifiedTime: conv.lastModifiedTime,
      lastModifiedMs: conv.lastModifiedMs,
      activity: inspected.state.activity,
      station: inspected.state.station,
      emoji: inspected.state.emoji,
      actionLabel: inspected.state.actionLabel,
      detail: inspected.state.detail,
      errorFull: inspected.state.errorFull || '',
      feed: inspected.feed,
    };
  });

  const nameBuckets = new Map();
  for (const v of villagers) {
    const key = `${v.islandId}\0${v.rawDisplayName}`;
    if (!nameBuckets.has(key)) nameBuckets.set(key, []);
    nameBuckets.get(key).push(v);
  }
  for (const group of nameBuckets.values()) {
    if (group.length > 1) {
      group.forEach((v, idx) => {
        v.displayName = `${middleTruncate(v.rawDisplayName, 14)} #${idx + 1}`;
      });
    }
    for (const v of group) {
      delete v.rawDisplayName;
    }
  }

  const islands = Array.from(islandsById.values())
    .filter((isl) => isl.isRegistered || isl.villagerCount > 0)
    .sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.name.localeCompare(b.name, 'ko');
    });

  const activeVillagers = villagers.filter((v) => v.isRunning).length;
  const activeIslands = islands.filter((i) => i.activeCount > 0).length;

  return {
    timestamp: now,
    islands,
    villagers,
    diagnostics: { ...lastDbDiagnostic },
    stats: {
      activeVillagers,
      totalVillagers: villagers.length,
      activeIslands,
      totalIslands: islands.length,
    },
  };
}

function computeStateFingerprint(snapshot) {
  return JSON.stringify({
    diag: [snapshot.diagnostics?.ok !== false, snapshot.diagnostics?.message || ''],
    islands: snapshot.islands.map((i) => [i.id, i.activeCount, i.villagerCount]),
    villagers: snapshot.villagers.map((v) => [
      v.conversationId,
      v.isRunning,
      v.activity,
      v.station,
      v.detail,
      v.errorFull,
      v.stepCount,
    ]),
  });
}

function getFreshSnapshot() {
  const now = Date.now();
  if (!latestSnapshot || now - latestSnapshotAt > 250) {
    latestSnapshot = buildSnapshot();
    latestSnapshotAt = now;
  }
  return latestSnapshot;
}

function getStatePayload(clientEtag, hostConversationId = '') {
  const snapshot = getFreshSnapshot();
  const etag = crypto
    .createHash('sha1')
    .update(computeStateFingerprint(snapshot))
    .digest('hex')
    .slice(0, 16);

  if (clientEtag && clientEtag === etag) {
    return { unchanged: true, etag };
  }
  return { ...snapshot, etag, hostConversationId };
}

function openProjectFolder(islandId) {
  const snapshot = getFreshSnapshot();
  const island = snapshot.islands.find((item) => item.id === islandId);
  if (!island?.folderPath) {
    return { ok: false, error: '이 섬에는 열 수 있는 프로젝트 폴더 경로가 없습니다.' };
  }

  const resolved = path.resolve(island.folderPath);
  if (!fs.existsSync(resolved) || !fs.statSync(resolved).isDirectory()) {
    return { ok: false, error: '디스크에서 프로젝트 폴더를 찾을 수 없습니다.' };
  }

  const cmd =
    process.platform === 'win32'
      ? 'explorer.exe'
      : process.platform === 'darwin'
        ? 'open'
        : 'xdg-open';

  const child = execFile(cmd, [resolved], { windowsHide: false }, () => {});
  child.unref();
  return { ok: true, path: resolved };
}

function openPopoutWindow({ port, token = '', conversationId = '' }) {
  const urlObj = new URL(`http://127.0.0.1:${port}/`);
  if (token) urlObj.searchParams.set('token', token);
  if (conversationId) urlObj.searchParams.set('conversationId', conversationId);
  urlObj.searchParams.set('popout', '1');
  const targetUrl = urlObj.toString();

  if (process.platform === 'win32') {
    const candidates = [
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env.LOCALAPPDATA || '', 'Google\\Chrome\\Application\\chrome.exe'),
      path.join(process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)', 'Microsoft\\Edge\\Application\\msedge.exe'),
      path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Microsoft\\Edge\\Application\\msedge.exe'),
    ].filter(Boolean);

    const browserExe = candidates.find((exe) => fs.existsSync(exe));
    if (browserExe) {
      const child = spawn(browserExe, [`--app=${targetUrl}`, '--window-size=960,640'], {
        detached: true,
        stdio: 'ignore',
        windowsHide: false,
      });
      child.unref();
      return { ok: true, browser: path.basename(browserExe) };
    }

    const fallback = spawn('cmd.exe', ['/c', 'start', '', targetUrl], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    fallback.unref();
    return { ok: true, browser: 'default' };
  }

  if (process.platform === 'darwin') {
    const macBrowsers = [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ];
    const browserExe = macBrowsers.find((exe) => fs.existsSync(exe));
    if (browserExe) {
      const child = spawn(browserExe, [`--app=${targetUrl}`, '--window-size=960,640'], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
      return { ok: true, browser: path.basename(browserExe) };
    }
    spawn('open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    return { ok: true, browser: 'default' };
  }

  spawn('xdg-open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
  return { ok: true, browser: 'default' };
}

const isSidecarEnv = Boolean(
  process.env.ANTIGRAVITY_LS_ADDRESS &&
  process.env.ANTIGRAVITY_CSRF_TOKEN &&
  process.env.ANTIGRAVITY_SIDECAR_WEB_PORT
);

if (isSidecarEnv) {
  const { SidecarApp, Response } = await import('sidecar_sdk');
  const app = new SidecarApp();

  app.page(
    '/',
    () =>
      new Response(fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8'), {
        contentType: 'text/html; charset=utf-8',
        headers: { 'Cache-Control': 'no-store' },
      })
  );

  app.api(
    '/styles.css',
    () =>
      new Response(fs.readFileSync(path.join(__dirname, 'styles.css'), 'utf8'), {
        contentType: 'text/css; charset=utf-8',
        headers: { 'Cache-Control': 'no-store' },
      }),
    'GET'
  );

  app.api(
    '/village.js',
    () =>
      new Response(fs.readFileSync(path.join(__dirname, 'village.js'), 'utf8'), {
        contentType: 'application/javascript; charset=utf-8',
        headers: { 'Cache-Control': 'no-store' },
      }),
    'GET'
  );

  app.api('/api/health', () => ({ ok: true, mode: 'sidecar' }), 'GET');

  app.api(
    '/api/state',
    (data) => getStatePayload(data?.etag || '', app.config.conversationId || ''),
    'GET'
  );

  app.api('/api/open-folder', (data) => openProjectFolder(String(data?.islandId || '')), 'POST');

  app.api(
    '/api/popout',
    (data) =>
      openPopoutWindow({
        port: Number(process.env.ANTIGRAVITY_SIDECAR_WEB_PORT),
        token: process.env.ANTIGRAVITY_SIDECAR_UI_TOKEN || '',
        conversationId: String(data?.conversationId || app.config.conversationId || ''),
      }),
    'POST'
  );

  await app.run();
} else {
  function encodeWsTextFrame(str) {
    const payload = Buffer.from(str, 'utf8');
    const len = payload.length;
    let header;

    if (len < 126) {
      header = Buffer.allocUnsafe(2);
      header[0] = 0x81;
      header[1] = len;
    } else if (len < 65536) {
      header = Buffer.allocUnsafe(4);
      header[0] = 0x81;
      header[1] = 126;
      header.writeUInt16BE(len, 2);
    } else {
      header = Buffer.allocUnsafe(10);
      header[0] = 0x81;
      header[1] = 127;
      header.writeBigUInt64BE(BigInt(len), 2);
    }

    return Buffer.concat([header, payload]);
  }

  function encodeWsPongFrame(payload) {
    const len = Math.min(payload.length, 125);
    const frame = Buffer.allocUnsafe(2 + len);
    frame[0] = 0x8a;
    frame[1] = len;
    if (len > 0) payload.copy(frame, 2, 0, len);
    return frame;
  }

  function sendWsJson(socket, obj) {
    if (!socket || socket.destroyed || !socket.writable) {
      wsClients.delete(socket);
      return;
    }
    try {
      socket.write(encodeWsTextFrame(JSON.stringify(obj)));
    } catch {
      wsClients.delete(socket);
    }
  }

  function refreshAndBroadcast(force = false) {
    const snapshot = buildSnapshot();
    latestSnapshot = snapshot;
    latestSnapshotAt = Date.now();
    const hash = computeStateFingerprint(snapshot);
    const now = Date.now();

    if (force || hash !== lastStateHash || now - lastBroadcastAt >= 5000) {
      lastStateHash = hash;
      lastBroadcastAt = now;
      if (wsClients.size > 0) {
        const frame = encodeWsTextFrame(JSON.stringify({ type: 'snapshot', data: snapshot }));
        for (const client of wsClients) {
          if (client.destroyed || !client.writable) {
            wsClients.delete(client);
            continue;
          }
          try {
            client.write(frame);
          } catch {
            wsClients.delete(client);
          }
        }
      }
    }
  }

  function serveStatic(reqPath, res) {
    if (reqPath === '/preload.js') {
      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end('/* standalone mode */');
      return;
    }
    const fileMap = {
      '/': 'index.html',
      '/index.html': 'index.html',
      '/styles.css': 'styles.css',
      '/village.js': 'village.js',
    };
    const fileName = fileMap[reqPath];
    if (!fileName) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    const resolved = path.join(__dirname, fileName);
    const ext = path.extname(resolved).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(resolved).pipe(res);
  }

  const server = http.createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const urlPath = reqUrl.pathname;

    if (urlPath === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ ok: true, mode: 'standalone', port: PORT, clients: wsClients.size }));
      return;
    }

    if (urlPath === '/api/state' && req.method === 'GET') {
      const etag = reqUrl.searchParams.get('etag') || '';
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(getStatePayload(etag)));
      return;
    }

    if (urlPath === '/api/open-folder' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const data = body ? JSON.parse(body) : {};
          const result = openProjectFolder(String(data?.islandId || ''));
          res.writeHead(result.ok ? 200 : 400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: err.message }));
        }
      });
      return;
    }

    if (urlPath === '/api/popout' && req.method === 'POST') {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(openPopoutWindow({ port: PORT })));
      return;
    }

    serveStatic(urlPath, res);
  });

  server.on('upgrade', (req, socket) => {
    const urlPath = (req.url || '/').split('?')[0];
    if (urlPath !== '/ws') {
      socket.destroy();
      return;
    }

    const key = req.headers['sec-websocket-key'];
    if (!key) {
      socket.destroy();
      return;
    }

    const accept = crypto.createHash('sha1').update(`${key}${WS_GUID}`).digest('base64');
    socket.write(
      [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${accept}`,
        '',
        '',
      ].join('\r\n')
    );

    socket.setNoDelay(true);
    wsClients.add(socket);
    sendWsJson(socket, { type: 'snapshot', data: getFreshSnapshot() });

    socket.on('data', (chunk) => {
      if (!chunk || chunk.length < 2) return;
      const opcode = chunk[0] & 0x0f;
      if (opcode === 0x08) {
        wsClients.delete(socket);
        socket.end();
      } else if (opcode === 0x09) {
        const masked = (chunk[1] & 0x80) !== 0;
        const len = chunk[1] & 0x7f;
        if (len < 126) {
          const offset = masked ? 6 : 2;
          const rawPayload = chunk.subarray(offset, offset + len);
          if (masked && chunk.length >= 6 + len) {
            const mask = chunk.subarray(2, 6);
            const unmasked = Buffer.allocUnsafe(len);
            for (let i = 0; i < len; i += 1) unmasked[i] = rawPayload[i] ^ mask[i % 4];
            socket.write(encodeWsPongFrame(unmasked));
          } else {
            socket.write(encodeWsPongFrame(rawPayload));
          }
        }
      }
    });

    socket.on('close', () => wsClients.delete(socket));
    socket.on('error', () => wsClients.delete(socket));
  });

  let watchDebounce = null;
  if (fs.existsSync(BRAIN_DIR)) {
    try {
      fs.watch(BRAIN_DIR, { recursive: true }, () => {
        if (watchDebounce) clearTimeout(watchDebounce);
        watchDebounce = setTimeout(() => refreshAndBroadcast(false), 250);
      });
    } catch {
      // ignore watch error
    }
  }

  refreshAndBroadcast(true);
  setInterval(() => refreshAndBroadcast(false), 1000);

  server.listen(PORT, HOST, () => {
    console.log(`Agent Crossing standalone server running at http://${HOST}:${PORT}`);
  });
}
