import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { DatabaseSync } from 'node:sqlite';

export const TAIL_BYTES = 49152;
export const HEAD_BYTES = 12288;
export const ACTIVE_RECENT_MS = 15 * 60 * 1000;
export const IDLE_COFFEE_MS = 15 * 60 * 1000;
export const TRANSCRIPT_ACTIVE_MS = 14 * 1000;
export const PENDING_TOOL_ACTIVE_MS = 90 * 1000;

export const ISLAND_FRUITS = ['apple', 'orange', 'cherry', 'peach', 'pear'];

export const AGENT_SOURCES = {
  antigravity: { id: 'antigravity', label: 'Antigravity', shortLabel: 'AGY' },
  claude: { id: 'claude', label: 'Claude Code', shortLabel: 'Claude' },
  cursor: { id: 'cursor', label: 'Cursor', shortLabel: 'Cursor' },
  codex: { id: 'codex', label: 'Codex', shortLabel: 'Codex' },
};

export const SPECIES_NAME_POOLS = {
  en: {
    cat: ['Mochi', 'Yuzu', 'Cheddar', 'Latte', 'Miso', 'Ruby', 'Clover', 'Cloud'],
    shiba: ['Biscuit', 'Waffles', 'Maru', 'Pumpkin', 'Cookie', 'Nori', 'Mango', 'Sunny'],
    bunny: ['fluff', 'Sugar', 'Berry', 'Cream', 'Pebble', 'Peach', 'Pip', 'Daisy'].map(
      (n) => n[0].toUpperCase() + n.slice(1)
    ),
    bear: ['Honey', 'Acorn', 'Button', 'Maple', 'Teddy', 'Bambi', 'Cinnamon', 'Barney'],
    fox: ['Autumn', 'Hazel', 'Ember', 'Pine', 'Saffron', 'Copper', 'Apricot', 'Rusty'],
    frog: ['Sprout', 'Mint', 'Dewdrop', 'Fern', 'Puddle', 'clover', 'Moss', 'Pickle'].map(
      (n) => n[0].toUpperCase() + n.slice(1)
    ),
    squirrel: ['Chestnut', 'Peanut', 'Acorn', 'Nutmeg', 'Pecan', 'Tori', 'Crunch', 'Rye'],
    duck: ['Ripple', 'Marina', 'Lemon', 'Breeze', 'Ribbon', 'Billie', 'Quack', 'Pearl'],
  },
  ko: {
    cat: ['모카', '유자', '치즈', '밀크', '앙금', '루비', '달래', '구름'],
    shiba: ['보리', '콩이', '마루', '호박', '쿠키', '누룽', '망고', '다온'],
    bunny: ['솜이', '슈가', '딸기', '크림', '토토', '피치', '방울', '눈꽃'],
    bear: ['꿀비', '도토리', '단추', '메이플', '포근', '밤비', '시나몬', '뭉치'],
    fox: ['단풍', '호두', '노을', '솔잎', '홍시', '가을', '살구', '금빛'],
    frog: ['연두', '청이', '이슬', '미나리', '비온', '풀잎', '연잎', '초록'],
    squirrel: ['해바', '땅콩', '잣송', '다람', '피칸', '토리', '바삭', '호밀'],
    duck: ['둥실', '보트', '레몬', '물결', '리본', '산들', '꽥꽥', '소라'],
  },
};

export const ROLE_META = {
  mayor: {
    enShort: 'Mayor',
    enFull: 'Island Mayor',
    koShort: '촌장',
    koFull: '섬 대표 촌장',
  },
  curator: {
    enShort: 'Curator',
    enFull: 'Museum Curator',
    koShort: '학예',
    koFull: '박물관 학예사',
  },
  pilot: {
    enShort: 'Pilot',
    enFull: 'Dodo Seaplane Pilot',
    koShort: '항해',
    koFull: '비행장 항해사',
  },
  rescue: {
    enShort: 'Rescue',
    enFull: 'Rescue Specialist',
    koShort: '점검',
    koFull: '구조·점검반',
  },
  atelier: {
    enShort: 'Atelier',
    enFull: 'Design Artisan',
    koShort: '공방',
    koFull: '디자인 공방지기',
  },
  secretary: {
    enShort: 'Planner',
    enFull: 'Resident Services Aide',
    koShort: '안내',
    koFull: '안내소 비서',
  },
  helper: {
    enShort: 'Helper',
    enFull: 'DIY Island Helper',
    koShort: '조수',
    koFull: '마을 DIY 조수',
  },
};

export const ACTION_LABELS_EN = {
  reading: 'Reading Docs & Code',
  crafting: 'Crafting Code (DIY)',
  command: 'Running Terminal',
  exploring: 'Exploring Outside',
  coordinating: 'Rallying Villagers',
  planning: 'Planning at Plaza',
  tool: 'Using Island Tool',
  thinking: 'Brainstorming Ideas',
  error: 'Error · Needs Check',
  coffee: 'Tea Time on Porch',
  sleeping: 'Napping at Home',
};

const DEFAULT_TOPIC_BY_ROLE_EN = {
  curator: 'Codebase Research',
  pilot: 'Browser Recon',
  rescue: 'Verify & Debug',
  atelier: 'UI & Style Craft',
  secretary: 'Plan Coordination',
  helper: 'Task Delegation',
  mayor: 'New Session Topic',
};

const SPECIES_KEYS = Object.keys(SPECIES_NAME_POOLS.en);

let agyDbInstance = null;
let agyDbPathCached = '';
let lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
const transcriptCache = new Map();
const headTailCache = new Map();
const cursorDbCache = new Map();

