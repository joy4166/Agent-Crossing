(() => {
const ISLAND_GAP_X = 56;
const ISLAND_GAP_Y = 54;

const HOUSE_ROOF_COLORS = [
  '#e06651',
  '#4f9cf9',
  '#48b878',
  '#e59934',
  '#9b72cf',
  '#ec6b9e',
  '#38b2ac',
];

const SPECIES_LIST = ['cat', 'shiba', 'bunny', 'bear', 'fox', 'frog', 'hamster'];
const SPECIES_EMOJI = {
  cat: '🐱',
  shiba: '🐕',
  bunny: '🐰',
  bear: '🐻',
  fox: '🦊',
  frog: '🐸',
  hamster: '🐹',
};
const SHIRT_COLORS = ['#f97316', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#14b8a6'];
const CANVAS_FONT = 'Pretendard, SUIT, "Malgun Gothic", sans-serif';

const DEMO_SCRIPTS = [
  { activity: 'crafting', station: 'workbench', emoji: '🔨', actionLabel: 'DIY 코드 제작 중', detail: 'village.js' },
  { activity: 'reading', station: 'bookshelf', emoji: '📖', actionLabel: '코드·문서 읽는 중', detail: 'main.mjs' },
  { activity: 'command', station: 'generator', emoji: '⚙️', actionLabel: '터미널 장치 가동 중', detail: 'npm test' },
  { activity: 'exploring', station: 'airport', emoji: '🔭', actionLabel: '바깥 세계 탐색 중', detail: '웹 검색 중' },
  { activity: 'coordinating', station: 'board', emoji: '📣', actionLabel: '주민 에이전트 소집 중', detail: 'browser 서브에이전트' },
  { activity: 'coffee', station: 'home', emoji: '☕', actionLabel: '집 마당에서 티타임', detail: '방금 전 활동' },
];

const inSidecar = Boolean(window.sidecar);
const isEmbeddedFrame = Boolean(window.parent && window.parent !== window);
const hostFetch = window.sidecar?.fetch ? window.sidecar.fetch.bind(window.sidecar) : fetch;

const motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
let reducedMotion = Boolean(motionQuery?.matches);
motionQuery?.addEventListener?.('change', (e) => {
  reducedMotion = Boolean(e.matches);
});

const appShell = document.getElementById('app-shell');
const stageWrapper = document.getElementById('stageWrapper');
const stageEl = document.getElementById('village-stage');
const canvas = document.getElementById('villageCanvas');
const ctx = canvas.getContext('2d');

const liveBadge = document.getElementById('liveBadge');
const liveBadgeText = document.getElementById('liveBadgeText');
const liveZeroTag = document.getElementById('liveZeroTag');
const stopDemoBtn = document.getElementById('stopDemoBtn');
const retryBtn = document.getElementById('retryBtn');
const statsSummary = document.getElementById('statsSummary');
const helpBtn = document.getElementById('helpBtn');
const closeHelpBtn = document.getElementById('closeHelpBtn');
const helpSheet = document.getElementById('helpSheet');

const filterBtn = document.getElementById('filterBtn');
const listBtn = document.getElementById('listBtn');
const closeListBtn = document.getElementById('closeListBtn');
const directoryDrawer = document.getElementById('directoryDrawer');
const dirSearchInput = document.getElementById('dirSearchInput');
const directoryList = document.getElementById('directoryList');

const demoBtn = document.getElementById('demoBtn');
const notifyBtn = document.getElementById('notifyBtn');
const resetViewBtn = document.getElementById('resetViewBtn');
const pipBtn = document.getElementById('pipBtn');
const zoomInBtn = document.getElementById('zoomInBtn');
const zoomOutBtn = document.getElementById('zoomOutBtn');
const canvasTooltip = document.getElementById('canvasTooltip');
const srAnnouncer = document.getElementById('srAnnouncer');
const toastEl = document.getElementById('toast');

const emptyStateCard = document.getElementById('emptyStateCard');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateBody = document.getElementById('emptyStateBody');
const showAllIslandsBtn = document.getElementById('showAllIslandsBtn');

const inspectorCard = document.getElementById('inspectorCard');
const inspectorBadge = document.getElementById('inspectorBadge');
const inspectorTitle = document.getElementById('inspectorTitle');
const inspectorSub = document.getElementById('inspectorSub');
const inspectorMeta = document.getElementById('inspectorMeta');
const inspectorErrorBox = document.getElementById('inspectorErrorBox');
const inspectorActions = document.getElementById('inspectorActions');
const inspectorFeed = document.getElementById('inspectorFeed');
const inspectorBackBtn = document.getElementById('inspectorBackBtn');
const closeInspectorBtn = document.getElementById('closeInspectorBtn');

function safeGetStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetStorage(key, val) {
  try {
    window.localStorage.setItem(key, val);
  } catch {
    // Storage unavailable inside sandboxed iframes
  }
}

let liveSnapshot = { islands: [], villagers: [], stats: { activeVillagers: 0, totalVillagers: 0, activeIslands: 0, totalIslands: 0 } };
let currentEtag = '';
let hostConversationId = window.sidecar?.conversationId || '';
let hostWorkspaceKeys = new Set();

let onlyActiveIslands = false;
let hasAppliedInitialDefault = false;
let demoUntil = 0;
let pipWindow = null;
let selectedTarget = null;
let hoveredTarget = null;
let notifyEnabled = safeGetStorage('agentCrossing.notify') === '1';
let hasInitializedNotifications = false;
let consecutivePollErrors = 0;
let lastStatsText = '';
let lastBadgeKey = '';
let lastInspectorSig = '';
let lastDirectorySig = '';
let showAllIdleDir = false;
let showAllIslandResidents = false;
let lastShellMode = '';
let lastShellWidth = 0;

const prevVillagerStates = new Map();
const prevIslandOrigins = new Map();
const islandLayouts = new Map();
const actorMap = new Map();
const clouds = Array.from({ length: 7 }, (_, i) => ({
  x: i * 260,
  y: 45 + (i % 3) * 180,
  speed: 8 + (i % 4) * 3,
  scale: 0.75 + (i % 3) * 0.25,
}));

const camera = {
  x: 0,
  y: 0,
  zoom: 1,
  userAdjusted: false,
};

let dragging = false;
let dragMoved = false;
let dragStartX = 0;
let dragStartY = 0;
let camStartX = 0;
let camStartY = 0;
let toastTimer = null;

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function normalizeClientUri(raw) {
  if (!raw) return '';
  let stripped = String(raw).trim().replace(/^file:\/\/\/?/i, '');
  try {
    stripped = decodeURIComponent(stripped);
  } catch {
    // ignore malformed encoding
  }
  return stripped.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function middleTruncate(text, max = 14) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean || clean.length <= max) return clean;
  const hashMatch = clean.match(/(\s#\d+)$/);
  if (hashMatch) {
    const numSuffix = hashMatch[1];
    const stem = clean.slice(0, clean.length - numSuffix.length);
    const avail = Math.max(4, max - numSuffix.length);
    return `${middleTruncate(stem, avail)}${numSuffix}`;
  }
  if (max <= 5) return `${clean.slice(0, Math.max(1, max - 1))}…`;
  const head = Math.ceil((max - 1) * 0.56);
  const tail = Math.max(3, max - 1 - head);
  return `${clean.slice(0, head)}…${clean.slice(-tail)}`;
}

function getVillagerVisualMeta(conversationId) {
  const h = hashStr(conversationId || '');
  const species = SPECIES_LIST[h % SPECIES_LIST.length];
  return {
    species,
    speciesEmoji: SPECIES_EMOJI[species] || '🐾',
    shirt: SHIRT_COLORS[(h >> 4) % SHIRT_COLORS.length],
  };
}

function announce(msg) {
  if (!srAnnouncer) return;
  srAnnouncer.textContent = '';
  requestAnimationFrame(() => {
    srAnnouncer.textContent = msg;
  });
}

function withPreservedFocus(containerEl, buildFn) {
  const activeEl = document.activeElement;
  const activeKey = activeEl && containerEl.contains(activeEl) ? activeEl.dataset?.focusKey : '';
  buildFn();
  if (activeKey) {
    const target = Array.from(containerEl.querySelectorAll('[data-focus-key]')).find(
      (el) => el.dataset.focusKey === activeKey
    );
    target?.focus({ preventScroll: true });
  }
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 2600);
}

function formatClock(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
}

function syncFilterUI() {
  filterBtn.classList.toggle('is-active', onlyActiveIslands);
  filterBtn.setAttribute('aria-pressed', onlyActiveIslands ? 'true' : 'false');
  const labelSpan = filterBtn.querySelector('span');
  if (labelSpan) labelSpan.textContent = onlyActiveIslands ? '활발한 섬' : '전체 섬';
}

function syncNotifyUI() {
  notifyBtn.classList.toggle('is-active', notifyEnabled);
  notifyBtn.setAttribute('aria-pressed', notifyEnabled ? 'true' : 'false');
}

function syncDemoUI(active) {
  demoBtn.classList.toggle('is-active', active);
  demoBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
}

function toggleDrawer(targetEl, btnEl, forceState, restoreFocus = true) {
  const wasOpen = !targetEl.classList.contains('hidden');
  const show = typeof forceState === 'boolean' ? forceState : !wasOpen;
  if (show) {
    if (targetEl !== helpSheet) {
      helpSheet.classList.add('hidden');
      helpBtn.setAttribute('aria-expanded', 'false');
    }
    if (targetEl !== directoryDrawer) {
      directoryDrawer.classList.add('hidden');
      listBtn.setAttribute('aria-expanded', 'false');
    }
    if (selectedTarget) {
      selectedTarget = null;
      refreshInspector();
    }
  }
  targetEl.classList.toggle('hidden', !show);
  btnEl.setAttribute('aria-expanded', show ? 'true' : 'false');
  if (show && !wasOpen) {
    if (targetEl === helpSheet) {
      notifyBtn.focus({ preventScroll: true });
    }
  } else if (!show && wasOpen && restoreFocus && targetEl.contains(document.activeElement)) {
    btnEl.focus({ preventScroll: true });
  }
  return show;
}

function sendDesktopNotification(title, body) {
  if (!notifyEnabled) return;
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // ignore in restricted webviews
  }
}

function processNotificationTransitions(snapshot) {
  const villagers = snapshot.villagers || [];
  if (!hasInitializedNotifications) {
    for (const v of villagers) {
      prevVillagerStates.set(v.conversationId, { isRunning: v.isRunning, activity: v.activity });
    }
    hasInitializedNotifications = true;
    return;
  }

  for (const v of villagers) {
    const prev = prevVillagerStates.get(v.conversationId);
    if (prev) {
      if (prev.isRunning && !v.isRunning && v.activity !== 'error') {
        const msg = `${v.islandName} · ${v.displayName} 작업 완료`;
        if (notifyEnabled) {
          showToast(`작업 완료: ${msg}`);
          sendDesktopNotification('에이전트의 숲 · 작업 완료', msg);
        }
      } else if (prev.activity !== 'error' && v.activity === 'error') {
        const msg = `${v.islandName} · ${v.displayName} 오류 확인 필요`;
        if (notifyEnabled) {
          showToast(`오류 감지: ${msg}`);
          sendDesktopNotification('에이전트의 숲 · 오류 발생', msg);
        }
      }
    }
    prevVillagerStates.set(v.conversationId, { isRunning: v.isRunning, activity: v.activity });
  }
}

function buildDemoSnapshot(now) {
  const stepOffset = Math.floor(Math.max(0, now - (demoUntil - 12000)) / 2400);
  const demoNames = [
    { id: 'demo-mayor', displayName: '촌장 에이전트', title: '시범 프로젝트 촌장', role: '촌장', isSubagent: false },
    { id: 'demo-reader', displayName: '코드-탐색기', title: '서브에이전트 · 코드 탐색', role: 'explorer', isSubagent: true },
    { id: 'demo-builder', displayName: 'UI-제작자', title: '서브에이전트 · 제작', role: 'builder', isSubagent: true },
    { id: 'demo-tester', displayName: '테스트-검증', title: '서브에이전트 · 터미널 검증', role: 'verifier', isSubagent: true },
    { id: 'demo-scout', displayName: '웹-리서치', title: '서브에이전트 · 외부 탐색', role: 'researcher', isSubagent: true },
    { id: 'demo-rest', displayName: '대기-주민', title: '서브에이전트 · 휴식', role: 'helper', isSubagent: true },
  ];

  const villagers = demoNames.map((entry, idx) => {
    const script = DEMO_SCRIPTS[(idx + stepOffset) % DEMO_SCRIPTS.length];
    return {
      conversationId: entry.id,
      islandId: 'demo-sandbox',
      islandName: '시범 마을',
      title: entry.title,
      displayName: entry.displayName,
      role: entry.role,
      isSubagent: entry.isSubagent,
      stepCount: 12 + idx * 3 + stepOffset,
      isRunning: script.activity !== 'coffee',
      lastModifiedMs: now,
      ...script,
      feed: [
        {
          time: new Date(now).toISOString(),
          emoji: script.emoji,
          label: script.actionLabel,
          detail: script.detail,
        },
      ],
    };
  });

  const activeCount = villagers.filter((v) => v.isRunning).length;
  const islands = [
    {
      id: 'demo-sandbox',
      name: '시범 마을 (연습 섬)',
      folderPath: '',
      isCurrentWorkspace: true,
      villagerCount: villagers.length,
      activeCount,
      lastActivityMs: now,
    },
  ];

  return { islands, villagers, isDemo: true };
}

function getEffectiveSnapshot() {
  const now = Date.now();
  const isDemo = now < demoUntil;
  if (isDemo) {
    return buildDemoSnapshot(now);
  }

  const baseIslands = liveSnapshot.islands || [];
  let villagers = liveSnapshot.villagers || [];

  let islands = baseIslands.map((isl) => {
    const onIsland = villagers.filter((v) => v.islandId === isl.id);
    const activeCount = onIsland.filter((v) => v.isRunning).length;
    return {
      ...isl,
      villagerCount: onIsland.length,
      activeCount,
      isCurrentWorkspace: Boolean(isl.folderKey && hostWorkspaceKeys.has(isl.folderKey)),
    };
  });

  if (onlyActiveIslands) {
    const recentCutoff = now - 15 * 60 * 1000;
    islands = islands.filter(
      (isl) => isl.activeCount > 0 || (isl.lastActivityMs && isl.lastActivityMs >= recentCutoff)
    );
  }

  const visibleIslandIds = new Set(islands.map((i) => i.id));
  villagers = villagers.filter((v) => visibleIslandIds.has(v.islandId));

  return { islands, villagers, isDemo: false };
}

function computeIslandGeometry(residents) {
  const residentsCount = residents.length;
  if (residentsCount === 0) {
    return {
      w: 268,
      h: 146,
      isCompactEmpty: true,
      resTop: 52,
      resHeight: 64,
      laneY: 0,
      plazaY: 0,
      stations: {},
      homeSlots: [],
      homeMap: new Map(),
    };
  }

  const stationCounts = {};
  for (const v of residents) {
    if (v.station && v.station !== 'home') {
      stationCounts[v.station] = (stationCounts[v.station] || 0) + 1;
    }
  }
  const maxStationCount = Math.max(0, ...Object.values(stationCounts));
  const extraStationRows = Math.max(0, Math.ceil(maxStationCount / 2) - 1);

  const cols = Math.min(4, Math.max(2, residentsCount));
  const houseRows = Math.max(1, Math.ceil(residentsCount / 4));
  const w = Math.max(580, cols * 134 + 68, maxStationCount >= 2 ? 640 : 580);

  const resTop = 58;
  const rowHeight = 112;
  const resHeight = houseRows * rowHeight;

  const homeSlots = [];
  const homeMap = new Map();

  for (let idx = 0; idx < residentsCount; idx += 1) {
    const r = Math.floor(idx / 4);
    const rowCount = Math.min(4, residentsCount - r * 4);
    const c = idx % 4;
    const slotSpacing = Math.min(130, (w - 76) / Math.max(1, rowCount));
    const rowStartX = w / 2 - ((rowCount - 1) * slotSpacing) / 2;
    const hx = rowStartX + c * slotSpacing;
    const hy = resTop + r * rowHeight + 40;
    const villager = residents[idx];
    const h = hashStr(villager.conversationId);
    const plot = {
      villager,
      hx,
      hy,
      roofColor: HOUSE_ROOF_COLORS[h % HOUSE_ROOF_COLORS.length],
    };
    homeSlots.push(plot);
    homeMap.set(villager.conversationId, plot);
  }

  const laneY = resTop + resHeight + 12;
  const plazaY = laneY + 96;
  const h = plazaY + 92 + extraStationRows * 42;

  const stations = {
    bookshelf: { x: w * 0.11, y: plazaY, label: '문서 읽기', busy: (stationCounts.bookshelf || 0) > 0 },
    board: { x: w * 0.305, y: plazaY, label: '구상·협업', busy: (stationCounts.board || 0) > 0 },
    workbench: { x: w * 0.50, y: plazaY, label: 'DIY 제작', busy: (stationCounts.workbench || 0) > 0 },
    generator: { x: w * 0.695, y: plazaY, label: '터미널', busy: (stationCounts.generator || 0) > 0 },
    airport: { x: w * 0.89, y: plazaY, label: '외부 탐색', busy: (stationCounts.airport || 0) > 0 },
  };

  return { w, h, isCompactEmpty: false, resTop, resHeight, laneY, plazaY, stations, homeSlots, homeMap };
}

function pickGridColumns(count, stageWidth, stageHeight) {
  if (stageWidth > 0 && stageWidth < 560) {
    return 1;
  }
  const aspect = stageWidth > 0 && stageHeight > 0 ? stageWidth / stageHeight : 1.4;
  if (aspect < 0.78) {
    return count <= 2 ? 1 : 2;
  }
  if (aspect < 1.3) {
    return count === 1 ? 1 : count <= 4 ? 2 : 3;
  }
  return count === 1 ? 1 : count <= 4 ? 2 : count <= 9 ? 3 : 4;
}

function layoutIslands(islands, villagers = []) {
  if (islands.length === 0) {
    islandLayouts.clear();
    prevIslandOrigins.clear();
    return { totalW: 320, totalH: 200 };
  }

  const residentsByIsland = new Map();
  for (const v of villagers) {
    if (!residentsByIsland.has(v.islandId)) residentsByIsland.set(v.islandId, []);
    residentsByIsland.get(v.islandId).push(v);
  }

  for (const list of residentsByIsland.values()) {
    list.sort((a, b) => {
      if (Boolean(a.isSubagent) !== Boolean(b.isSubagent)) return a.isSubagent ? 1 : -1;
      return a.conversationId.localeCompare(b.conversationId);
    });
  }

  const rect = stageEl.getBoundingClientRect();
  const count = islands.length;
  const gridCols = pickGridColumns(count, rect.width, rect.height);
  const gridRows = Math.ceil(count / gridCols);

  const geoms = islands.map((isl) => {
    const residents = residentsByIsland.get(isl.id) || [];
    return { isl, geom: computeIslandGeometry(residents) };
  });

  const colWidths = new Array(gridCols).fill(268);
  const rowHeights = new Array(gridRows).fill(146);

  geoms.forEach(({ geom }, idx) => {
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    if (geom.w > colWidths[col]) colWidths[col] = geom.w;
    if (geom.h > rowHeights[row]) rowHeights[row] = geom.h;
  });

  const totalW = colWidths.reduce((acc, val) => acc + val, 0) + (gridCols - 1) * ISLAND_GAP_X;
  const totalH = rowHeights.reduce((acc, val) => acc + val, 0) + (gridRows - 1) * ISLAND_GAP_Y;

  const colX = [];
  let cursorX = -totalW / 2;
  for (let c = 0; c < gridCols; c += 1) {
    colX.push(cursorX);
    cursorX += colWidths[c] + ISLAND_GAP_X;
  }

  const rowY = [];
  let cursorY = -totalH / 2;
  for (let r = 0; r < gridRows; r += 1) {
    rowY.push(cursorY);
    cursorY += rowHeights[r] + ISLAND_GAP_Y;
  }

  islandLayouts.clear();
  const nextOrigins = new Map();

  geoms.forEach(({ isl, geom }, idx) => {
    const col = idx % gridCols;
    const row = Math.floor(idx / gridCols);
    const x = colX[col] + (colWidths[col] - geom.w) / 2;
    const y = rowY[row] + (rowHeights[row] - geom.h) / 2;

    const prevOrigin = prevIslandOrigins.get(isl.id);
    if (prevOrigin) {
      const dx = x - prevOrigin.x;
      const dy = y - prevOrigin.y;
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        for (const actor of actorMap.values()) {
          if (actor.data?.islandId === isl.id) {
            actor.x += dx;
            actor.y += dy;
            actor.targetX += dx;
            actor.targetY += dy;
            for (const d of actor.dust) {
              d.x += dx;
              d.y += dy;
            }
          }
        }
      }
    }

    nextOrigins.set(isl.id, { x, y });
    islandLayouts.set(isl.id, { ...isl, x, y, ...geom });
  });

  prevIslandOrigins.clear();
  for (const [id, origin] of nextOrigins) {
    prevIslandOrigins.set(id, origin);
  }

  return { totalW, totalH };
}

function fitCameraToVillage(bounds, force = false) {
  if (camera.userAdjusted && !force) return;
  const rect = stageEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return;

  if (rect.width < 560) {
    const scaleX = (rect.width - 28) / Math.max(260, bounds.totalW);
    const targetZoom = Math.max(0.56, Math.min(1.18, scaleX));
    camera.zoom = targetZoom;
    camera.x = rect.width / 2;
    const contentH = bounds.totalH * targetZoom;
    camera.y = contentH + 36 > rect.height ? 22 + contentH / 2 : rect.height / 2;
  } else {
    const pad = 52;
    const scaleX = rect.width / (bounds.totalW + pad * 2);
    const scaleY = rect.height / (bounds.totalH + pad * 2);
    camera.zoom = Math.max(0.32, Math.min(1.35, Math.min(scaleX, scaleY)));
    camera.x = rect.width / 2;
    camera.y = rect.height / 2;
  }

  if (force) camera.userAdjusted = false;
}

function panToWorld(worldX, worldY, minZoom = 0.72) {
  const rect = stageEl.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  camera.zoom = Math.max(camera.zoom, minZoom);
  camera.x = rect.width / 2 - worldX * camera.zoom;
  camera.y = rect.height / 2 - worldY * camera.zoom;
  camera.userAdjusted = true;
}

function syncActors(villagers) {
  const seenIds = new Set();
  const slotGroups = new Map();

  for (const v of villagers) {
    const island = islandLayouts.get(v.islandId);
    if (!island) continue;
    if (v.station !== 'home' && island.stations[v.station]) {
      const key = `${v.islandId}:${v.station}`;
      if (!slotGroups.has(key)) slotGroups.set(key, []);
      slotGroups.get(key).push(v.conversationId);
    }
  }

  for (const v of villagers) {
    seenIds.add(v.conversationId);
    const island = islandLayouts.get(v.islandId);
    if (!island) continue;

    let targetX;
    let targetY;

    if (v.station !== 'home' && island.stations[v.station]) {
      const st = island.stations[v.station];
      const group = slotGroups.get(`${v.islandId}:${v.station}`) || [v.conversationId];
      const slotIdx = group.indexOf(v.conversationId);
      const row = Math.floor(slotIdx / 2);
      const rowCount = Math.min(2, group.length - row * 2);
      const col = slotIdx % 2;
      const rawX = island.x + st.x + (col - (rowCount - 1) / 2) * 86;
      targetX = Math.max(island.x + 48, Math.min(island.x + island.w - 48, rawX));
      targetY = island.y + st.y + 36 + row * 42 + (col % 2) * 4;
    } else {
      const plot = island.homeMap.get(v.conversationId);
      targetX = island.x + (plot ? plot.hx : island.w / 2);
      targetY = island.y + (plot ? plot.hy + 22 : island.resTop + 42);
    }

    let actor = actorMap.get(v.conversationId);
    if (!actor) {
      const h = hashStr(v.conversationId);
      actor = {
        id: v.conversationId,
        species: SPECIES_LIST[h % SPECIES_LIST.length],
        shirt: SHIRT_COLORS[(h >> 4) % SHIRT_COLORS.length],
        x: targetX,
        y: targetY,
        targetX,
        targetY,
        facing: 1,
        dust: [],
        lastStation: v.station,
        data: v,
      };
      actorMap.set(v.conversationId, actor);
    } else {
      if (!reducedMotion && actor.lastStation !== v.station) {
        actor.dust.push({ x: actor.x, y: actor.y + 8, life: 1 });
      }
      actor.lastStation = v.station;
      if (Math.abs(targetX - actor.x) > 2) {
        actor.facing = targetX >= actor.x ? 1 : -1;
      }
      actor.targetX = targetX;
      actor.targetY = targetY;
      actor.data = v;
    }
  }

  for (const id of actorMap.keys()) {
    if (!seenIds.has(id)) {
      actorMap.delete(id);
    }
  }
}

function updateBadgeAndStats(effective) {
  let statsText;
  if (effective.isDemo) {
    const remainSec = Math.max(1, Math.ceil((demoUntil - Date.now()) / 1000));
    statsText = `시연 중 · ${remainSec}초 남음`;
  } else {
    const realStats = liveSnapshot.stats || {};
    const realActive = Number(realStats.activeVillagers || 0);
    const realIslands = Number(realStats.totalIslands || (liveSnapshot.islands || []).length);
    statsText = `활동 ${realActive}명 · ${realIslands}섬`;
  }
  if (statsText !== lastStatsText) {
    lastStatsText = statsText;
    statsSummary.textContent = statsText;
  }

  stopDemoBtn.classList.toggle('hidden', !effective.isDemo);

  const badgeKey = effective.isDemo ? 'demo' : consecutivePollErrors >= 2 ? 'offline' : 'live';
  if (badgeKey !== lastBadgeKey) {
    lastBadgeKey = badgeKey;
    if (badgeKey === 'demo') {
      liveBadge.className = 'status-badge is-demo';
      liveBadgeText.textContent = '시연 중';
      liveZeroTag.classList.add('hidden');
    } else if (badgeKey === 'offline') {
      liveBadge.className = 'status-badge is-offline';
      liveBadgeText.textContent = '재연결 중...';
      liveZeroTag.classList.add('hidden');
    } else {
      liveBadge.className = 'status-badge';
      liveBadgeText.textContent = '실시간';
      liveZeroTag.classList.remove('hidden');
    }
  }
  syncDemoUI(effective.isDemo);
}

function updateEmptyState(effective) {
  const diag = liveSnapshot.diagnostics;
  if (diag && diag.ok === false && !effective.isDemo && (liveSnapshot.islands || []).length === 0) {
    emptyStateTitle.textContent = '로컬 대화 DB를 읽지 못했어요';
    emptyStateBody.textContent = diag.message || 'Antigravity 대화 요약 데이터베이스(conversation_summaries.db) 접근에 실패했습니다.';
    showAllIslandsBtn.textContent = '다시 불러오기';
    showAllIslandsBtn.dataset.mode = 'retry';
    showAllIslandsBtn.classList.remove('hidden');
    emptyStateCard.classList.remove('hidden');
    return;
  }

  const allIslands = liveSnapshot.islands || [];
  if (allIslands.length === 0 && !effective.isDemo) {
    emptyStateTitle.textContent = '아직 발견된 프로젝트가 없어요';
    emptyStateBody.textContent = 'Antigravity에서 프로젝트나 대화를 열면 자동으로 섬과 주민이 나타납니다.';
    showAllIslandsBtn.classList.add('hidden');
    showAllIslandsBtn.dataset.mode = '';
    emptyStateCard.classList.remove('hidden');
    return;
  }
  if (onlyActiveIslands && effective.islands.length === 0) {
    emptyStateTitle.textContent = '현재 활동 중인 섬이 없어요';
    emptyStateBody.textContent = `최근 15분 내 작업한 프로젝트가 없습니다. 전체 ${allIslands.length}개 섬의 휴식 중인 주민을 볼 수 있습니다.`;
    showAllIslandsBtn.textContent = `전체 섬 보기 (${allIslands.length}개)`;
    showAllIslandsBtn.dataset.mode = 'showAll';
    showAllIslandsBtn.classList.remove('hidden');
    emptyStateCard.classList.remove('hidden');
    return;
  }
  emptyStateCard.classList.add('hidden');
}

async function openIslandFolder(islandId) {
  try {
    const res = await hostFetch('/api/open-folder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ islandId }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      showToast(data?.error || '폴더를 열 수 없습니다.');
      return;
    }
    showToast('프로젝트 폴더를 열었습니다.');
  } catch {
    showToast('폴더 열기 요청에 실패했습니다.');
  }
}

function createActionPill(label, secondary, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = secondary ? 'action-pill is-secondary' : 'action-pill';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}

function closeSheetsQuietly() {
  if (!helpSheet.classList.contains('hidden')) {
    helpSheet.classList.add('hidden');
    helpBtn.setAttribute('aria-expanded', 'false');
  }
  if (!directoryDrawer.classList.contains('hidden')) {
    directoryDrawer.classList.add('hidden');
    listBtn.setAttribute('aria-expanded', 'false');
  }
}

function focusVillagerById(conversationId, fromIslandId = null) {
  closeSheetsQuietly();
  selectedTarget = { type: 'villager', id: conversationId, fromIslandId };
  refreshInspector(true);
  const effective = getEffectiveSnapshot();
  const v = effective.villagers.find((item) => item.conversationId === conversationId);
  if (v) announce(`${v.displayName} 주민 선택됨. ${v.actionLabel}`);
  requestAnimationFrame(() => {
    const actor = actorMap.get(conversationId);
    if (actor) {
      panToWorld(actor.targetX, actor.targetY, 0.78);
    }
  });
}

function focusIslandById(islandId) {
  closeSheetsQuietly();
  if (selectedTarget?.type !== 'island' || selectedTarget.id !== islandId) {
    showAllIslandResidents = false;
  }
  selectedTarget = { type: 'island', id: islandId };
  refreshInspector(true);
  const isl = islandLayouts.get(islandId);
  if (isl) announce(`${isl.name} 섬 선택됨. 활동 ${isl.activeCount}명, 전체 ${isl.villagerCount}명`);
  requestAnimationFrame(() => {
    const updated = islandLayouts.get(islandId);
    if (updated) {
      panToWorld(updated.x + updated.w / 2, updated.y + updated.h / 2, 0.7);
    }
  });
}

function copyTextFallback(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

function refreshInspector(forceRebuild = false) {
  if (!selectedTarget) {
    lastInspectorSig = '';
    inspectorCard.classList.add('hidden');
    inspectorErrorBox.classList.add('hidden');
    return;
  }

  const effective = getEffectiveSnapshot();

  if (selectedTarget.type === 'villager') {
    const v = effective.villagers.find((item) => item.conversationId === selectedTarget.id);
    if (!v) {
      selectedTarget = null;
      lastInspectorSig = '';
      inspectorCard.classList.add('hidden');
      inspectorErrorBox.classList.add('hidden');
      return;
    }
    const island = effective.islands.find((item) => item.id === v.islandId);
    const isCurrentConv = hostConversationId && v.conversationId === hostConversationId;
    const feedItems = (v.feed || []).slice(0, 5);
    const sig = JSON.stringify([
      'v',
      v.conversationId,
      selectedTarget.fromIslandId || '',
      v.title,
      v.actionLabel,
      v.detail,
      v.errorFull || '',
      v.stepCount,
      v.isRunning,
      isCurrentConv,
      island?.folderPath || '',
      feedItems.map((f) => [f.label, f.detail, f.time]),
    ]);
    if (!forceRebuild && sig === lastInspectorSig) return;
    lastInspectorSig = sig;

    const vis = getVillagerVisualMeta(v.conversationId);
    withPreservedFocus(inspectorCard, () => {
      inspectorBackBtn.classList.toggle('hidden', !selectedTarget.fromIslandId);
      inspectorBadge.textContent = vis.speciesEmoji;
      inspectorBadge.style.borderColor = vis.shirt;
      inspectorTitle.textContent = v.title;
      inspectorSub.textContent = `${v.islandName} 섬 · ${v.isSubagent ? `보조 주민 (${v.role})` : '촌장 에이전트'}${isCurrentConv ? ' · ★ 현재 대화' : ''}`;
      inspectorMeta.innerHTML = `
        <span class="meta-chip ${v.isRunning ? 'is-live' : ''}">${escapeHtml(v.emoji)} ${escapeHtml(v.actionLabel)}</span>
        <span class="meta-chip">${escapeHtml(v.detail || '대기 중')}</span>
        <span class="meta-chip">작업 ${v.stepCount}회</span>
      `;

      if (v.activity === 'error' && v.errorFull) {
        inspectorErrorBox.textContent = `상세 오류: ${v.errorFull}`;
        inspectorErrorBox.classList.remove('hidden');
      } else {
        inspectorErrorBox.textContent = '';
        inspectorErrorBox.classList.add('hidden');
      }

      inspectorActions.innerHTML = '';
      if (isEmbeddedFrame && window.sidecar?.ui?.toggleConversation) {
        const openConvBtn = createActionPill('💬 이 대화 열기', false, () => {
          window.sidecar.ui.toggleConversation(v.conversationId);
        });
        openConvBtn.dataset.focusKey = 'act-conv';
        inspectorActions.appendChild(openConvBtn);
      } else if (!v.conversationId.startsWith('demo-')) {
        const copyIdBtn = createActionPill('📋 대화 ID 복사', true, async () => {
          const ok = await copyTextFallback(v.conversationId);
          showToast(ok ? '대화 ID를 복사했습니다.' : `대화 ID: ${v.conversationId}`);
        });
        copyIdBtn.dataset.focusKey = 'act-copy-id';
        inspectorActions.appendChild(copyIdBtn);
      }
      if (island?.folderPath) {
        const openFolderBtn = createActionPill('📂 폴더 열기', isEmbeddedFrame, () => openIslandFolder(island.id));
        openFolderBtn.dataset.focusKey = 'act-folder';
        inspectorActions.appendChild(openFolderBtn);
      }
      if (!isEmbeddedFrame && !v.conversationId.startsWith('demo-')) {
        const note = document.createElement('span');
        note.className = 'standalone-note';
        note.textContent = '대화 열기는 Antigravity 사이드카 패널에서 지원됩니다.';
        inspectorActions.appendChild(note);
      }
      inspectorActions.classList.toggle('hidden', inspectorActions.childElementCount === 0);

      inspectorFeed.innerHTML = feedItems.length
        ? feedItems
            .map(
              (item) => `
              <li>
                <span class="feed-left">
                  <span aria-hidden="true">${item.emoji}</span>
                  <span class="feed-label">${escapeHtml(item.label)}</span>
                  <span class="feed-detail" title="${escapeHtml(item.fullDetail || item.detail)}">${escapeHtml(item.detail)}</span>
                </span>
                <span class="feed-time">${formatClock(item.time)}</span>
              </li>`
            )
            .join('')
        : '<li><span class="feed-left"><span class="feed-detail">최근 작업 기록을 대기하고 있습니다.</span></span></li>';
    });
    inspectorCard.classList.remove('hidden');
  } else if (selectedTarget.type === 'island') {
    const isl = effective.islands.find((item) => item.id === selectedTarget.id);
    if (!isl) {
      selectedTarget = null;
      lastInspectorSig = '';
      inspectorCard.classList.add('hidden');
      inspectorErrorBox.classList.add('hidden');
      return;
    }
    const residents = effective.villagers.filter((v) => v.islandId === isl.id);
    const sig = JSON.stringify([
      'i',
      isl.id,
      isl.name,
      isl.isCurrentWorkspace,
      isl.activeCount,
      isl.folderPath || '',
      showAllIslandResidents,
      residents.map((r) => [r.conversationId, r.displayName, r.detail, r.actionLabel, r.isRunning]),
    ]);
    if (!forceRebuild && sig === lastInspectorSig) return;
    lastInspectorSig = sig;

    withPreservedFocus(inspectorCard, () => {
      inspectorBackBtn.classList.add('hidden');
      inspectorBadge.textContent = '🏝️';
      inspectorBadge.style.borderColor = '';
      inspectorTitle.textContent = `${isl.name} 섬${isl.isCurrentWorkspace ? ' (현재 작업 중)' : ''}`;
      inspectorSub.textContent = isl.folderPath || '자유 작업 공간';
      inspectorErrorBox.textContent = '';
      inspectorErrorBox.classList.add('hidden');
      inspectorMeta.innerHTML = `
        <span class="meta-chip ${isl.activeCount > 0 ? 'is-live' : ''}">활동 중 ${isl.activeCount}명</span>
        <span class="meta-chip">주민 ${residents.length}명</span>
      `;

      inspectorActions.innerHTML = '';
      if (isl.folderPath) {
        const folderBtn = createActionPill('📂 폴더 열기', false, () => openIslandFolder(isl.id));
        folderBtn.dataset.focusKey = 'act-folder';
        inspectorActions.appendChild(folderBtn);
      }
      inspectorActions.classList.toggle('hidden', inspectorActions.childElementCount === 0);

      inspectorFeed.innerHTML = '';
      if (residents.length === 0) {
        inspectorFeed.innerHTML =
          '<li><span class="feed-left"><span class="feed-detail">현재 이 섬은 고요합니다. 새 대화를 열면 주민이 찾아옵니다.</span></span></li>';
      } else {
        const visibleResidents =
          !showAllIslandResidents && residents.length > 4 ? residents.slice(0, 4) : residents;
        for (const r of visibleResidents) {
          const vis = getVillagerVisualMeta(r.conversationId);
          const li = document.createElement('li');
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'feed-row-btn';
          btn.dataset.focusKey = `isl-res-${r.conversationId}`;
          btn.innerHTML = `
            <span class="feed-left">
              <span aria-hidden="true">${vis.speciesEmoji}${r.emoji}</span>
              <span class="feed-label">${escapeHtml(r.displayName)}</span>
              <span class="feed-detail">${escapeHtml(r.detail || r.actionLabel)}</span>
            </span>
            <span class="feed-time">${r.isRunning ? '작업 중 ›' : '집 휴식 ›'}</span>
          `;
          btn.addEventListener('click', () => focusVillagerById(r.conversationId, isl.id));
          li.appendChild(btn);
          inspectorFeed.appendChild(li);
        }
        if (!showAllIslandResidents && residents.length > 4) {
          const li = document.createElement('li');
          const moreBtn = document.createElement('button');
          moreBtn.type = 'button';
          moreBtn.className = 'feed-row-btn';
          moreBtn.dataset.focusKey = 'island-more';
          moreBtn.innerHTML = `<span class="feed-left"><span class="feed-label">나머지 주민 ${residents.length - 4}명 더 보기</span></span>`;
          moreBtn.addEventListener('click', () => {
            showAllIslandResidents = true;
            refreshInspector(true);
          });
          li.appendChild(moreBtn);
          inspectorFeed.appendChild(li);
        }
      }
    });
    inspectorCard.classList.remove('hidden');
  }
}

function renderDirectoryList(forceRebuild = false) {
  if (directoryDrawer.classList.contains('hidden')) return;
  const q = dirSearchInput.value.trim().toLowerCase();
  const effective = getEffectiveSnapshot();
  const allVillagers = [...effective.villagers].sort((a, b) => {
    const scoreA = a.activity === 'error' ? 2 : a.isRunning ? 1 : 0;
    const scoreB = b.activity === 'error' ? 2 : b.isRunning ? 1 : 0;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return b.lastModifiedMs - a.lastModifiedMs;
  });

  const matchedVillagers = allVillagers.filter((v) => {
    if (!q) return true;
    return `${v.islandName} ${v.displayName} ${v.title} ${v.detail}`.toLowerCase().includes(q);
  });
  const matchedActive = matchedVillagers.filter((v) => v.isRunning || v.activity === 'error');
  const matchedIdle = matchedVillagers.filter((v) => !v.isRunning && v.activity !== 'error');
  const matchedIslands = effective.islands.filter((isl) => {
    if (!q) return true;
    return `${isl.name} ${isl.folderPath}`.toLowerCase().includes(q);
  });

  const sig = JSON.stringify([
    q,
    showAllIdleDir,
    matchedActive.map((v) => [v.conversationId, v.displayName, v.detail, v.emoji]),
    matchedIdle.map((v) => [v.conversationId, v.displayName, v.emoji]),
    matchedIslands.map((i) => [i.id, i.name, i.activeCount, i.villagerCount]),
  ]);
  if (!forceRebuild && sig === lastDirectorySig) return;
  lastDirectorySig = sig;

  withPreservedFocus(directoryDrawer, () => {
    directoryList.innerHTML = '';

    const appendSectionLabel = (text) => {
      const label = document.createElement('div');
      label.className = 'dir-section-label';
      label.textContent = text;
      directoryList.appendChild(label);
    };

    const appendVillagerRow = (v) => {
      const vis = getVillagerVisualMeta(v.conversationId);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `dir-item${v.isRunning ? ' is-running' : ''}`;
      btn.dataset.focusKey = `dir-v-${v.conversationId}`;
      btn.innerHTML = `
        <span class="dir-item-main">
          <span aria-hidden="true">${vis.speciesEmoji}${v.emoji}</span>
          <span class="dir-item-title">${escapeHtml(v.displayName)}</span>
        </span>
        <span class="dir-item-sub">${escapeHtml(v.islandName)} · ${escapeHtml(v.isRunning || v.activity === 'error' ? (v.detail || v.actionLabel) : '휴식')}</span>
      `;
      btn.addEventListener('click', () => {
        toggleDrawer(directoryDrawer, listBtn, false, false);
        focusVillagerById(v.conversationId, null);
      });
      directoryList.appendChild(btn);
    };

    if (matchedActive.length > 0) {
      appendSectionLabel(`활동 중인 주민 (${matchedActive.length}명)`);
      for (const v of matchedActive) appendVillagerRow(v);
    }

    if (matchedIslands.length > 0) {
      appendSectionLabel(`프로젝트 섬 (${matchedIslands.length}곳)`);
      for (const isl of matchedIslands) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dir-item${isl.activeCount > 0 ? ' is-running' : ''}`;
        btn.dataset.focusKey = `dir-i-${isl.id}`;
        btn.innerHTML = `
          <span class="dir-item-main">
            <span aria-hidden="true">🏝️</span>
            <span class="dir-item-title">${escapeHtml(isl.name)} 섬</span>
          </span>
          <span class="dir-item-sub">${isl.activeCount > 0 ? `활동 ${isl.activeCount}명` : `주민 ${isl.villagerCount}명`}</span>
        `;
        btn.addEventListener('click', () => {
          toggleDrawer(directoryDrawer, listBtn, false, false);
          focusIslandById(isl.id);
        });
        directoryList.appendChild(btn);
      }
    }

    if (matchedIdle.length > 0) {
      appendSectionLabel(`휴식 중인 주민 (${matchedIdle.length}명)`);
      const visibleIdle = !q && !showAllIdleDir && matchedIdle.length > 3 ? matchedIdle.slice(0, 3) : matchedIdle;
      for (const v of visibleIdle) appendVillagerRow(v);
      if (!q && !showAllIdleDir && matchedIdle.length > 3) {
        const moreBtn = document.createElement('button');
        moreBtn.type = 'button';
        moreBtn.className = 'dir-item dir-more-btn';
        moreBtn.dataset.focusKey = 'dir-idle-more';
        moreBtn.textContent = `휴식 중인 주민 ${matchedIdle.length - 3}명 더 보기`;
        moreBtn.addEventListener('click', () => {
          showAllIdleDir = true;
          renderDirectoryList(true);
        });
        directoryList.appendChild(moreBtn);
      }
    }

    if (matchedActive.length === 0 && matchedIslands.length === 0 && matchedIdle.length === 0) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'shortcut-note';
      emptyMsg.textContent = '검색 조건과 일치하는 섬이나 주민이 없습니다.';
      directoryList.appendChild(emptyMsg);
    }
  });
}

function drawRoundedRect(x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function drawAgentHouse(hx, hy, villager, roofColor, animSec) {
  const isAtHome = villager.station === 'home';
  const isSub = Boolean(villager.isSubagent);
  const bodyW = isSub ? 38 : 44;
  const bodyH = isSub ? 24 : 28;
  const roofPeak = isSub ? 15 : 18;
  const halfW = bodyW / 2;

  ctx.save();
  ctx.translate(hx, hy);

  ctx.fillStyle = 'rgba(244, 228, 179, 0.45)';
  drawRoundedRect(-halfW - 10, -2, bodyW + 20, bodyH + 22, 12);
  ctx.fill();

  ctx.fillStyle = 'rgba(38, 74, 42, 0.2)';
  drawRoundedRect(-halfW + 2, bodyH - 4, bodyW + 2, 8, 4);
  ctx.fill();

  if (!isSub) {
    ctx.fillStyle = '#a16247';
    ctx.strokeStyle = '#6b3e2b';
    ctx.lineWidth = 1.6;
    drawRoundedRect(halfW - 12, -roofPeak - 3, 7, 13, 2);
    ctx.fill();
    ctx.stroke();

    if (isAtHome && !reducedMotion && Math.sin(animSec * 3 + hx) > -0.3) {
      const smokeY = (animSec * 14 + hx) % 14;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.65 - smokeY / 24})`;
      ctx.beginPath();
      ctx.arc(halfW - 8.5, -roofPeak - 7 - smokeY * 0.6, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = isSub ? '#fff4e6' : '#fff9e6';
  ctx.strokeStyle = '#8b5e34';
  ctx.lineWidth = 2;
  drawRoundedRect(-halfW, 0, bodyW, bodyH, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = roofColor;
  ctx.strokeStyle = '#633d20';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-halfW - 6, 3);
  ctx.lineTo(0, -roofPeak);
  ctx.lineTo(halfW + 6, 3);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  if (isSub) {
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.arc(0, -roofPeak + 7, 3.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#8c5a32';
  drawRoundedRect(-5, bodyH - 14, 10, 14, 3);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(2.5, bodyH - 7, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isAtHome ? '#fde047' : '#bae6fd';
  ctx.strokeStyle = '#7c512c';
  ctx.lineWidth = 1.4;
  drawRoundedRect(-halfW + 5, 6, 8, 8, 2);
  ctx.fill();
  ctx.stroke();

  drawRoundedRect(halfW - 13, 6, 8, 8, 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#d97706';
  ctx.fillRect(halfW - 9, bodyH - 5, 6, 5);
  ctx.fillStyle = '#fb7185';
  ctx.beginPath();
  ctx.arc(halfW - 6, bodyH - 7, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawEmptyPlotSign(cx, cy) {
  ctx.save();
  ctx.fillStyle = '#8c5a32';
  drawRoundedRect(cx - 3, cy, 6, 20, 2);
  ctx.fill();

  ctx.fillStyle = '#fff8e2';
  ctx.strokeStyle = '#9e7340';
  ctx.lineWidth = 2;
  drawRoundedRect(cx - 48, cy - 20, 96, 24, 8);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#5c3e24';
  ctx.font = `700 12px ${CANVAS_FONT}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🪧 빈 집터', cx, cy - 8);
  ctx.restore();
}

function drawStationLabel(cx, cy, label, isBusy = false) {
  if (camera.zoom < 0.42) return;
  ctx.save();
  ctx.font = `700 11.5px ${CANVAS_FONT}`;
  const tw = ctx.measureText(label).width + 12;
  const ly = cy - 48;
  ctx.fillStyle = isBusy ? 'rgba(237, 249, 241, 0.96)' : 'rgba(255, 249, 230, 0.94)';
  ctx.strokeStyle = isBusy ? '#2a7d4f' : '#875f31';
  ctx.lineWidth = isBusy ? 1.5 : 1.1;
  drawRoundedRect(cx - tw / 2, ly, tw, 18, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = isBusy ? '#185735' : '#342112';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, cx, ly + 9.5);
  ctx.restore();
}

function drawIsland(isl, animSec) {
  const { x, y, w, h, isCompactEmpty, resTop, resHeight, laneY, stations, homeSlots } = isl;
  const isSelectedIsl = selectedTarget?.type === 'island' && selectedTarget.id === isl.id;

  ctx.save();
  const pulse = reducedMotion ? 0 : Math.sin(animSec * 2 + x * 0.01) * 3;
  ctx.fillStyle = isSelectedIsl ? 'rgba(22, 163, 74, 0.25)' : 'rgba(255, 255, 255, 0.28)';
  drawRoundedRect(x - 14 - pulse, y - 10 - pulse, w + 28 + pulse * 2, h + 22 + pulse * 2, 54);
  ctx.fill();

  if (isSelectedIsl) {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 3.5;
    drawRoundedRect(x - 12, y - 9, w + 24, h + 20, 52);
    ctx.stroke();
  }

  ctx.fillStyle = '#f3df9b';
  drawRoundedRect(x - 6, y - 4, w + 12, h + 10, 48);
  ctx.fill();
  ctx.strokeStyle = isSelectedIsl ? '#15803d' : isl.isCurrentWorkspace ? '#d97706' : '#c6a755';
  ctx.lineWidth = isSelectedIsl || isl.isCurrentWorkspace ? 4 : 3;
  ctx.stroke();

  ctx.fillStyle = '#75ca6e';
  drawRoundedRect(x + 8, y + 8, w - 16, h - 18, 38);
  ctx.fill();

  ctx.fillStyle = '#87d87c';
  drawRoundedRect(x + 20, y + 18, w - 40, h - 38, 28);
  ctx.fill();

  if (isCompactEmpty) {
    drawEmptyPlotSign(x + w / 2, y + h / 2 + 6);
  } else {
    ctx.fillStyle = 'rgba(255, 252, 232, 0.16)';
    drawRoundedRect(x + 26, y + resTop - 16, w - 52, resHeight + 14, 22);
    ctx.fill();

    ctx.strokeStyle = 'rgba(244, 228, 179, 0.78)';
    ctx.lineWidth = 9;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + 56, y + laneY);
    ctx.lineTo(x + w - 56, y + laneY);
    ctx.stroke();

    for (const plot of homeSlots) {
      ctx.beginPath();
      ctx.moveTo(x + plot.hx, y + plot.hy + 26);
      ctx.lineTo(x + plot.hx, y + laneY);
      ctx.stroke();
    }

    for (const st of Object.values(stations)) {
      ctx.beginPath();
      ctx.moveTo(x + st.x, y + laneY);
      ctx.lineTo(x + st.x, y + st.y);
      ctx.stroke();
    }

    const seed = hashStr(isl.id);
    for (let i = 0; i < 6; i += 1) {
      const onLeft = i % 2 === 0;
      const fx = onLeft ? x + 28 + ((seed + i * 19) % 18) : x + w - 46 + ((seed + i * 23) % 18);
      const fy = y + 48 + ((seed + i * 67) % Math.max(40, h - 96));
      ctx.fillStyle = i % 3 === 0 ? '#ffe066' : '#ff9ebb';
      ctx.beginPath();
      ctx.arc(fx, fy, 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    for (const plot of homeSlots) {
      drawAgentHouse(x + plot.hx, y + plot.hy, plot.villager, plot.roofColor, animSec);
    }

    drawBookshelfStation(x + stations.bookshelf.x, y + stations.bookshelf.y);
    drawBoardStation(x + stations.board.x, y + stations.board.y);
    drawWorkbenchStation(x + stations.workbench.x, y + stations.workbench.y);
    drawGeneratorStation(x + stations.generator.x, y + stations.generator.y, isl.activeCount > 0, animSec);
    drawAirportStation(x + stations.airport.x, y + stations.airport.y, animSec);

    for (const st of Object.values(stations)) {
      drawStationLabel(x + st.x, y + st.y, st.label, st.busy);
    }
  }

  const signX = x + 16;
  const signY = y - 12;
  ctx.font = `800 13px ${CANVAS_FONT}`;
  const rawName = isl.isCurrentWorkspace ? `★ ${isl.name}` : isl.name;
  const labelText = rawName.length > 22 ? `${rawName.slice(0, 21)}…` : rawName;
  const textW = ctx.measureText(labelText).width;
  const signW = Math.max(88, textW + 40);

  ctx.fillStyle = '#7b4f2a';
  drawRoundedRect(signX + 18, signY + 22, 8, 16, 3);
  ctx.fill();

  ctx.fillStyle = '#fff8e2';
  ctx.strokeStyle = isl.isCurrentWorkspace || isl.activeCount > 0 ? '#d97706' : '#9e7340';
  ctx.lineWidth = isl.activeCount > 0 || isl.isCurrentWorkspace ? 3 : 2.5;
  drawRoundedRect(signX, signY, signW, 28, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = isl.activeCount > 0 ? '#16a34a' : '#b79e72';
  ctx.beginPath();
  ctx.arc(signX + 15, signY + 14, 5, 0, Math.PI * 2);
  ctx.fill();
  if (isl.activeCount > 0 && !reducedMotion) {
    ctx.fillStyle = 'rgba(22, 163, 74, 0.28)';
    ctx.beginPath();
    ctx.arc(signX + 15, signY + 14, 8 + Math.sin(animSec * 4) * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#342112';
  ctx.textBaseline = 'middle';
  ctx.fillText(labelText, signX + 26, signY + 14.5);

  ctx.restore();
}

function drawBoardStation(x, y) {
  ctx.fillStyle = '#7b4f2a';
  ctx.fillRect(x - 14, y - 4, 5, 14);
  ctx.fillRect(x + 9, y - 4, 5, 14);

  ctx.fillStyle = '#a36b3d';
  ctx.strokeStyle = '#5d391b';
  ctx.lineWidth = 2;
  drawRoundedRect(x - 22, y - 26, 44, 24, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(x - 17, y - 22, 12, 10);
  ctx.fillStyle = '#bae6fd';
  ctx.fillRect(x - 2, y - 21, 10, 12);
  ctx.fillStyle = '#fecdd3';
  ctx.fillRect(x + 10, y - 22, 8, 8);
}

function drawBookshelfStation(x, y) {
  ctx.fillStyle = '#8c5a32';
  ctx.strokeStyle = '#5d391b';
  ctx.lineWidth = 2;
  drawRoundedRect(x - 18, y - 24, 36, 32, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#b98354';
  ctx.fillRect(x - 14, y - 20, 28, 10);
  ctx.fillRect(x - 14, y - 7, 28, 10);

  const bookColors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#ec4899'];
  for (let i = 0; i < 5; i += 1) {
    ctx.fillStyle = bookColors[i];
    ctx.fillRect(x - 12 + i * 5, y - 19, 4, 9);
    ctx.fillStyle = bookColors[(i + 2) % 5];
    ctx.fillRect(x - 12 + i * 5, y - 6, 4, 9);
  }
}

function drawWorkbenchStation(x, y) {
  ctx.fillStyle = '#a36b3d';
  ctx.strokeStyle = '#633e1f';
  ctx.lineWidth = 2;
  drawRoundedRect(x - 20, y - 12, 40, 18, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#754925';
  ctx.fillRect(x - 15, y + 6, 6, 9);
  ctx.fillRect(x + 9, y + 6, 6, 9);

  ctx.fillStyle = '#dbeafe';
  ctx.fillRect(x - 14, y - 9, 14, 10);
  ctx.fillStyle = '#9ca3af';
  ctx.fillRect(x + 5, y - 10, 9, 5);
  ctx.fillStyle = '#7c4a21';
  ctx.fillRect(x + 8, y - 5, 3, 7);
}

function drawGeneratorStation(x, y, active, animSec) {
  ctx.fillStyle = '#4b6b78';
  ctx.strokeStyle = '#2d454f';
  ctx.lineWidth = 2;
  drawRoundedRect(x - 18, y - 20, 36, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1e293b';
  drawRoundedRect(x - 12, y - 14, 24, 12, 3);
  ctx.fill();

  const blink = active && (reducedMotion || Math.sin(animSec * 8) > 0);
  ctx.fillStyle = blink ? '#34d399' : '#64748b';
  ctx.beginPath();
  ctx.arc(x - 6, y - 8, 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = active ? '#38bdf8' : '#475569';
  ctx.fillRect(x, y - 9, 9, 3);
}

function drawAirportStation(x, y, animSec) {
  ctx.fillStyle = '#c58b54';
  ctx.strokeStyle = '#87572c';
  ctx.lineWidth = 2;
  drawRoundedRect(x - 20, y - 6, 46, 18, 4);
  ctx.fill();
  ctx.stroke();

  // Mini blue globe beside telescope for clear web/world metaphor
  ctx.fillStyle = '#38bdf8';
  ctx.strokeStyle = '#1e40af';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x - 11, y - 12, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(x - 12, y - 13, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#5c4028';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(x + 2, y - 4);
  ctx.lineTo(x + 6, y - 18);
  ctx.lineTo(x + 11, y - 4);
  ctx.stroke();

  ctx.save();
  ctx.translate(x + 6, y - 19);
  ctx.rotate(-0.2 + (reducedMotion ? 0 : Math.sin(animSec * 1.5) * 0.08));
  ctx.fillStyle = '#eab308';
  drawRoundedRect(-8, -3, 18, 6, 2);
  ctx.fill();
  ctx.restore();
}

function getSpeciesPalette(species) {
  switch (species) {
    case 'cat':
      return { fur: '#fde68a', inner: '#fca5a5', muzzle: '#fffbeb' };
    case 'shiba':
      return { fur: '#f59e0b', inner: '#fde68a', muzzle: '#fffbeb' };
    case 'bunny':
      return { fur: '#fdf2f8', inner: '#f9a8d4', muzzle: '#ffffff' };
    case 'bear':
      return { fur: '#b47b52', inner: '#eab68d', muzzle: '#f5dec2' };
    case 'fox':
      return { fur: '#ea580c', inner: '#fed7aa', muzzle: '#fff7ed' };
    case 'frog':
      return { fur: '#84cc16', inner: '#d9f99d', muzzle: '#ecfccb' };
    default:
      return { fur: '#fcd34d', inner: '#fde68a', muzzle: '#ffffff' };
  }
}

function drawVillager(actor, animSec, isSelected, pendingNameplates, pendingBubbles) {
  const v = actor.data;
  const isCurrentConv = hostConversationId && v.conversationId === hostConversationId;
  const isHovered = hoveredTarget?.type === 'villager' && hoveredTarget.id === actor.id;
  const moving = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 2;
  const bob = reducedMotion
    ? 0
    : moving
      ? Math.abs(Math.sin(animSec * 14)) * 5
      : v.activity === 'sleeping'
        ? Math.sin(animSec * 2) * 1.2
        : Math.sin(animSec * 4 + actor.x * 0.05) * 1.8;

  const px = actor.x;
  const py = actor.y - bob;
  const pal = getSpeciesPalette(actor.species);

  for (let i = actor.dust.length - 1; i >= 0; i -= 1) {
    const d = actor.dust[i];
    ctx.fillStyle = `rgba(255, 250, 235, ${d.life * 0.7})`;
    ctx.beginPath();
    ctx.arc(d.x, d.y, (1.4 - d.life) * 8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = 'rgba(32, 66, 36, 0.25)';
  ctx.beginPath();
  ctx.ellipse(actor.x, actor.y + 11, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  if (isSelected || isHovered || isCurrentConv) {
    ctx.strokeStyle = isSelected ? '#d97706' : isHovered ? '#38bdf8' : '#16a34a';
    ctx.lineWidth = isSelected ? 3 : 2.2;
    ctx.beginPath();
    ctx.ellipse(actor.x, actor.y + 11, 17, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.save();
  ctx.translate(px, py);
  if (actor.facing < 0) {
    ctx.scale(-1, 1);
  }

  ctx.fillStyle = actor.shirt;
  ctx.strokeStyle = '#4a3220';
  ctx.lineWidth = 1.8;
  drawRoundedRect(-9, -2, 18, 13, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = pal.fur;
  if (actor.species === 'bunny') {
    drawRoundedRect(-10, -34, 6, 15, 3);
    ctx.fill();
    ctx.stroke();
    drawRoundedRect(4, -34, 6, 15, 3);
    ctx.fill();
    ctx.stroke();
  } else if (actor.species === 'bear' || actor.species === 'hamster' || actor.species === 'frog') {
    ctx.beginPath();
    ctx.arc(-9, -21, 5, 0, Math.PI * 2);
    ctx.arc(9, -21, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(-12, -16);
    ctx.lineTo(-10, -28);
    ctx.lineTo(-3, -21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(12, -16);
    ctx.lineTo(10, -28);
    ctx.lineTo(3, -21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.fillStyle = pal.fur;
  ctx.beginPath();
  ctx.ellipse(0, -13, 13.5, 11.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = pal.muzzle;
  ctx.beginPath();
  ctx.ellipse(0, -9, 6.5, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 114, 182, 0.45)';
  ctx.beginPath();
  ctx.arc(-7.5, -10.5, 2.3, 0, Math.PI * 2);
  ctx.arc(7.5, -10.5, 2.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2d1c10';
  if (v.activity === 'sleeping') {
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-7, -14);
    ctx.lineTo(-3, -14);
    ctx.moveTo(3, -14);
    ctx.lineTo(7, -14);
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.arc(-5, -14.5, 1.8, 0, Math.PI * 2);
    ctx.arc(5, -14.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#4a2e1b';
  ctx.beginPath();
  ctx.arc(0, -10.5, 1.6, 0, Math.PI * 2);
  ctx.fill();

  if (!v.isSubagent) {
    ctx.fillStyle = '#78350f';
    drawRoundedRect(-9, -27, 18, 4, 2);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    drawRoundedRect(-6, -33, 12, 7, 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(-6, -28, 12, 2);
  } else {
    ctx.strokeStyle = '#15803d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -24);
    ctx.quadraticCurveTo(2, -31, 6, -32);
    ctx.stroke();
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(7, -32, 4.5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  drawActivityProp(v.activity, animSec, actor.facing);
  ctx.restore();

  const shortName = middleTruncate(v.displayName, 14);
  const prefix = isCurrentConv ? '★ ' : v.isSubagent ? '🌱 ' : '';
  const nameTag = `${prefix}${shortName}`;
  pendingNameplates.push({
    actor,
    v,
    px,
    ny: actor.y + 15,
    nameTag,
    isCurrentConv,
    isSelected,
  });

  const showBubble =
    isSelected ||
    isHovered ||
    v.activity === 'error' ||
    (v.isRunning && v.activity !== 'thinking');

  if (showBubble) {
    pendingBubbles.push({
      actor,
      v,
      px,
      py,
      text: `${v.emoji} ${v.detail || v.actionLabel}`,
    });
  }
}

function drawResolvedNameplates(pendingNameplates) {
  if (!pendingNameplates.length) return;
  ctx.save();
  ctx.font = `700 11.5px ${CANVAS_FONT}`;

  const placed = [];
  const items = [...pendingNameplates].sort((a, b) => a.ny - b.ny || a.px - b.px);

  for (const item of items) {
    const isl = islandLayouts.get(item.v.islandId);
    const nw = Math.min(138, ctx.measureText(item.nameTag).width + 12);
    const nh = 17;
    let nx = item.px - nw / 2;
    if (isl) {
      nx = Math.max(isl.x + 8, Math.min(isl.x + isl.w - nw - 8, nx));
    }
    let ny = item.ny;

    let guard = 0;
    while (guard < 3) {
      const collides = placed.some(
        (p) => nx < p.nx + p.nw + 4 && nx + nw + 4 > p.nx && ny < p.ny + p.nh + 2 && ny + nh + 2 > p.ny
      );
      if (!collides) break;
      ny += nh + 2;
      guard += 1;
    }

    placed.push({ nx, ny, nw, nh, item });
  }

  for (const { nx, ny, nw, nh, item } of placed) {
    ctx.fillStyle = item.isCurrentConv
      ? '#166534'
      : item.isSelected
        ? '#7c2d12'
        : 'rgba(52, 33, 18, 0.90)';
    drawRoundedRect(nx, ny, nw, nh, 7);
    ctx.fill();
    ctx.fillStyle = '#fff9e6';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.nameTag, nx + nw / 2, ny + nh / 2 + 0.5, nw - 8);
  }
  ctx.restore();
}

function drawResolvedBubbles(pendingBubbles) {
  if (!pendingBubbles.length) return;

  ctx.save();
  ctx.font = `700 11.5px ${CANVAS_FONT}`;

  const rects = [];
  const items = [...pendingBubbles].sort((a, b) => a.px - b.px || a.py - b.py);
  const horizontalShifts = [0, -28, 28, -56, 56];

  for (const item of items) {
    const isl = islandLayouts.get(item.v.islandId);
    const bw = Math.min(160, Math.max(68, ctx.measureText(item.text).width + 18));
    const bh = 23;
    const minBx = isl ? isl.x + 8 : item.px - bw / 2 - 80;
    const maxBx = isl ? isl.x + isl.w - bw - 8 : item.px - bw / 2 + 80;
    const baseBx = Math.max(minBx, Math.min(maxBx, item.px - bw / 2));
    const baseBy = item.py - 60;

    let chosenBx = baseBx;
    let chosenBy = baseBy;
    let placedClean = false;

    for (let lift = 0; lift <= 1 && !placedClean; lift += 1) {
      const candidateY = baseBy - lift * 26;
      for (const shift of horizontalShifts) {
        const candidateX = Math.max(minBx, Math.min(maxBx, baseBx + shift));
        const collides = rects.some(
          (r) =>
            candidateX < r.bx + r.bw + 5 &&
            candidateX + bw + 5 > r.bx &&
            candidateY < r.by + r.bh + 4 &&
            candidateY + bh + 4 > r.by
        );
        if (!collides) {
          chosenBx = candidateX;
          chosenBy = candidateY;
          placedClean = true;
          break;
        }
      }
    }

    if (!placedClean) {
      chosenBy = baseBy - 28;
    }

    rects.push({ bx: chosenBx, by: chosenBy, bw, bh, item });
  }

  for (const { bx, by, bw, bh, item } of rects) {
    const { px, py, v, text } = item;
    const strokeCol = v.activity === 'error' ? '#dc2626' : v.isRunning ? '#16a34a' : '#875f31';
    const gapToHead = py - 35 - (by + bh);

    if (gapToHead > 6) {
      const anchorX = Math.max(bx + 12, Math.min(bx + bw - 12, px));
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = 1.6;
      ctx.setLineDash(gapToHead > 22 ? [3, 3] : []);
      ctx.beginPath();
      ctx.moveTo(anchorX, by + bh);
      ctx.lineTo(px, py - 35);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.fillStyle = v.isRunning ? '#fffdf5' : 'rgba(255, 250, 234, 0.96)';
    ctx.strokeStyle = strokeCol;
    ctx.lineWidth = v.isRunning ? 2.2 : 1.6;
    drawRoundedRect(bx, by, bw, bh, 11);
    ctx.fill();
    ctx.stroke();

    if (gapToHead <= 6) {
      const tipX = Math.max(bx + 10, Math.min(bx + bw - 10, px));
      ctx.fillStyle = v.isRunning ? '#fffdf5' : 'rgba(255, 250, 234, 0.96)';
      ctx.beginPath();
      ctx.moveTo(tipX - 4, by + bh - 1);
      ctx.lineTo(tipX, by + bh + 5);
      ctx.lineTo(tipX + 4, by + bh - 1);
      ctx.closePath();
      ctx.fill();
    }

    ctx.fillStyle = '#342112';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, bx + bw / 2, by + bh / 2 + 0.5, bw - 12);
  }

  ctx.restore();
}

function drawActivityProp(activity, animSec, facing = 1) {
  if (activity === 'crafting') {
    ctx.save();
    ctx.translate(12, 0);
    ctx.rotate(-0.4 + (reducedMotion ? 0 : Math.sin(animSec * 12) * 0.55));
    ctx.fillStyle = '#7c4a21';
    ctx.fillRect(-1.5, -10, 3, 12);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-5, -13, 10, 5);
    ctx.restore();
    if (reducedMotion || Math.sin(animSec * 10) > 0.2) {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(17, -10, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (activity === 'reading') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.4;
    drawRoundedRect(8, -6, 11, 8, 2);
    ctx.fill();
    ctx.stroke();
  } else if (activity === 'command') {
    ctx.save();
    ctx.translate(14, -4);
    ctx.rotate(reducedMotion ? 0 : animSec * 4);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 1.4);
    ctx.stroke();
    ctx.restore();
  } else if (activity === 'thinking') {
    const floatY = reducedMotion ? 0 : Math.sin(animSec * 3) * 2.2;
    ctx.save();
    if (facing < 0) ctx.scale(-1, 1);
    ctx.fillStyle = '#fffdf5';
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(11, -28 + floatY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    drawRoundedRect(7, -46 + floatY, 24, 14, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#185735';
    for (let d = 0; d < 3; d += 1) {
      const activeDot = reducedMotion || Math.floor(animSec * 3) % 3 === d;
      ctx.beginPath();
      ctx.arc(13 + d * 6, -39 + floatY, activeDot ? 1.7 : 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (activity === 'coffee') {
    ctx.fillStyle = '#ffffff';
    drawRoundedRect(9, -3, 7, 7, 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(12, -5);
    ctx.quadraticCurveTo(10, -10 - (reducedMotion ? 2 : (animSec * 8) % 6), 14, -14);
    ctx.stroke();
  } else if (activity === 'sleeping') {
    const drift = reducedMotion ? 4 : (animSec * 12) % 14;
    ctx.save();
    if (facing < 0) ctx.scale(-1, 1);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
    ctx.font = `800 11px ${CANVAS_FONT}`;
    ctx.fillText('Z', 12, -24 - drift * 0.7);
    ctx.restore();
  } else if (activity === 'error') {
    const drop = reducedMotion ? 4 : (animSec * 16) % 10;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(14, -18 + drop, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

let wasDemoActive = false;
let lastDemoStep = -1;

function stepAndRender(nowMs) {
  const animSec = reducedMotion ? 0 : nowMs / 1000;
  const dpr = window.devicePixelRatio || 1;
  const rect = stageEl.getBoundingClientRect();
  const targetW = Math.max(1, Math.floor(rect.width * dpr));
  const targetH = Math.max(1, Math.floor(rect.height * dpr));

  const effective = getEffectiveSnapshot();
  if (wasDemoActive && !effective.isDemo) {
    wasDemoActive = false;
    lastDemoStep = -1;
    if (selectedTarget?.id?.startsWith('demo-')) {
      selectedTarget = null;
      refreshInspector(true);
    }
    recomputeAndFit();
  } else if (effective.isDemo) {
    wasDemoActive = true;
    const step = Math.floor(Math.max(0, Date.now() - (demoUntil - 12000)) / 2400);
    if (step !== lastDemoStep) {
      lastDemoStep = step;
      if (selectedTarget) refreshInspector();
    }
  }

  const bounds = layoutIslands(effective.islands, effective.villagers);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    if (!camera.userAdjusted) {
      fitCameraToVillage(bounds, false);
    }
  } else if (!camera.userAdjusted && rect.width > 0) {
    fitCameraToVillage(bounds, false);
  }

  syncActors(effective.villagers);
  updateBadgeAndStats(effective);
  updateEmptyState(effective);

  for (const actor of actorMap.values()) {
    const rate = reducedMotion ? 1 : 0.16;
    actor.x += (actor.targetX - actor.x) * rate;
    actor.y += (actor.targetY - actor.y) * rate;
    for (let i = actor.dust.length - 1; i >= 0; i -= 1) {
      actor.dust[i].life -= 0.035;
      if (actor.dust[i].life <= 0) actor.dust.splice(i, 1);
    }
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, rect.width, rect.height);

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 2;
  for (let row = 0; row < 6; row += 1) {
    for (let col = 0; col < 5; col += 1) {
      const rx = ((col * 240 + animSec * 14 + row * 90) % (rect.width + 120)) - 60;
      const ry = (row + 0.5) * (rect.height / 6);
      ctx.beginPath();
      ctx.arc(rx, ry, 18, 0.2, 1.3);
      ctx.stroke();
    }
  }

  ctx.translate(camera.x, camera.y);
  ctx.scale(camera.zoom, camera.zoom);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.20)';
  for (const c of clouds) {
    const cx = ((c.x + animSec * c.speed) % 2000) - 1000;
    const cy = c.y - 420;
    ctx.beginPath();
    ctx.arc(cx, cy, 28 * c.scale, 0, Math.PI * 2);
    ctx.arc(cx + 24 * c.scale, cy - 8 * c.scale, 22 * c.scale, 0, Math.PI * 2);
    ctx.arc(cx + 46 * c.scale, cy, 24 * c.scale, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const isl of islandLayouts.values()) {
    drawIsland(isl, animSec);
  }

  const pendingNameplates = [];
  const pendingBubbles = [];
  const sortedActors = Array.from(actorMap.values()).sort((a, b) => a.y - b.y);
  for (const actor of sortedActors) {
    const isSel = selectedTarget?.type === 'villager' && selectedTarget.id === actor.id;
    drawVillager(actor, animSec, isSel, pendingNameplates, pendingBubbles);
  }
  drawResolvedNameplates(pendingNameplates);
  drawResolvedBubbles(pendingBubbles);

  ctx.restore();
  requestAnimationFrame(stepAndRender);
}

function screenToWorld(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left - camera.x) / camera.zoom,
    y: (clientY - rect.top - camera.y) / camera.zoom,
  };
}

function hitTestCanvas(clientX, clientY) {
  const world = screenToWorld(clientX, clientY);
  const hitRadius = Math.max(26, 20 / Math.max(0.35, camera.zoom));
  let hitActor = null;
  let bestDist = hitRadius;

  for (const actor of actorMap.values()) {
    const d = Math.hypot(world.x - actor.x, world.y - (actor.y - 10));
    if (d < bestDist) {
      bestDist = d;
      hitActor = actor;
    }
  }

  if (hitActor) {
    return { type: 'villager', id: hitActor.id };
  }

  for (const isl of islandLayouts.values()) {
    for (const plot of isl.homeSlots) {
      const px = isl.x + plot.hx;
      const py = isl.y + plot.hy;
      if (world.x >= px - 26 && world.x <= px + 26 && world.y >= py - 24 && world.y <= py + 32) {
        return { type: 'villager', id: plot.villager.conversationId };
      }
    }
    if (world.x >= isl.x && world.x <= isl.x + isl.w && world.y >= isl.y && world.y <= isl.y + isl.h) {
      return { type: 'island', id: isl.id };
    }
  }

  return null;
}

function updateCanvasTooltip(clientX, clientY, hit) {
  hoveredTarget = hit;
  if (!hit) {
    canvasTooltip.classList.add('hidden');
    return;
  }
  const effective = getEffectiveSnapshot();
  let label = '';
  if (hit.type === 'villager') {
    const v = effective.villagers.find((item) => item.conversationId === hit.id);
    if (v) label = `${v.title} · ${v.detail || v.actionLabel}`;
  } else if (hit.type === 'island') {
    const isl = effective.islands.find((item) => item.id === hit.id);
    if (isl) label = `${isl.name} 섬 (활동 ${isl.activeCount}명 / 주민 ${isl.villagerCount}명)`;
  }
  if (!label) {
    canvasTooltip.classList.add('hidden');
    return;
  }
  const stageRect = stageEl.getBoundingClientRect();
  const relX = Math.max(8, Math.min(stageRect.width - 210, clientX - stageRect.left + 12));
  const relY = Math.max(8, Math.min(stageRect.height - 36, clientY - stageRect.top - 32));
  canvasTooltip.textContent = label;
  canvasTooltip.style.transform = `translate(${Math.round(relX)}px, ${Math.round(relY)}px)`;
  canvasTooltip.classList.remove('hidden');
}

function handleCanvasClick(clientX, clientY) {
  if (!helpSheet.classList.contains('hidden')) {
    toggleDrawer(helpSheet, helpBtn, false, false);
    return;
  }
  if (!directoryDrawer.classList.contains('hidden')) {
    toggleDrawer(directoryDrawer, listBtn, false, false);
    return;
  }
  const hit = hitTestCanvas(clientX, clientY);
  if (!hit) {
    selectedTarget = null;
    refreshInspector(true);
    return;
  }
  if (hit.type === 'villager') {
    focusVillagerById(hit.id, null);
  } else {
    focusIslandById(hit.id);
  }
}

function zoomAtCenter(factor) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const mx = rect.width / 2;
  const my = rect.height / 2;
  const nextZoom = Math.max(0.28, Math.min(2.4, camera.zoom * factor));
  camera.x = mx - ((mx - camera.x) / camera.zoom) * nextZoom;
  camera.y = my - ((my - camera.y) / camera.zoom) * nextZoom;
  camera.zoom = nextZoom;
  camera.userAdjusted = true;
}

function recomputeAndFit() {
  const effective = getEffectiveSnapshot();
  fitCameraToVillage(layoutIslands(effective.islands, effective.villagers), true);
}

function stopDemoMode() {
  if (Date.now() >= demoUntil && !wasDemoActive) return;
  demoUntil = 0;
  wasDemoActive = false;
  lastDemoStep = -1;
  syncDemoUI(false);
  stopDemoBtn.classList.add('hidden');
  if (selectedTarget?.id?.startsWith('demo-')) {
    selectedTarget = null;
    refreshInspector(true);
  }
  recomputeAndFit();
  renderDirectoryList(true);
  showToast('시연을 종료하고 실제 마을로 돌아왔습니다.');
}

canvas.addEventListener('mousedown', (e) => {
  dragging = true;
  dragMoved = false;
  dragStartX = e.clientX;
  dragStartY = e.clientY;
  camStartX = camera.x;
  camStartY = camera.y;
  canvasTooltip.classList.add('hidden');
  canvas.classList.add('is-dragging');
  canvas.classList.remove('is-pointer');
});

canvas.addEventListener('mouseleave', () => {
  hoveredTarget = null;
  canvasTooltip.classList.add('hidden');
});

window.addEventListener('mousemove', (e) => {
  if (dragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.hypot(dx, dy) > 4) {
      dragMoved = true;
      camera.userAdjusted = true;
    }
    camera.x = camStartX + dx;
    camera.y = camStartY + dy;
    return;
  }
  if (e.target === canvas) {
    const hit = hitTestCanvas(e.clientX, e.clientY);
    canvas.classList.toggle('is-pointer', Boolean(hit));
    updateCanvasTooltip(e.clientX, e.clientY, hit);
  }
});

window.addEventListener('mouseup', (e) => {
  if (!dragging) return;
  dragging = false;
  canvas.classList.remove('is-dragging');
  if (!dragMoved && e.target === canvas) {
    handleCanvasClick(e.clientX, e.clientY);
  }
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.1 : 0.91;
  const nextZoom = Math.max(0.28, Math.min(2.4, camera.zoom * factor));
  camera.x = mx - ((mx - camera.x) / camera.zoom) * nextZoom;
  camera.y = my - ((my - camera.y) / camera.zoom) * nextZoom;
  camera.zoom = nextZoom;
  camera.userAdjusted = true;
}, { passive: false });

canvas.addEventListener('dblclick', recomputeAndFit);
resetViewBtn.addEventListener('click', recomputeAndFit);
zoomInBtn.addEventListener('click', () => zoomAtCenter(1.18));
zoomOutBtn.addEventListener('click', () => zoomAtCenter(0.84));
stopDemoBtn.addEventListener('click', stopDemoMode);

function toggleActiveFilter() {
  onlyActiveIslands = !onlyActiveIslands;
  syncFilterUI();
  recomputeAndFit();
  refreshInspector(true);
  renderDirectoryList(true);
}

filterBtn.addEventListener('click', toggleActiveFilter);
showAllIslandsBtn.addEventListener('click', () => {
  if (showAllIslandsBtn.dataset.mode === 'retry') {
    pollState();
    return;
  }
  onlyActiveIslands = false;
  syncFilterUI();
  recomputeAndFit();
  refreshInspector(true);
  renderDirectoryList(true);
});

helpBtn.addEventListener('click', () => toggleDrawer(helpSheet, helpBtn));
closeHelpBtn.addEventListener('click', () => toggleDrawer(helpSheet, helpBtn, false));

listBtn.addEventListener('click', () => {
  showAllIdleDir = false;
  const opened = toggleDrawer(directoryDrawer, listBtn);
  if (opened) {
    renderDirectoryList(true);
    dirSearchInput.focus();
  }
});
closeListBtn.addEventListener('click', () => toggleDrawer(directoryDrawer, listBtn, false));
dirSearchInput.addEventListener('input', () => renderDirectoryList(true));

demoBtn.addEventListener('click', () => {
  if (Date.now() < demoUntil) {
    stopDemoMode();
    return;
  }
  demoUntil = Date.now() + 12000;
  wasDemoActive = true;
  lastDemoStep = -1;
  selectedTarget = null;
  refreshInspector(true);
  syncDemoUI(true);
  stopDemoBtn.classList.remove('hidden');
  toggleDrawer(helpSheet, helpBtn, false, false);
  recomputeAndFit();
  showToast('독립 시범 마을에서 12초간 동작을 시연합니다.');
});

notifyBtn.addEventListener('click', async () => {
  notifyEnabled = !notifyEnabled;
  safeSetStorage('agentCrossing.notify', notifyEnabled ? '1' : '0');
  syncNotifyUI();

  if (notifyEnabled) {
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        await Notification.requestPermission();
      }
    } catch {
      // fallback to in-app toast
    }
    showToast('작업 완료·오류 알림을 켰습니다.');
  } else {
    showToast('작업 알림을 껐습니다.');
  }
});

inspectorBackBtn.addEventListener('click', () => {
  if (selectedTarget?.fromIslandId) {
    focusIslandById(selectedTarget.fromIslandId);
  }
});

closeInspectorBtn.addEventListener('click', () => {
  selectedTarget = null;
  refreshInspector(true);
});

retryBtn.addEventListener('click', () => {
  pollState();
});

function cycleVisibleIslands(direction) {
  const effective = getEffectiveSnapshot();
  if (!effective.islands.length) return;
  const currId =
    selectedTarget?.type === 'island'
      ? selectedTarget.id
      : selectedTarget?.type === 'villager'
        ? effective.villagers.find((v) => v.conversationId === selectedTarget.id)?.islandId
        : null;
  const idx = currId ? effective.islands.findIndex((isl) => isl.id === currId) : -1;
  const nextIdx =
    idx < 0
      ? direction > 0
        ? 0
        : effective.islands.length - 1
      : (idx + direction + effective.islands.length) % effective.islands.length;
  focusIslandById(effective.islands[nextIdx].id);
}

window.addEventListener('keydown', (e) => {
  const activeTag = document.activeElement?.tagName;

  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    showAllIdleDir = false;
    toggleDrawer(directoryDrawer, listBtn, true);
    renderDirectoryList(true);
    dirSearchInput.focus();
    dirSearchInput.select();
    return;
  }

  if (e.key === 'Escape') {
    if (!helpSheet.classList.contains('hidden')) {
      toggleDrawer(helpSheet, helpBtn, false);
      return;
    }
    if (!directoryDrawer.classList.contains('hidden')) {
      toggleDrawer(directoryDrawer, listBtn, false);
      return;
    }
    if (selectedTarget) {
      selectedTarget = null;
      refreshInspector(true);
      canvas.focus({ preventScroll: true });
    }
    return;
  }

  if (!directoryDrawer.classList.contains('hidden') && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
    const focusables = [dirSearchInput, ...directoryList.querySelectorAll('button.dir-item')];
    const currIdx = focusables.indexOf(document.activeElement);
    if (currIdx >= 0 || document.activeElement === dirSearchInput) {
      e.preventDefault();
      const base = currIdx < 0 ? 0 : currIdx;
      const nextIdx = Math.max(0, Math.min(focusables.length - 1, base + (e.key === 'ArrowDown' ? 1 : -1)));
      focusables[nextIdx]?.focus();
      return;
    }
  }

  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return;

  if (e.key === '/') {
    e.preventDefault();
    showAllIdleDir = false;
    toggleDrawer(directoryDrawer, listBtn, true);
    renderDirectoryList(true);
    dirSearchInput.focus();
  } else if (e.key === '[') {
    cycleVisibleIslands(-1);
  } else if (e.key === ']') {
    cycleVisibleIslands(1);
  } else if (e.key === 'f' || e.key === 'F') {
    toggleActiveFilter();
  } else if (e.key === 'r' || e.key === 'R') {
    recomputeAndFit();
  } else if (e.key === '+' || e.key === '=') {
    zoomAtCenter(1.18);
  } else if (e.key === '-') {
    zoomAtCenter(0.84);
  } else if (document.activeElement === canvas) {
    const panStep = 64;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      camera.x += panStep;
      camera.userAdjusted = true;
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      camera.x -= panStep;
      camera.userAdjusted = true;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      camera.y += panStep;
      camera.userAdjusted = true;
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      camera.y -= panStep;
      camera.userAdjusted = true;
    }
  }
});

async function launchStandalonePopout() {
  try {
    const res = await hostFetch('/api/popout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId: hostConversationId }),
    });
    const data = await res.json();
    if (!res.ok || !data?.ok) {
      showToast(data?.error || '미니창 실행에 실패했습니다.');
      return;
    }
    showToast('독립 미니창을 열었습니다.');
  } catch {
    showToast('미니창 실행에 실패했습니다.');
  }
}

pipBtn.addEventListener('click', async () => {
  if (pipWindow) {
    pipWindow.close();
    return;
  }

  if (isEmbeddedFrame) {
    await launchStandalonePopout();
    return;
  }

  const labelSpan = pipBtn.querySelector('span');
  if ('documentPictureInPicture' in window) {
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 460,
        height: 400,
      });

      for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) {
        pipWindow.document.head.appendChild(sheet.cloneNode(true));
      }
      pipWindow.document.title = '에이전트의 숲 (미니)';
      pipWindow.document.body.classList.add('is-pip');
      pipWindow.document.body.appendChild(stageWrapper);

      const restoreStage = () => {
        appShell.appendChild(stageWrapper);
        pipWindow = null;
        pipBtn.classList.remove('is-active');
        if (labelSpan) labelSpan.textContent = isEmbeddedFrame ? '팝아웃' : '미니창 고정';
        recomputeAndFit();
      };

      pipWindow.addEventListener('pagehide', restoreStage, { once: true });
      pipBtn.classList.add('is-active');
      if (labelSpan) labelSpan.textContent = '닫기';

      setTimeout(recomputeAndFit, 60);
      return;
    } catch {
      // fall through to backend popout window
    }
  }

  await launchStandalonePopout();
});

function applySnapshot(snapshot) {
  consecutivePollErrors = 0;
  retryBtn.classList.add('hidden');

  if (!snapshot || snapshot.unchanged) {
    if (snapshot?.etag) currentEtag = snapshot.etag;
    return;
  }

  if (snapshot.etag) currentEtag = snapshot.etag;
  if (snapshot.hostConversationId) hostConversationId = snapshot.hostConversationId;
  liveSnapshot = snapshot;
  processNotificationTransitions(snapshot);

  if (!hasAppliedInitialDefault) {
    hasAppliedInitialDefault = true;
    const rect = stageEl.getBoundingClientRect();
    if (rect.width > 0 && rect.width < 560) {
      const recentCutoff = Date.now() - 15 * 60 * 1000;
      const activeCount = (snapshot.islands || []).filter(
        (isl) => isl.activeCount > 0 || (isl.lastActivityMs && isl.lastActivityMs >= recentCutoff)
      ).length;
      if (activeCount > 0) {
        onlyActiveIslands = true;
        syncFilterUI();
      }
    }
    recomputeAndFit();
  }

  refreshInspector();
  renderDirectoryList();
}

let pollInFlight = false;
async function pollState() {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const query = currentEtag ? `?etag=${encodeURIComponent(currentEtag)}` : '';
    const res = await hostFetch(`/api/state${query}`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      applySnapshot(data);
    } else {
      consecutivePollErrors += 1;
      if (consecutivePollErrors >= 2) retryBtn.classList.remove('hidden');
    }
  } catch {
    consecutivePollErrors += 1;
    if (consecutivePollErrors >= 2) retryBtn.classList.remove('hidden');
  } finally {
    pollInFlight = false;
  }
}

let ws = null;
let reconnectDelay = 800;

function connectWebSocket() {
  const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`${proto}//${location.host}/ws`);

  ws.addEventListener('open', () => {
    reconnectDelay = 800;
    consecutivePollErrors = 0;
    retryBtn.classList.add('hidden');
  });

  ws.addEventListener('message', (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg?.type === 'snapshot' && msg.data) {
        applySnapshot(msg.data);
      }
    } catch {
      // ignore invalid message
    }
  });

  ws.addEventListener('close', () => {
    consecutivePollErrors += 1;
    if (consecutivePollErrors >= 2) retryBtn.classList.remove('hidden');
    setTimeout(connectWebSocket, reconnectDelay);
    reconnectDelay = Math.min(4000, reconnectDelay + 600);
  });

  ws.addEventListener('error', () => {
    ws?.close();
  });
}

if (window.sidecar?.onWorkspaceChange) {
  window.sidecar.onWorkspaceChange((uris) => {
    hostWorkspaceKeys = new Set(uris.map(normalizeClientUri).filter(Boolean));
  });
}

if (typeof ResizeObserver !== 'undefined') {
  const ro = new ResizeObserver(() => {
    const shellRect = appShell.getBoundingClientRect();
    const w = shellRect.width;
    if (!w) return;
    const mode = w < 560 ? 'narrow' : w < 760 ? 'mid' : 'wide';
    if (!camera.userAdjusted || mode !== lastShellMode || Math.abs(w - lastShellWidth) > 72) {
      lastShellMode = mode;
      lastShellWidth = w;
      recomputeAndFit();
    }
  });
  ro.observe(appShell);
}

async function boot() {
  if (!isEmbeddedFrame) {
    const labelSpan = pipBtn.querySelector('span');
    if (labelSpan) labelSpan.textContent = '미니창 고정';
    pipBtn.title = '다른 창 위에 항상 떠 있는 미니창(PiP) 전환';
  }
  const initRect = appShell.getBoundingClientRect();
  lastShellWidth = initRect.width || 0;
  lastShellMode = lastShellWidth < 560 ? 'narrow' : lastShellWidth < 760 ? 'mid' : 'wide';
  syncNotifyUI();
  syncFilterUI();
  requestAnimationFrame(stepAndRender);
  await pollState();
  if (!inSidecar) {
    connectWebSocket();
  }
  setInterval(pollState, 1200);
}

boot();
})();