export function hashStr(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getIslandFruit(islandId) {
  return ISLAND_FRUITS[hashStr(islandId) % ISLAND_FRUITS.length];
}

export function truncateText(text, max = 28) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

export function unwrapArg(v) {
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

export function safeBasename(rawPath, fallback = '') {
  const unwrapped = unwrapArg(rawPath);
  if (!unwrapped) return fallback;
  if (Array.isArray(unwrapped)) {
    return unwrapped.map((item) => String(item)).join(', ');
  }
  if (typeof unwrapped === 'object') {
    const candidate =
      unwrapped.path ||
      unwrapped.file_path ||
      unwrapped.Path ||
      unwrapped.target_file ||
      unwrapped.command ||
      unwrapped.cmd ||
      '';
    if (candidate) return safeBasename(candidate, fallback);
    return fallback;
  }
  const str = String(unwrapped).replace(/\\/g, '/').replace(/\/+$/, '');
  if (!str) return fallback;
  const idx = str.lastIndexOf('/');
  return idx >= 0 ? str.slice(idx + 1) || fallback : str;
}

export function normalizeUri(raw) {
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
  // On Windows paths like /c:/Users/... strip leading slash
  if (/^\/[A-Za-z]:[\\/]/.test(stripped)) {
    stripped = stripped.slice(1);
  }
  const displayPath = stripped.replace(/\\/g, '/').replace(/\/+$/, '');
  return {
    key: displayPath.toLowerCase(),
    displayPath,
  };
}

export function parseTimestampMs(ts) {
  if (typeof ts === 'number' && Number.isFinite(ts)) {
    return ts > 1e12 ? ts : ts * 1000;
  }
  if (!ts) return 0;
  const normalized = String(ts).replace(' ', 'T');
  const parsed = Date.parse(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatRelativeEn(ageMs) {
  if (ageMs < 60_000) return 'Active just now';
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m ago`;
  if (ageMs < 86_400_000) return `${Math.floor(ageMs / 3_600_000)}h ago`;
  return `${Math.floor(ageMs / 86_400_000)}d ago`;
}

function getEnvPaths() {
  const fixturesDir = process.env.AGENT_CROSSING_FIXTURES_DIR
    ? path.resolve(process.env.AGENT_CROSSING_FIXTURES_DIR)
    : '';

  if (fixturesDir) {
    const agyDir = path.join(fixturesDir, 'antigravity');
    return {
      isFixtureMode: true,
      antigravityDir: agyDir,
      antigravityProjectsDir: path.join(agyDir, 'projects'),
      antigravityDbPath: path.join(agyDir, 'conversation_summaries.db'),
      antigravityBrainDir: path.join(agyDir, 'brain'),
      claudeDir: path.join(fixturesDir, 'claude'),
      cursorDotDir: path.join(fixturesDir, 'cursor', 'dot-cursor'),
      cursorUserDir: path.join(fixturesDir, 'cursor', 'user-data'),
      codexDir: path.join(fixturesDir, 'codex'),
    };
  }

  let agyDir = '';
  const execDataDir = process.env.ANTIGRAVITY_EXECUTABLE_DATA_DIR;
  if (execDataDir) {
    for (let d = execDataDir; d !== path.dirname(d); d = path.dirname(d)) {
      if (path.basename(d) === 'sidecar_data') {
        agyDir = path.dirname(d);
        break;
      }
    }
  }
  const home = os.homedir();
  const geminiBase = path.join(home, '.gemini');
  if (!agyDir) {
    for (const name of ['antigravity', 'antigravity-ide', 'antigravity-cli']) {
      const candidate = path.join(geminiBase, name);
      if (fs.existsSync(path.join(candidate, 'conversation_summaries.db'))) {
        agyDir = candidate;
        break;
      }
    }
    if (!agyDir) agyDir = path.join(geminiBase, 'antigravity');
  }

  const geminiDir = path.dirname(agyDir);
  const agyProjectsDir = fs.existsSync(path.join(geminiDir, 'config', 'projects'))
    ? path.join(geminiDir, 'config', 'projects')
    : path.join(geminiBase, 'config', 'projects');

  let defaultCursorUser = '';
  if (process.platform === 'win32') {
    defaultCursorUser = path.join(process.env.APPDATA || path.join(home, 'AppData', 'Roaming'), 'Cursor', 'User');
  } else if (process.platform === 'darwin') {
    defaultCursorUser = path.join(home, 'Library', 'Application Support', 'Cursor', 'User');
  } else {
    defaultCursorUser = path.join(home, '.config', 'Cursor', 'User');
  }

  return {
    isFixtureMode: false,
    antigravityDir: agyDir,
    antigravityProjectsDir: agyProjectsDir,
    antigravityDbPath: path.join(agyDir, 'conversation_summaries.db'),
    antigravityBrainDir: path.join(agyDir, 'brain'),
    claudeDir: process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'),
    cursorDotDir: process.env.CURSOR_DOT_DIR || path.join(home, '.cursor'),
    cursorUserDir: process.env.CURSOR_DATA_DIR || defaultCursorUser,
    codexDir: process.env.CODEX_HOME || path.join(home, '.codex'),
  };
}

export function getWatchRoots() {
  const paths = getEnvPaths();
  return [
    paths.antigravityBrainDir,
    path.join(paths.claudeDir, 'projects'),
    path.join(paths.cursorDotDir, 'projects'),
    path.join(paths.codexDir, 'sessions'),
  ].filter((p) => p && fs.existsSync(p));
}

export function resolveVillagerRole(isSubagent, agentName = '', title = '') {
  if (!isSubagent) {
    return { roleCode: 'mayor', ...ROLE_META.mayor };
  }
  const source = `${agentName} ${title}`;
  if (/research|explore|investigat|analyz|audit|read|scholar|search/i.test(source)) {
    return { roleCode: 'curator', ...ROLE_META.curator };
  }
  if (/browser|web|fetch|scrape|navigat|pilot/i.test(source)) {
    return { roleCode: 'pilot', ...ROLE_META.pilot };
  }
  if (/test|verif|debug|fix|check|guard|review|monitor|qa/i.test(source)) {
    return { roleCode: 'rescue', ...ROLE_META.rescue };
  }
  if (/image|design|ui|ux|style|art|craft|css|visual|impeccable|hallmark/i.test(source)) {
    return { roleCode: 'atelier', ...ROLE_META.atelier };
  }
  if (/plan|coord|lead|architect|orchestr|swarm/i.test(source)) {
    return { roleCode: 'secretary', ...ROLE_META.secretary };
  }
  return { roleCode: 'helper', ...ROLE_META.helper };
}

export function cleanQuestTopic(rawTitle, roleCode, isSubagent) {
  let text = String(rawTitle || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_#]/g, ' ')
    .replace(/https?:\/\/([^\s]+)/gi, (_, rest) => {
      const cleaned = rest.replace(/\.git$/i, '').replace(/\/+$/, '');
      const parts = cleaned.split('/').filter(Boolean);
      return parts.length > 0 ? parts[parts.length - 1] : cleaned;
    })
    .replace(/[A-Za-z]:\\(?:[^\s\\]+\\)+([^\s\\]+)/g, '$1')
    .replace(/(?:^|\s)\/(?:Users|home|var|tmp|opt|etc|mnt)(?:\/[^\s/]+)+\/([^\s/]+)/g, ' $1')
    .replace(/\s+/g, ' ')
    .trim();

  if (
    isSubagent &&
    (!text || /^(subagent|self|research|browser|explorer|builder|verifier|helper|agent|sidechain)$/i.test(text))
  ) {
    text = DEFAULT_TOPIC_BY_ROLE_EN[roleCode] || DEFAULT_TOPIC_BY_ROLE_EN.helper;
    return {
      questTitle: text,
      doorplateLabel: text.slice(0, 14),
      topicKey: `sub_${roleCode}`,
    };
  }

  // Strip polite Korean & English conversational boilerplate while keeping meaningful action nouns
  text = text
    .replace(/^(지금|일단|먼저|혹시|자,|그럼|여기서|현재)\s+/g, '')
    .replace(/^(이\s*레포를|프로젝트\s*안에|저장소에|여기에)\s+/g, '')
    .replace(/^(please|can you|could you|would you|help me|i want you to|i need you to|let's|lets)\s+/gi, '')
    .replace(
      /\s*(좀\s*)?(해\s*주세요|해주세요|해\s*줘|해줘|알려\s*주세요|알려줘|보여\s*줘|부탁해요|부탁해|부탁드립니다|고쳐줘|만들어줘|작성해줘)\.?$/g,
      ''
    )
    .replace(/\s*(해\s*보자면|보자면|정리해줘|확인해줘)\.?$/g, '')
    .replace(/[?!.]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    const fallback = isSubagent
      ? DEFAULT_TOPIC_BY_ROLE_EN[roleCode] || DEFAULT_TOPIC_BY_ROLE_EN.helper
      : DEFAULT_TOPIC_BY_ROLE_EN.mayor;
    return {
      questTitle: fallback,
      doorplateLabel: fallback.slice(0, 14),
      topicKey: isSubagent ? `sub_${roleCode}` : 'new_chat',
    };
  }

  const doorplateRaw = text.replace(/^(현재|새로운|기존|the|a|an)\s+/i, '').trim();
  const hasCjk = /[\u3131-\uD79D\u3040-\u30FF\u4E00-\u9FFF]/.test(doorplateRaw);
  const maxDoorplate = hasCjk ? 9 : 15;

  return {
    questTitle: truncateText(text, 36),
    doorplateLabel: truncateText(doorplateRaw || text, maxDoorplate),
    topicKey: '',
  };
}

export function mapUniversalTool(toolName, rawArgs = {}) {
  const name = String(toolName || '').trim();
  const lower = name.toLowerCase();
  const args = rawArgs && typeof rawArgs === 'object' ? rawArgs : {};

  const firstTarget =
    args.Path ||
    args.path ||
    args.file_path ||
    args.target_file ||
    args.relative_workspace_path ||
    args.target_directory ||
    args.DirectoryPath ||
    args.Uri ||
    args.uri ||
    args.notebook_path ||
    args.ServerName ||
    '';

  if (
    lower === 'read_file' ||
    lower === 'read_file_v2' ||
    lower === 'view_file' ||
    lower === 'read' ||
    lower === 'view' ||
    lower === 'grep' ||
    lower === 'glob' ||
    lower === 'ls' ||
    lower === 'notebookread' ||
    lower === 'toolsearch' ||
    lower === 'grep_search' ||
    lower === 'ripgrep_raw_search' ||
    lower === 'file_search' ||
    lower === 'glob_file_search' ||
    lower === 'list_dir' ||
    lower === 'list_dir_v2' ||
    lower === 'codebase_search' ||
    lower === 'semantic_search_full' ||
    lower === 'read_lints' ||
    lower === 'grep_files' ||
    lower === 'view_image' ||
    lower === 'search_query' ||
    lower === 'list_resources' ||
    lower === 'read_resource' ||
    /^(inspect_|list_|procedure_|search_procedures|search_strings|read_|find_xrefs)/.test(lower)
  ) {
    const target = safeBasename(
      firstTarget || args.pattern || args.query || args.glob || args.files_path,
      name || 'files'
    );
    return {
      activity: 'reading',
      station: 'bookshelf',
      icon: 'book',
      actionKey: 'reading',
      actionLabel: ACTION_LABELS_EN.reading,
      detail: truncateText(target, 26),
    };
  }

  if (
    lower === 'edit_file' ||
    lower === 'edit_file_v2' ||
    lower === 'write_file' ||
    lower === 'edit' ||
    lower === 'multiedit' ||
    lower === 'write' ||
    lower === 'notebookedit' ||
    lower === 'search_replace' ||
    lower === 'reapply' ||
    lower === 'delete_file' ||
    lower === 'apply_patch' ||
    lower === 'create_file'
  ) {
    let target = safeBasename(firstTarget, '');
    if (!target && typeof args.input === 'string') {
      const m = args.input.match(/\*\*\* (?:Update|Add|Delete) File:\s*([^\r\n]+)/);
      if (m) target = safeBasename(m[1], 'patch');
    }
    return {
      activity: 'crafting',
      station: 'workbench',
      icon: 'hammer',
      actionKey: 'crafting',
      actionLabel: ACTION_LABELS_EN.crafting,
      detail: truncateText(target || 'file', 26),
    };
  }

  if (
    lower === 'run_command' ||
    lower === 'manage_task' ||
    lower === 'bash' ||
    lower === 'bashoutput' ||
    lower === 'killshell' ||
    lower === 'run_terminal_cmd' ||
    lower === 'run_terminal_command' ||
    lower === 'run_terminal_command_v2' ||
    lower === 'shell' ||
    lower === 'exec_command' ||
    lower === 'local_shell_call' ||
    lower === 'write_stdin' ||
    lower === 'container.exec'
  ) {
    const cmdText =
      unwrapArg(args.toolSummary) ||
      unwrapArg(args.description) ||
      unwrapArg(args.explanation) ||
      unwrapArg(args.CommandLine) ||
      unwrapArg(args.command) ||
      unwrapArg(args.cmd) ||
      unwrapArg(args.Action) ||
      'command';
    const displayCmd = Array.isArray(cmdText) ? cmdText.join(' ') : String(cmdText);
    return {
      activity: 'command',
      station: 'generator',
      icon: 'gear',
      actionKey: 'command',
      actionLabel: ACTION_LABELS_EN.command,
      detail: truncateText(displayCmd, 28),
    };
  }

  if (
    lower === 'search_web' ||
    lower === 'search_marketplace' ||
    lower === 'websearch' ||
    lower === 'webfetch' ||
    lower === 'web_search' ||
    lower === 'web_search_call' ||
    lower === 'fetch_web' ||
    lower === 'open_url' ||
    lower.includes('browser') ||
    lower.includes('playwright')
  ) {
    const query = unwrapArg(args.query) || unwrapArg(args.queries) || unwrapArg(args.url) || unwrapArg(args.search_term) || 'web search';
    return {
      activity: 'exploring',
      station: 'airport',
      icon: 'plane',
      actionKey: 'exploring',
      actionLabel: ACTION_LABELS_EN.exploring,
      detail: truncateText(Array.isArray(query) ? query.join(', ') : query, 28),
    };
  }

  if (
    lower === 'invoke_subagent' ||
    lower === 'send_message' ||
    lower === 'swarm' ||
    lower === 'run_workflow' ||
    lower === 'manage_subagents' ||
    lower === 'task' ||
    lower === 'agent' ||
    lower === 'dispatch_agent' ||
    lower === 'sendmessage' ||
    lower === 'teamcreate' ||
    lower === 'start_subagent' ||
    lower === 'delegate_task' ||
    lower === 'spawn_agent'
  ) {
    const role =
      unwrapArg(args.Role) ||
      unwrapArg(args.subagent_type) ||
      unwrapArg(args.TypeName) ||
      unwrapArg(args.description) ||
      unwrapArg(args.action) ||
      'teamwork';
    return {
      activity: 'coordinating',
      station: 'board',
      icon: 'megaphone',
      actionKey: 'coordinating',
      actionLabel: ACTION_LABELS_EN.coordinating,
      detail: truncateText(role, 26),
    };
  }

  if (
    lower === 'exit_plan_mode' ||
    lower === 'enter_plan_mode' ||
    lower === 'ask_question' ||
    lower === 'todowrite' ||
    lower === 'todoread' ||
    lower === 'exitplanmode' ||
    lower === 'enterplanmode' ||
    lower === 'askuserquestion' ||
    lower === 'todo_write' ||
    lower === 'create_plan' ||
    lower === 'update_plan' ||
    lower === 'request_user_input'
  ) {
    return {
      activity: 'planning',
      station: 'board',
      icon: 'clipboard',
      actionKey: 'planning',
      actionLabel: ACTION_LABELS_EN.planning,
      detail: lower.includes('question') || lower.includes('input') ? 'Question ready' : 'Updating plan',
    };
  }

  const fallback = unwrapArg(args.ToolName) || name || 'Tool call';
  return {
    activity: 'crafting',
    station: 'workbench',
    icon: 'sparkle',
    actionKey: 'tool',
    actionLabel: ACTION_LABELS_EN.tool,
    detail: truncateText(fallback, 24),
  };
}

function buildIdleState(ageMs) {
  const rel = formatRelativeEn(ageMs);
  if (ageMs < IDLE_COFFEE_MS) {
    return {
      activity: 'coffee',
      station: 'home',
      icon: 'coffee',
      actionKey: 'coffee',
      actionLabel: ACTION_LABELS_EN.coffee,
      detail: rel,
      ageMs,
    };
  }
  return {
    activity: 'sleeping',
    station: 'home',
    icon: 'zzz',
    actionKey: 'sleeping',
    actionLabel: ACTION_LABELS_EN.sleeping,
    detail: rel,
    ageMs,
  };
}

function createFeedBuilder() {
  const rawFeed = [];
  return {
    push(time, icon, actionKey, baseDetail, fullDetail = '') {
      const prev = rawFeed[rawFeed.length - 1];
      if (prev && prev.actionKey === actionKey && prev.baseDetail === baseDetail) {
        prev.count += 1;
        if (!prev.fullDetail && fullDetail) prev.fullDetail = fullDetail;
        return;
      }
      rawFeed.push({
        time: time || '',
        icon,
        actionKey,
        label: ACTION_LABELS_EN[actionKey] || ACTION_LABELS_EN.tool,
        baseDetail: baseDetail || '',
        fullDetail: fullDetail || '',
        count: 1,
      });
    },
    size() {
      return rawFeed.length;
    },
    build() {
      return rawFeed.map(({ time, icon, actionKey, label, baseDetail, fullDetail, count }) => ({
        time,
        icon,
        actionKey,
        label,
        baseDetail,
        count,
        detail: count > 1 && baseDetail ? `${baseDetail} (×${count})` : baseDetail,
        ...(fullDetail ? { fullDetail } : {}),
      }));
    },
  };
}

function readJsonlHeadAndTail(filePath) {
  let stat;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return null;
  }
  if (!stat.isFile() || stat.size === 0) return null;

  const cached = headTailCache.get(filePath);
  if (cached && cached.size === stat.size && cached.mtimeMs === stat.mtimeMs) {
    return cached;
  }

  let fd;
  let headText = '';
  let tailText = '';
  try {
    fd = fs.openSync(filePath, 'r');
    const headLen = Math.min(stat.size, HEAD_BYTES);
    const headBuf = Buffer.allocUnsafe(headLen);
    const hBytes = fs.readSync(fd, headBuf, 0, headLen, 0);
    headText = headBuf.toString('utf8', 0, hBytes);

    if (stat.size <= HEAD_BYTES + TAIL_BYTES) {
      const restLen = Math.max(0, stat.size - headLen);
      if (restLen > 0) {
        const restBuf = Buffer.allocUnsafe(restLen);
        const rBytes = fs.readSync(fd, restBuf, 0, restLen, headLen);
        tailText = `${headText}${restBuf.toString('utf8', 0, rBytes)}`;
      } else {
        tailText = headText;
      }
    } else {
      const tailOffset = Math.max(0, stat.size - TAIL_BYTES);
      const tailLen = stat.size - tailOffset;
      const tailBuf = Buffer.allocUnsafe(tailLen);
      const tBytes = fs.readSync(fd, tailBuf, 0, tailLen, tailOffset);
      tailText = tailBuf.toString('utf8', 0, tBytes);
    }
  } catch {
    return null;
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd);
      } catch {
        // ignore close errors
      }
    }
  }

  const parseLines = (raw, dropFirstPartial = false) => {
    const lines = raw.split(/\r?\n/);
    if (dropFirstPartial && lines.length > 0) lines.shift();
    const out = [];
    for (const line of lines) {
      const t = line.trim();
      if (!t || !t.startsWith('{')) continue;
      try {
        out.push(JSON.parse(t));
      } catch {
        // skip truncated boundary line
      }
    }
    return out;
  };

  const entry = {
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    headItems: parseLines(headText, false),
    tailItems: parseLines(tailText, stat.size > HEAD_BYTES + TAIL_BYTES),
  };

  if (headTailCache.size > 400) {
    headTailCache.clear();
  }
  headTailCache.set(filePath, entry);
  return entry;
}

function walkFilesBounded(dir, matcher, maxFiles = 100, maxDepth = 4) {
  const results = [];
  if (!dir || !fs.existsSync(dir)) return results;

  const stack = [{ current: dir, depth: 0 }];
  while (stack.length > 0 && results.length < maxFiles) {
    const { current, depth } = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    // Descending sort helps YYYY/MM/DD folder walks hit newest logs first
    entries.sort((a, b) => b.name.localeCompare(a.name));
    for (const ent of entries) {
      const fullPath = path.join(current, ent.name);
      if (ent.isDirectory()) {
        if (depth < maxDepth) stack.push({ current: fullPath, depth: depth + 1 });
      } else if (ent.isFile() && matcher(ent.name, fullPath)) {
        try {
          const stat = fs.statSync(fullPath);
          results.push({ path: fullPath, name: ent.name, mtimeMs: stat.mtimeMs, size: stat.size });
        } catch {
          // skip unreadable file
        }
      }
    }
  }

  results.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return results.slice(0, maxFiles);
}

// ============================================================================
// 1. ANTIGRAVITY ADAPTER
// ============================================================================

function getAntigravityDb(dbPath) {
  if (agyDbInstance && agyDbPathCached === dbPath) return agyDbInstance;
  if (agyDbInstance) {
    try {
      agyDbInstance.close();
    } catch {
      // ignore
    }
    agyDbInstance = null;
  }
  agyDbPathCached = dbPath;

  if (!fs.existsSync(dbPath)) {
    lastDbDiagnostic = { ok: true, missingFile: true, message: '' };
    return null;
  }
  try {
    agyDbInstance = new DatabaseSync(dbPath, { readOnly: true, readBigInts: true });
    lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
    return agyDbInstance;
  } catch (err) {
    agyDbInstance = null;
    lastDbDiagnostic = {
      ok: false,
      missingFile: false,
      message: truncateText(err?.message || 'Unable to open Antigravity summary DB.', 120),
    };
    return null;
  }
}

function resetAntigravityDb() {
  if (agyDbInstance) {
    try {
      agyDbInstance.close();
    } catch {
      // ignore
    }
    agyDbInstance = null;
  }
}

function extractAgyErrorInfo(steps, errIndex) {
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
          ? `${toolName} error`
          : 'Step execution error';
  return {
    short: truncateText(combined, 32),
    full: truncateText(combined, 220),
  };
}

function readAgyTranscriptTail(brainDir, conversationId) {
  const transcriptPath = path.join(brainDir, conversationId, '.system_generated', 'logs', 'transcript.jsonl');
  if (!fs.existsSync(transcriptPath)) return null;

  let stat;
  try {
    stat = fs.statSync(transcriptPath);
  } catch {
    return null;
  }

  const cached = transcriptCache.get(transcriptPath);
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
  if (startOffset > 0 && lines.length > 0) lines.shift();

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

  const feedBuilder = createFeedBuilder();
  for (let i = steps.length - 1; i >= 0 && feedBuilder.size() < 6; i -= 1) {
    const step = steps[i];
    if (step.type === 'PLANNER_RESPONSE' && Array.isArray(step.tool_calls) && step.tool_calls.length > 0) {
      for (let j = step.tool_calls.length - 1; j >= 0 && feedBuilder.size() < 6; j -= 1) {
        const mapped = mapUniversalTool(step.tool_calls[j]?.name, step.tool_calls[j]?.args);
        feedBuilder.push(step.created_at || '', mapped.icon, mapped.actionKey, mapped.detail);
      }
    } else if (step.status === 'ERROR') {
      const errInfo = extractAgyErrorInfo(steps, i);
      feedBuilder.push(step.created_at || '', 'sweat', 'error', errInfo.short, errInfo.full);
    }
  }

  const entry = {
    size: stat.size,
    mtimeMs: stat.mtimeMs,
    steps,
    feed: feedBuilder.build(),
  };
  transcriptCache.set(transcriptPath, entry);
  return entry;
}

function inspectAgyTranscript(brainDir, conversationId, isRunning, lastModifiedMs) {
  const now = Date.now();
  const tail = readAgyTranscriptTail(brainDir, conversationId);
  const steps = tail?.steps || [];
  const latest = steps.length > 0 ? steps[steps.length - 1] : null;
  const effectiveAgeMs = Math.max(0, now - Math.max(lastModifiedMs || 0, tail?.mtimeMs || 0));

  if (latest?.status === 'ERROR') {
    const errInfo = extractAgyErrorInfo(steps, steps.length - 1);
    return {
      state: {
        activity: 'error',
        station: 'generator',
        icon: 'sweat',
        actionKey: 'error',
        actionLabel: ACTION_LABELS_EN.error,
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
        state: mapUniversalTool(chosenTool.name, chosenTool.args),
        isActive: true,
        feed: tail?.feed || [],
      };
    }

    return {
      state: {
        activity: 'thinking',
        station: 'board',
        icon: 'thought',
        actionKey: 'thinking',
        actionLabel: ACTION_LABELS_EN.thinking,
        detail: 'Planning next step...',
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

function collectAntigravityData(paths) {
  const registeredProjects = [];
  if (fs.existsSync(paths.antigravityProjectsDir)) {
    try {
      const files = fs.readdirSync(paths.antigravityProjectsDir).filter((n) => n.endsWith('.json'));
      for (const file of files) {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(paths.antigravityProjectsDir, file), 'utf8'));
          if (data.sidecar) continue;
          const folderUri = data.projectResources?.resources?.[0]?.folderUri || '';
          const { key: folderKey, displayPath: folderPath } = normalizeUri(folderUri);
          const islandId = String(data.id || file.replace(/\.json$/, ''));
          registeredProjects.push({
            id: islandId,
            name: String(data.name || (folderPath ? safeBasename(folderPath, islandId) : islandId)),
            folderKey,
            folderPath,
            source: 'antigravity',
          });
        } catch {
          // ignore corrupt project JSON
        }
      }
    } catch {
      // ignore read failure
    }
  }

  const sessions = [];
  const db = getAntigravityDb(paths.antigravityDbPath);
  if (db) {
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

      for (const r of rows) {
        const conversationId = String(r.conversation_id);
        const lastModifiedTime = String(r.last_modified_time || '');
        const lastModifiedMs = parseTimestampMs(lastModifiedTime);
        const status = String(r.status || '');
        const notFullyIdle = Number(r.not_fully_idle || 0);
        const isRunningFlag = status === 'CASCADE_RUN_STATUS_RUNNING' || notFullyIdle === 1;
        const inspected = inspectAgyTranscript(paths.antigravityBrainDir, conversationId, isRunningFlag, lastModifiedMs);
        const { key: folderKey, displayPath: folderPath } = normalizeUri(r.workspace_uris);

        sessions.push({
          conversationId,
          agentSource: 'antigravity',
          projectId: String(r.project_id || ''),
          folderKey,
          folderPath,
          title: String(r.title || r.preview || ''),
          agentName: String(r.agent_name || ''),
          isSubagent: Number(r.nesting_depth || 0) > 0,
          parentConversationId: String(r.parent_conversation_id || ''),
          stepCount: Number(r.step_count || 0),
          status,
          isRunning: Boolean(isRunningFlag || inspected.isActive),
          lastModifiedTime,
          lastModifiedMs,
          state: inspected.state,
          feed: inspected.feed,
        });
      }
      lastDbDiagnostic = { ok: true, missingFile: false, message: '' };
    } catch (err) {
      lastDbDiagnostic = {
        ok: false,
        missingFile: false,
        message: truncateText(err?.message || 'Antigravity DB query error.', 120),
      };
      resetAntigravityDb();
    }
  }

  return { registeredProjects, sessions };
}

// ============================================================================
// 2. CLAUDE CODE ADAPTER (~/.claude/projects/*/*.jsonl)
// ============================================================================

function extractTextFromMessageContent(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  const parts = [];
  for (const item of content) {
    if (typeof item === 'string') {
      parts.push(item);
    } else if (item?.type === 'text' && item.text) {
      parts.push(item.text);
    }
  }
  return parts.join(' ');
}

function collectClaudeSessions(paths) {
  const projectsRoot = path.join(paths.claudeDir, 'projects');
  if (!fs.existsSync(projectsRoot)) return [];

  const files = walkFilesBounded(
    projectsRoot,
    (name) => name.endsWith('.jsonl'),
    60,
    4
  );

  const now = Date.now();
  const sessions = [];

  for (const fileInfo of files) {
    const parsed = readJsonlHeadAndTail(fileInfo.path);
    if (!parsed) continue;
    const allSamples = parsed.headItems.concat(parsed.tailItems);
    if (allSamples.length === 0) continue;

    let cwd = '';
    let firstUserPrompt = '';
    let sessionId = '';
    let isSubagent =
      fileInfo.path.includes(`${path.sep}subagents${path.sep}`) ||
      fileInfo.name.startsWith('agent-');
    let parentConversationId = '';
    let gitBranch = '';
    let lastTsMs = fileInfo.mtimeMs;
    let endedCleanly = false;
    let lastErrorText = '';
    let stepCount = 0;

    const toolResultsSeen = new Set();
    const pendingTools = [];
    const feedBuilder = createFeedBuilder();

    for (const item of parsed.headItems) {
      if (!cwd && item.cwd) cwd = String(item.cwd);
      if (!sessionId && item.sessionId) sessionId = String(item.sessionId);
      if (!gitBranch && item.gitBranch) gitBranch = String(item.gitBranch);
      if (item.isSidechain) isSubagent = true;
      if (!firstUserPrompt && item.type === 'user' && item.message) {
        const candidate = extractTextFromMessageContent(item.message.content)
          .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (candidate) firstUserPrompt = candidate;
      }
    }

    for (const item of parsed.tailItems) {
      if (!cwd && item.cwd) cwd = String(item.cwd);
      if (!sessionId && item.sessionId) sessionId = String(item.sessionId);
      if (item.isSidechain) isSubagent = true;
      if (item.timestamp) {
        const t = parseTimestampMs(item.timestamp);
        if (t > lastTsMs) lastTsMs = t;
      }
      if (item.type === 'user' || item.type === 'assistant') stepCount += 1;

      const content = item.message?.content;
      if (item.type === 'user' && Array.isArray(content)) {
        for (const block of content) {
          if (block?.type === 'tool_result' && block.tool_use_id) {
            toolResultsSeen.add(block.tool_use_id);
            if (block.is_error) {
              const errBody = typeof block.content === 'string'
                ? block.content
                : extractTextFromMessageContent(block.content);
              lastErrorText = errBody || 'Tool error';
            }
          }
        }
      }

      if (item.type === 'assistant' && Array.isArray(content)) {
        for (const block of content) {
          if (block?.type === 'tool_use') {
            pendingTools.push({
              id: block.id || '',
              name: block.name || 'tool',
              args: block.input || {},
              time: item.timestamp || '',
            });
          }
        }
      }
    }

    // Build reverse chronological feed from tail tool calls
    for (let i = pendingTools.length - 1; i >= 0 && feedBuilder.size() < 6; i -= 1) {
      const t = pendingTools[i];
      const mapped = mapUniversalTool(t.name, t.args);
      feedBuilder.push(t.time, mapped.icon, mapped.actionKey, mapped.detail);
    }

    const lastTail = parsed.tailItems[parsed.tailItems.length - 1];
    if (lastTail?.type === 'system' && lastTail?.subtype === 'turn_duration') {
      endedCleanly = true;
    } else if (lastTail?.type === 'assistant' && Array.isArray(lastTail?.message?.content)) {
      const blocks = lastTail.message.content;
      const hasToolUse = blocks.some((b) => b?.type === 'tool_use');
      if (!hasToolUse && lastTail.message?.stop_reason === 'end_turn') {
        endedCleanly = true;
      }
    }

    const unresolvedTool = [...pendingTools]
      .reverse()
      .find((t) => t.id && !toolResultsSeen.has(t.id));

    const effectiveAgeMs = Math.max(0, now - Math.max(fileInfo.mtimeMs, lastTsMs));
    const recentlyUpdated = effectiveAgeMs < TRANSCRIPT_ACTIVE_MS && !endedCleanly;
    const hasActiveTool = Boolean(unresolvedTool && effectiveAgeMs < PENDING_TOOL_ACTIVE_MS);
    const isActive = recentlyUpdated || hasActiveTool;

    let state;
    if (lastErrorText && lastTail?.type === 'user' && Array.isArray(lastTail?.message?.content) && lastTail.message.content.some((b) => b?.is_error)) {
      state = {
        activity: 'error',
        station: 'generator',
        icon: 'sweat',
        actionKey: 'error',
        actionLabel: ACTION_LABELS_EN.error,
        detail: truncateText(lastErrorText, 32),
        errorFull: truncateText(lastErrorText, 220),
      };
    } else if (isActive) {
      const chosen = unresolvedTool || pendingTools[pendingTools.length - 1];
      if (chosen) {
        state = mapUniversalTool(chosen.name, chosen.args);
      } else {
        state = {
          activity: 'thinking',
          station: 'board',
          icon: 'thought',
          actionKey: 'thinking',
          actionLabel: ACTION_LABELS_EN.thinking,
          detail: 'Reasoning in Claude Code...',
        };
      }
    } else {
      state = buildIdleState(effectiveAgeMs);
    }

    const { key: folderKey, displayPath: folderPath } = normalizeUri(cwd);
    const baseSessionId = sessionId || fileInfo.name.replace(/\.jsonl$/, '');
    const uniqueConvId = `claude:${isSubagent ? `${baseSessionId}:${fileInfo.name.replace(/\.jsonl$/, '')}` : baseSessionId}`;

    sessions.push({
      conversationId: uniqueConvId,
      agentSource: 'claude',
      projectId: folderKey ? `dir:${folderKey}` : `claude-slug:${path.basename(path.dirname(fileInfo.path))}`,
      folderKey,
      folderPath,
      fallbackSlugName: path.basename(path.dirname(fileInfo.path)).split('-').filter(Boolean).pop() || 'Claude Project',
      title: firstUserPrompt || `Claude Session ${baseSessionId.slice(0, 6)}`,
      agentName: isSubagent ? 'Claude Subagent' : 'Claude Code',
      isSubagent,
      parentConversationId: isSubagent && sessionId ? `claude:${sessionId}` : parentConversationId,
      stepCount: Math.max(stepCount, pendingTools.length),
      status: isActive ? 'RUNNING' : 'IDLE',
      isRunning: isActive,
      lastModifiedTime: new Date(lastTsMs || fileInfo.mtimeMs).toISOString(),
      lastModifiedMs: lastTsMs || fileInfo.mtimeMs,
      state,
      feed: feedBuilder.build(),
    });
  }

  return sessions;
}

// ============================================================================
// 3. CURSOR ADAPTER (workspaceStorage state.vscdb + .cursor/projects JSONL)
// ============================================================================

function toCursorSlug(folderPath) {
  return String(folderPath || '')
    .replace(/^\/+/, '')
    .replace(/[:\\/._ ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function readCursorWorkspaceStorage(paths) {
  const storageRoot = path.join(paths.cursorUserDir, 'workspaceStorage');
  const slugToFolder = new Map();
  const dbSessions = [];

  if (!fs.existsSync(storageRoot)) return { slugToFolder, dbSessions };

  let folders = [];
  try {
    folders = fs.readdirSync(storageRoot, { withFileTypes: true }).filter((d) => d.isDirectory());
  } catch {
    return { slugToFolder, dbSessions };
  }

  const now = Date.now();
  for (const dir of folders) {
    const dirPath = path.join(storageRoot, dir.name);
    const wsJsonPath = path.join(dirPath, 'workspace.json');
    if (!fs.existsSync(wsJsonPath)) continue;

    let folderUri = '';
    try {
      const wsJson = JSON.parse(fs.readFileSync(wsJsonPath, 'utf8'));
      folderUri = wsJson.folder || wsJson.workspace || '';
    } catch {
      continue;
    }

    const { key: folderKey, displayPath: folderPath } = normalizeUri(folderUri);
    if (!folderKey) continue;
    slugToFolder.set(toCursorSlug(folderPath), { folderKey, folderPath });

    const vscdbPath = path.join(dirPath, 'state.vscdb');
    if (!fs.existsSync(vscdbPath)) continue;

    let stat;
    try {
      stat = fs.statSync(vscdbPath);
    } catch {
      continue;
    }
    let walMtime = 0;
    try {
      const walPath = `${vscdbPath}-wal`;
      if (fs.existsSync(walPath)) walMtime = fs.statSync(walPath).mtimeMs;
    } catch {
      // ignore missing/unreadable wal
    }

    const cacheKey = vscdbPath;
    const cached = cursorDbCache.get(cacheKey);
    let composers = null;
    if (cached && cached.mtimeMs === stat.mtimeMs && cached.walMtime === walMtime) {
      composers = cached.composers;
    } else {
      let db;
      try {
        db = new DatabaseSync(vscdbPath, { readOnly: true });
        const row = db
          .prepare("SELECT value FROM ItemTable WHERE key = 'composer.composerData'")
          .get();
        if (row?.value) {
          const parsed = JSON.parse(String(row.value));
          composers = Array.isArray(parsed?.allComposers) ? parsed.allComposers : [];
        } else {
          composers = [];
        }
      } catch {
        composers = [];
      } finally {
        if (db) {
          try {
            db.close();
          } catch {
            // ignore
          }
        }
      }
      cursorDbCache.set(cacheKey, { mtimeMs: stat.mtimeMs, walMtime, composers });
    }

    for (const comp of composers) {
      if (!comp?.composerId) continue;
      const lastUpdatedMs = parseTimestampMs(comp.lastUpdatedAt || comp.createdAt || stat.mtimeMs);
      const effectiveAgeMs = Math.max(0, now - lastUpdatedMs);
      const isGenerating = Boolean(
        comp.isGenerating ||
          comp.status === 'generating' ||
          comp.status === 'running' ||
          comp.unifiedMode === 'running'
      );
      dbSessions.push({
        composerId: String(comp.composerId),
        conversationId: `cursor:${comp.composerId}`,
        agentSource: 'cursor',
        projectId: `dir:${folderKey}`,
        folderKey,
        folderPath,
        title: String(comp.name || comp.text || 'Cursor Agent'),
        agentName: comp.unifiedMode === 'agent' ? 'Cursor Agent' : 'Cursor Composer',
        isSubagent: false,
        parentConversationId: '',
        stepCount: Number(comp.conversationLength || 1),
        status: isGenerating ? 'RUNNING' : 'IDLE',
        isRunning: isGenerating,
        lastModifiedTime: lastUpdatedMs ? new Date(lastUpdatedMs).toISOString() : '',
        lastModifiedMs: lastUpdatedMs,
        state: isGenerating
          ? {
              activity: 'thinking',
              station: 'board',
              icon: 'thought',
              actionKey: 'thinking',
              actionLabel: ACTION_LABELS_EN.thinking,
              detail: 'Generating in Cursor...',
            }
          : buildIdleState(effectiveAgeMs),
        feed: [],
      });
    }
  }

  return { slugToFolder, dbSessions };
}

function collectCursorSessions(paths) {
  const { slugToFolder, dbSessions } = readCursorWorkspaceStorage(paths);
  const byComposerId = new Map();
  for (const s of dbSessions) {
    byComposerId.set(s.composerId, s);
  }

  const cursorProjectsRoot = path.join(paths.cursorDotDir, 'projects');
  if (fs.existsSync(cursorProjectsRoot)) {
    const files = walkFilesBounded(
      cursorProjectsRoot,
      (name, fullPath) =>
        name.endsWith('.jsonl') && fullPath.toLowerCase().includes('agent-transcripts'),
      60,
      4
    );

    const now = Date.now();
    for (const fileInfo of files) {
      const parsed = readJsonlHeadAndTail(fileInfo.path);
      if (!parsed) continue;

      // Determine slug folder immediately under ~/.cursor/projects/<slug>/...
      const rel = path.relative(cursorProjectsRoot, fileInfo.path);
      const slug = rel.split(path.sep)[0] || '';
      const mappedFolder = slugToFolder.get(slug.toLowerCase()) || null;

      let inferredCwd = mappedFolder?.folderPath || '';
      let firstUserPrompt = '';
      let lastTsMs = fileInfo.mtimeMs;
      let stepCount = 0;
      const tools = [];
      const feedBuilder = createFeedBuilder();
      let isSubagent = fileInfo.name.includes('subagent') || rel.includes(`${path.sep}subagents${path.sep}`);

      for (const item of parsed.headItems) {
        if (!inferredCwd && item.cwd) inferredCwd = String(item.cwd);
        if (item.isSubagent || item.isSidechain) isSubagent = true;
        if (!firstUserPrompt && (item.role === 'user' || item.type === 'user')) {
          const rawTxt = extractTextFromMessageContent(item.message?.content ?? item.content);
          const clean = rawTxt
            .replace(/<user_query>|<\/user_query>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (clean) firstUserPrompt = clean;
        }
      }

      for (const item of parsed.tailItems) {
        if (item.timestamp) {
          const t = parseTimestampMs(item.timestamp);
          if (t > lastTsMs) lastTsMs = t;
        }
        stepCount += 1;
        const content = item.message?.content ?? item.content;
        if (Array.isArray(content)) {
          for (const block of content) {
            if (block?.type === 'tool_use') {
              tools.push({ name: block.name || 'tool', args: block.input || {}, time: item.timestamp || '' });
            }
          }
        }
        if (item.tool_name || item.tool) {
          tools.push({
            name: item.tool_name || item.tool,
            args: item.args || item.input || {},
            time: item.timestamp || '',
          });
        }
      }

      for (let i = tools.length - 1; i >= 0 && feedBuilder.size() < 6; i -= 1) {
        const mapped = mapUniversalTool(tools[i].name, tools[i].args);
        feedBuilder.push(tools[i].time, mapped.icon, mapped.actionKey, mapped.detail);
      }

      const composerId = fileInfo.name.replace(/\.jsonl$/, '');
      const existing = byComposerId.get(composerId);
      const effectiveAgeMs = Math.max(0, now - Math.max(fileInfo.mtimeMs, lastTsMs));
      const recentlyActive = effectiveAgeMs < TRANSCRIPT_ACTIVE_MS;
      const isRunning = Boolean(existing?.isRunning || recentlyActive);

      const state = isRunning
        ? tools.length > 0
          ? mapUniversalTool(tools[tools.length - 1].name, tools[tools.length - 1].args)
          : {
              activity: 'thinking',
              station: 'board',
              icon: 'thought',
              actionKey: 'thinking',
              actionLabel: ACTION_LABELS_EN.thinking,
              detail: 'Running in Cursor...',
            }
        : buildIdleState(effectiveAgeMs);

      const { key: folderKey, displayPath: folderPath } = normalizeUri(inferredCwd);
      byComposerId.set(composerId, {
        conversationId: `cursor:${composerId}`,
        agentSource: 'cursor',
        projectId: folderKey ? `dir:${folderKey}` : `cursor-slug:${slug || composerId}`,
        folderKey,
        folderPath,
        fallbackSlugName: slug ? slug.split('-').filter(Boolean).pop() || 'Cursor Project' : 'Cursor Workspace',
        title: existing?.title || firstUserPrompt || 'Cursor Agent Task',
        agentName: existing?.agentName || (isSubagent ? 'Cursor Subagent' : 'Cursor Agent'),
        isSubagent,
        parentConversationId: '',
        stepCount: Math.max(existing?.stepCount || 0, stepCount),
        status: isRunning ? 'RUNNING' : 'IDLE',
        isRunning,
        lastModifiedTime: new Date(lastTsMs || fileInfo.mtimeMs).toISOString(),
        lastModifiedMs: Math.max(existing?.lastModifiedMs || 0, lastTsMs || fileInfo.mtimeMs),
        state,
        feed: feedBuilder.size() > 0 ? feedBuilder.build() : existing?.feed || [],
      });
    }
  }

  return Array.from(byComposerId.values());
}

// ============================================================================
// 4. OPENAI CODEX CLI ADAPTER ($CODEX_HOME/sessions/**/rollout-*.jsonl)
// ============================================================================

function collectCodexSessions(paths) {
  const sessionsRoot = path.join(paths.codexDir, 'sessions');
  if (!fs.existsSync(sessionsRoot)) return [];

  const files = walkFilesBounded(
    sessionsRoot,
    (name) => name.startsWith('rollout-') && name.endsWith('.jsonl'),
    60,
    4
  );

  const now = Date.now();
  const sessions = [];

  for (const fileInfo of files) {
    const parsed = readJsonlHeadAndTail(fileInfo.path);
    if (!parsed) continue;

    let sessionId = '';
    let cwd = '';
    let isSubagent = false;
    let firstUserPrompt = '';
    let lastTsMs = fileInfo.mtimeMs;
    let lastEventType = '';
    let lastErrorText = '';
    let stepCount = 0;

    const callIdsSeen = new Set();
    const calls = [];
    const feedBuilder = createFeedBuilder();

    for (const item of parsed.headItems) {
      if (item.type === 'session_meta' && item.payload) {
        if (item.payload.id) sessionId = String(item.payload.id);
        if (item.payload.cwd) cwd = String(item.payload.cwd);
        if (item.payload.source?.subagent) isSubagent = true;
      }
      if (!firstUserPrompt && item.type === 'event_msg' && item.payload?.type === 'user_message') {
        const msg = String(item.payload.message || '').trim();
        if (msg) firstUserPrompt = msg;
      }
      if (!firstUserPrompt && item.type === 'response_item' && item.payload?.role === 'user') {
        const raw = extractTextFromMessageContent(item.payload.content)
          .replace(/<environment_context>[\s\S]*?<\/environment_context>/gi, ' ')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (raw && !raw.startsWith('# AGENTS.md')) {
          firstUserPrompt = raw;
        }
      }
    }

    for (const item of parsed.tailItems) {
      if (item.timestamp) {
        const t = parseTimestampMs(item.timestamp);
        if (t > lastTsMs) lastTsMs = t;
      }

      if (item.type === 'event_msg' && item.payload) {
        lastEventType = String(item.payload.type || '');
        if (lastEventType === 'error') {
          lastErrorText = String(item.payload.message || 'Codex execution error');
        }
      }

      if (item.type === 'response_item' && item.payload) {
        stepCount += 1;
        const p = item.payload;
        if (
          p.type === 'function_call' ||
          p.type === 'custom_tool_call' ||
          p.type === 'local_shell_call' ||
          p.type === 'web_search_call'
        ) {
          let parsedArgs = {};
          if (typeof p.arguments === 'string') {
            try {
              parsedArgs = JSON.parse(p.arguments);
            } catch {
              parsedArgs = { command: p.arguments };
            }
          } else if (typeof p.input === 'string') {
            parsedArgs = { input: p.input };
          } else if (p.action && typeof p.action === 'object') {
            parsedArgs = p.action;
          }
          calls.push({
            callId: p.call_id || '',
            name: p.name || p.type,
            args: parsedArgs,
            time: item.timestamp || '',
          });
        } else if (
          (p.type === 'function_call_output' || p.type === 'custom_tool_call_output') &&
          p.call_id
        ) {
          callIdsSeen.add(p.call_id);
        }
      }
    }

    for (let i = calls.length - 1; i >= 0 && feedBuilder.size() < 6; i -= 1) {
      const mapped = mapUniversalTool(calls[i].name, calls[i].args);
      feedBuilder.push(calls[i].time, mapped.icon, mapped.actionKey, mapped.detail);
    }

    const unresolvedCall = [...calls]
      .reverse()
      .find((c) => c.callId && !callIdsSeen.has(c.callId));

    const effectiveAgeMs = Math.max(0, now - Math.max(fileInfo.mtimeMs, lastTsMs));
    const recentlyActive =
      effectiveAgeMs < TRANSCRIPT_ACTIVE_MS &&
      lastEventType !== 'task_complete' &&
      lastEventType !== 'turn_aborted';
    const hasPendingCall = Boolean(unresolvedCall && effectiveAgeMs < PENDING_TOOL_ACTIVE_MS);
    const isActive = recentlyActive || hasPendingCall;

    let state;
    if (lastEventType === 'error' && lastErrorText) {
      state = {
        activity: 'error',
        station: 'generator',
        icon: 'sweat',
        actionKey: 'error',
        actionLabel: ACTION_LABELS_EN.error,
        detail: truncateText(lastErrorText, 32),
        errorFull: truncateText(lastErrorText, 220),
      };
    } else if (isActive) {
      const chosen = unresolvedCall || calls[calls.length - 1];
      if (chosen) {
        state = mapUniversalTool(chosen.name, chosen.args);
      } else {
        state = {
          activity: 'thinking',
          station: 'board',
          icon: 'thought',
          actionKey: 'thinking',
          actionLabel: ACTION_LABELS_EN.thinking,
          detail: 'Reasoning in Codex...',
        };
      }
    } else {
      state = buildIdleState(effectiveAgeMs);
    }

    const { key: folderKey, displayPath: folderPath } = normalizeUri(cwd);
    const idBase = sessionId || fileInfo.name.replace(/\.jsonl$/, '');
    sessions.push({
      conversationId: `codex:${idBase}`,
      agentSource: 'codex',
      projectId: folderKey ? `dir:${folderKey}` : `codex:${idBase}`,
      folderKey,
      folderPath,
      title: firstUserPrompt || `Codex Session ${idBase.slice(0, 6)}`,
      agentName: isSubagent ? 'Codex Subagent' : 'Codex CLI',
      isSubagent,
      parentConversationId: '',
      stepCount: Math.max(stepCount, calls.length),
      status: isActive ? 'RUNNING' : 'IDLE',
      isRunning: isActive,
      lastModifiedTime: new Date(lastTsMs || fileInfo.mtimeMs).toISOString(),
      lastModifiedMs: lastTsMs || fileInfo.mtimeMs,
      state,
      feed: feedBuilder.build(),
    });
  }

  return sessions;
}

// ============================================================================
// 5. UNIFIED ISLAND MERGER & PERSONA ENGINE
// ============================================================================

function assignIslandPersonas(villagers) {
  const byIsland = new Map();
  for (const v of villagers) {
    if (!byIsland.has(v.islandId)) byIsland.set(v.islandId, []);
    byIsland.get(v.islandId).push(v);
  }

  for (const list of byIsland.values()) {
    // Keep stable deterministic names per island (mayors first, immutable ID tie-breaker)
    list.sort((a, b) => {
      if (Boolean(a.isSubagent) !== Boolean(b.isSubagent)) return a.isSubagent ? 1 : -1;
      return a.conversationId.localeCompare(b.conversationId);
    });

    const usedSlots = new Set();
    for (const v of list) {
      const h = hashStr(v.conversationId);
      const preferredSpeciesIdx = h % SPECIES_KEYS.length;
      const preferredNameIdx = (h >>> 5) % 8;

      let chosenSpecies = SPECIES_KEYS[preferredSpeciesIdx];
      let chosenIdx = preferredNameIdx;
      let found = false;

      for (let offset = 0; offset < 8; offset += 1) {
        const idx = (preferredNameIdx + offset) % 8;
        const slotKey = `${chosenSpecies}:${idx}`;
        if (!usedSlots.has(slotKey)) {
          chosenIdx = idx;
          found = true;
          break;
        }
      }

      if (!found) {
        outer: for (let sOff = 1; sOff < SPECIES_KEYS.length; sOff += 1) {
          const sp = SPECIES_KEYS[(preferredSpeciesIdx + sOff) % SPECIES_KEYS.length];
          for (let nOff = 0; nOff < 8; nOff += 1) {
            const idx = (preferredNameIdx + nOff) % 8;
            const slotKey = `${sp}:${idx}`;
            if (!usedSlots.has(slotKey)) {
              chosenSpecies = sp;
              chosenIdx = idx;
              break outer;
            }
          }
        }
      }

      usedSlots.add(`${chosenSpecies}:${chosenIdx}`);
      const roleInfo = ROLE_META[v.roleCode] || ROLE_META.helper;
      const nameEn = SPECIES_NAME_POOLS.en[chosenSpecies][chosenIdx];
      const nameKo = SPECIES_NAME_POOLS.ko[chosenSpecies][chosenIdx];

      v.species = chosenSpecies;
      v.nameIndex = chosenIdx;
      v.villagerNameEn = nameEn;
      v.villagerNameKo = nameKo;
      v.villagerName = nameEn;
      v.displayNameEn = `${roleInfo.enShort} ${nameEn}`;
      v.displayNameKo = `${roleInfo.koShort} ${nameKo}`;
      v.displayName = v.displayNameEn;
    }
  }
}

export function buildVillageSnapshot() {
  const now = Date.now();
  const paths = getEnvPaths();

  const agy = collectAntigravityData(paths);
  const claudeSessions = collectClaudeSessions(paths);
  const cursorSessions = collectCursorSessions(paths);
  const codexSessions = collectCodexSessions(paths);

  const islandsById = new Map();
  const islandByFolderKey = new Map();
  const islandSourcesMap = new Map();

  for (const proj of agy.registeredProjects) {
    const island = {
      id: proj.id,
      name: proj.name,
      fruit: getIslandFruit(proj.id),
      folderKey: proj.folderKey,
      folderPath: proj.folderPath,
      isRegistered: true,
      activeCount: 0,
      villagerCount: 0,
      lastActivityMs: 0,
      sources: [],
    };
    islandsById.set(island.id, island);
    islandSourcesMap.set(island.id, new Set());
    if (proj.folderKey) {
      islandByFolderKey.set(proj.folderKey, island);
    }
  }

  const allSessions = [
    ...agy.sessions,
    ...claudeSessions,
    ...cursorSessions,
    ...codexSessions,
  ].sort((a, b) => {
    if (Boolean(a.isRunning) !== Boolean(b.isRunning)) return a.isRunning ? -1 : 1;
    return b.lastModifiedMs - a.lastModifiedMs;
  });

  const resolveIsland = (sess) => {
    if (sess.projectId && islandsById.has(sess.projectId)) {
      return islandsById.get(sess.projectId);
    }
    if (sess.folderKey && islandByFolderKey.has(sess.folderKey)) {
      return islandByFolderKey.get(sess.folderKey);
    }
    if (sess.folderKey) {
      const dynamicId = `dir:${sess.folderKey}`;
      if (!islandsById.has(dynamicId)) {
        islandsById.set(dynamicId, {
          id: dynamicId,
          name: safeBasename(sess.folderPath, sess.fallbackSlugName || 'Workspace'),
          fruit: getIslandFruit(dynamicId),
          folderKey: sess.folderKey,
          folderPath: sess.folderPath,
          isRegistered: false,
          activeCount: 0,
          villagerCount: 0,
          lastActivityMs: 0,
          sources: [],
        });
        islandSourcesMap.set(dynamicId, new Set());
      }
      const isl = islandsById.get(dynamicId);
      islandByFolderKey.set(sess.folderKey, isl);
      return isl;
    }

    if (sess.projectId && sess.projectId.includes('-slug:')) {
      const slugId = sess.projectId;
      if (!islandsById.has(slugId)) {
        islandsById.set(slugId, {
          id: slugId,
          name: sess.fallbackSlugName || 'Workspace',
          fruit: getIslandFruit(slugId),
          folderKey: '',
          folderPath: '',
          isRegistered: false,
          activeCount: 0,
          villagerCount: 0,
          lastActivityMs: 0,
          sources: [],
        });
        islandSourcesMap.set(slugId, new Set());
      }
      return islandsById.get(slugId);
    }

    const freeId = 'outside-of-project';
    if (!islandsById.has(freeId)) {
      islandsById.set(freeId, {
        id: freeId,
        name: 'Free Plaza',
        isFreePlaza: true,
        fruit: getIslandFruit(freeId),
        folderKey: '',
        folderPath: '',
        isRegistered: false,
        activeCount: 0,
        villagerCount: 0,
        lastActivityMs: 0,
        sources: [],
      });
      islandSourcesMap.set(freeId, new Set());
    }
    return islandsById.get(freeId);
  };

  // Cap per island smoothly while keeping ALL currently active or recent sessions + up to 3 idle sessions per island
  const selected = [];
  const selectedIds = new Set();
  const mainCountPerIsland = new Map();
  const subCountPerIsland = new Map();
  const activeOrRecentParents = new Set();

  for (const s of allSessions) {
    const isRecent = now - s.lastModifiedMs <= ACTIVE_RECENT_MS;
    if (!s.isSubagent && (s.isRunning || isRecent)) {
      activeOrRecentParents.add(s.conversationId);
    }
  }

  for (const s of allSessions) {
    const island = resolveIsland(s);
    const isRecent = now - s.lastModifiedMs <= ACTIVE_RECENT_MS;
    if (s.isRunning || isRecent) {
      selected.push({ sess: s, island });
      selectedIds.add(s.conversationId);
      if (s.isSubagent) {
        subCountPerIsland.set(island.id, (subCountPerIsland.get(island.id) || 0) + 1);
      } else {
        mainCountPerIsland.set(island.id, (mainCountPerIsland.get(island.id) || 0) + 1);
      }
    }
  }

  for (const s of allSessions) {
    if (selectedIds.has(s.conversationId)) continue;
    const island = resolveIsland(s);
    if (!s.isSubagent) {
      const cnt = mainCountPerIsland.get(island.id) || 0;
      if (cnt < 3) {
        selected.push({ sess: s, island });
        selectedIds.add(s.conversationId);
        mainCountPerIsland.set(island.id, cnt + 1);
      }
    } else if (activeOrRecentParents.has(s.parentConversationId) || (subCountPerIsland.get(island.id) || 0) < 2) {
      const subCnt = subCountPerIsland.get(island.id) || 0;
      if (subCnt < 2) {
        selected.push({ sess: s, island });
        selectedIds.add(s.conversationId);
        subCountPerIsland.set(island.id, subCnt + 1);
      }
    }
  }

  const villagers = selected.map(({ sess, island }) => {
    island.villagerCount += 1;
    if (sess.isRunning) island.activeCount += 1;
    if (sess.lastModifiedMs > island.lastActivityMs) {
      island.lastActivityMs = sess.lastModifiedMs;
    }
    islandSourcesMap.get(island.id)?.add(sess.agentSource);

    const roleInfo = resolveVillagerRole(sess.isSubagent, sess.agentName, sess.title);
    const rawTitle = String(sess.title || (sess.isSubagent ? sess.agentName : '') || '')
      .replace(/\s+/g, ' ')
      .trim();
    const { questTitle, doorplateLabel, topicKey } = cleanQuestTopic(rawTitle, roleInfo.roleCode, sess.isSubagent);
    const fullTitle = rawTitle || questTitle;

    return {
      conversationId: sess.conversationId,
      agentSource: sess.agentSource,
      islandId: island.id,
      islandName: island.name,
      isFreePlaza: Boolean(island.isFreePlaza),
      title: fullTitle,
      questTitle,
      doorplateLabel,
      topicKey,
      displayName: roleInfo.enShort,
      displayNameEn: roleInfo.enShort,
      displayNameKo: roleInfo.koShort,
      villagerName: '',
      villagerNameEn: '',
      villagerNameKo: '',
      nameIndex: 0,
      species: 'shiba',
      roleCode: roleInfo.roleCode,
      roleShort: roleInfo.enShort,
      roleFull: roleInfo.enFull,
      role: roleInfo.enFull,
      rawAgentName: sess.agentName || '',
      isSubagent: Boolean(sess.isSubagent),
      parentConversationId: sess.parentConversationId || '',
      stepCount: sess.stepCount || 0,
      status: sess.status || '',
      isRunning: Boolean(sess.isRunning),
      lastModifiedTime: sess.lastModifiedTime || '',
      lastModifiedMs: sess.lastModifiedMs || 0,
      activity: sess.state.activity,
      station: sess.state.station,
      icon: sess.state.icon,
      actionKey: sess.state.actionKey || sess.state.activity,
      actionLabel: sess.state.actionLabel,
      ageMs: Number.isFinite(sess.state.ageMs) ? sess.state.ageMs : 0,
      detail: sess.state.detail || '',
      errorFull: sess.state.errorFull || '',
      feed: sess.feed || [],
    };
  });

  assignIslandPersonas(villagers);

  const islands = Array.from(islandsById.values())
    .map((isl) => ({
      ...isl,
      sources: Array.from(islandSourcesMap.get(isl.id) || []),
    }))
    .filter((isl) => isl.isRegistered || isl.villagerCount > 0)
    .sort((a, b) => {
      if (b.activeCount !== a.activeCount) return b.activeCount - a.activeCount;
      if (b.lastActivityMs !== a.lastActivityMs) return b.lastActivityMs - a.lastActivityMs;
      return a.name.localeCompare(b.name, 'en');
    });

  const activeVillagers = villagers.filter((v) => v.isRunning).length;
  const activeIslands = islands.filter((i) => i.activeCount > 0).length;

  const sourceCounts = { antigravity: 0, claude: 0, cursor: 0, codex: 0 };
  for (const v of villagers) {
    if (sourceCounts[v.agentSource] !== undefined) {
      sourceCounts[v.agentSource] += 1;
    }
  }

  return {
    timestamp: now,
    islands,
    villagers,
    diagnostics: { ...lastDbDiagnostic },
    sourceCounts,
    stats: {
      activeVillagers,
      totalVillagers: villagers.length,
      activeIslands,
      totalIslands: islands.length,
    },
  };
}
