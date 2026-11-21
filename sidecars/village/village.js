(() => {
  const S = window.VillageSprites;
  const I = window.VillageI18n;
  const ISLAND_GAP_X = 62;
  const ISLAND_GAP_Y = 60;

  const HOUSE_ROOF_COLORS = [
    '#e06651',
    '#4f9cf9',
    '#48b878',
    '#e59934',
    '#9b72cf',
    '#ec6b9e',
    '#38b2ac',
  ];

  const SPECIES_LIST = ['cat', 'shiba', 'bunny', 'bear', 'fox', 'frog', 'squirrel', 'duck'];
  const SHIRT_COLORS = ['#f97316', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#eab308', '#14b8a6'];
  const SOURCE_IDS = ['all', 'antigravity', 'claude', 'cursor', 'codex'];

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

  const brandTitle = document.getElementById('brandTitle');
  const liveBadge = document.getElementById('liveBadge');
  const liveBadgeText = document.getElementById('liveBadgeText');
  const liveZeroTag = document.getElementById('liveZeroTag');
  const statsSummary = document.getElementById('statsSummary');
  const hudActions = document.getElementById('hudActions');

  const langBtn = document.getElementById('langBtn');
  const langBtnCode = document.getElementById('langBtnCode');
  const langOptEn = document.getElementById('langOptEn');
  const langOptKo = document.getElementById('langOptKo');

  const themeBtn = document.getElementById('themeBtn');
  const themeIconSlot = document.getElementById('themeIconSlot');
  const themeBtnLabel = document.getElementById('themeBtnLabel');

  const filterBtn = document.getElementById('filterBtn');
  const filterIconSlot = document.getElementById('filterIconSlot');
  const filterBtnLabel = document.getElementById('filterBtnLabel');

  const listBtn = document.getElementById('listBtn');
  const listBtnLabel = document.getElementById('listBtnLabel');
  const closeListBtn = document.getElementById('closeListBtn');
  const directoryDrawer = document.getElementById('directoryDrawer');
  const dirHeadingTitle = document.getElementById('dirHeadingTitle');
  const dirSourceFilters = document.getElementById('dirSourceFilters');
  const dirSearchInput = document.getElementById('dirSearchInput');
  const directoryList = document.getElementById('directoryList');
  const hiddenIslandsAccordion = document.getElementById('hiddenIslandsAccordion');
  const hiddenIslandsSummary = document.getElementById('hiddenIslandsSummary');
  const hiddenIslandsList = document.getElementById('hiddenIslandsList');

  const helpBtn = document.getElementById('helpBtn');
  const helpBtnLabel = document.getElementById('helpBtnLabel');
  const helpHeadingTitle = document.getElementById('helpHeadingTitle');
  const closeHelpBtn = document.getElementById('closeHelpBtn');
  const helpSheet = document.getElementById('helpSheet');

  const pipBtn = document.getElementById('pipBtn');
  const pipBtnLabel = document.getElementById('pipBtnLabel');
  const stopDemoBtn = document.getElementById('stopDemoBtn');
  const stopDemoLabel = document.getElementById('stopDemoLabel');
  const retryBtn = document.getElementById('retryBtn');

  const focusBanner = document.getElementById('focusBanner');
  const focusBannerText = document.getElementById('focusBannerText');
  const exitFocusBtn = document.getElementById('exitFocusBtn');
  const sourceFilterBanner = document.getElementById('sourceFilterBanner');
  const sourceBannerText = document.getElementById('sourceBannerText');
  const exitSourceBtn = document.getElementById('exitSourceBtn');

  const demoBtn = document.getElementById('demoBtn');
  const demoBtnLabel = document.getElementById('demoBtnLabel');
  const notifyBtn = document.getElementById('notifyBtn');
  const notifyBtnLabel = document.getElementById('notifyBtnLabel');
  const zoomControls = document.getElementById('zoomControls');
  const zoomInBtn = document.getElementById('zoomInBtn');
  const zoomOutBtn = document.getElementById('zoomOutBtn');
  const resetViewBtn = document.getElementById('resetViewBtn');
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
  const inspectorQuestBox = document.getElementById('inspectorQuestBox');
  const inspectorQuestLabel = document.getElementById('inspectorQuestLabel');
  const inspectorQuestText = document.getElementById('inspectorQuestText');
  const inspectorMeta = document.getElementById('inspectorMeta');
  const inspectorErrorBox = document.getElementById('inspectorErrorBox');
  const inspectorActions = document.getElementById('inspectorActions');
  const inspectorFeedLabel = document.getElementById('inspectorFeedLabel');
  const inspectorFeed = document.getElementById('inspectorFeed');
  const inspectorBackBtn = document.getElementById('inspectorBackBtn');
  const inspectorBackLabel = document.getElementById('inspectorBackLabel');
  const closeInspectorBtn = document.getElementById('closeInspectorBtn');
  const inspectorFooterText = document.getElementById('inspectorFooterText');

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

  const hiddenIslandIds = new Set();
  try {
    const rawHidden = JSON.parse(safeGetStorage('agentCrossing.hiddenIslands') || '[]');
    if (Array.isArray(rawHidden)) {
      for (const id of rawHidden) {
        if (typeof id === 'string' && id) hiddenIslandIds.add(id);
      }
    }
  } catch {
    // ignore malformed storage
  }

  function saveHiddenIslands() {
    safeSetStorage('agentCrossing.hiddenIslands', JSON.stringify(Array.from(hiddenIslandIds)));
  }

  const THEME_MODES = ['auto', 'day', 'sunset', 'night'];
  let themeMode = safeGetStorage('agentCrossing.themeMode') || 'auto';
  if (!THEME_MODES.includes(themeMode)) themeMode = 'auto';

  let liveSnapshot = { islands: [], villagers: [], stats: { activeVillagers: 0, totalVillagers: 0, activeIslands: 0, totalIslands: 0 } };
  let currentEtag = '';
  let hostConversationId = window.sidecar?.conversationId || '';
  let hostWorkspaceKeys = new Set();

  let onlyActiveIslands = false;
  let focusedIslandId = null;
  let activeSourceFilter = 'all';
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
  let lastOceanThemeKey = '';

  let rafId = 0;
  let pollTimerId = 0;
  let stageSkipped = false;
  let docHidden = Boolean(document.hidden);

  const prevVillagerStates = new Map();
  const prevIslandOrigins = new Map();
  const islandLayouts = new Map();
  const actorMap = new Map();
  const clouds = Array.from({ length: 7 }, (_, i) => ({
    x: i * 270,
    y: 50 + (i % 3) * 185,
    speed: 7 + (i % 4) * 2.5,
    scale: 0.78 + (i % 3) * 0.24,
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
    const s = String(str || '');
    for (let i = 0; i < s.length; i += 1) {
      h ^= s.charCodeAt(i);
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
    if (/^\/[A-Za-z]:[\\/]/.test(stripped)) {
      stripped = stripped.slice(1);
    }
    return stripped.replace(/\\/g, '/').replace(/\/+$/, '').toLowerCase();
  }

  function escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function truncateEnd(text, max = 28) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (!clean) return '';
    return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
  }

  function formatIslandTitle(name, isFreePlaza = false) {
    return I.formatIslandTitle(name, isFreePlaza);
  }

  function getVillagerVisualMeta(v) {
    const h = hashStr(v.conversationId || '');
    const species = v.species || SPECIES_LIST[h % SPECIES_LIST.length];
    return {
      species,
      shirt: SHIRT_COLORS[(h >> 4) % SHIRT_COLORS.length],
      roleCode: v.roleCode || (v.isSubagent ? 'helper' : 'mayor'),
    };
  }

  function hydrateStaticIcons() {
    for (const el of document.querySelectorAll('.ui-icon[data-icon]')) {
      const name = el.dataset.icon;
      const size = Number(el.dataset.size) || 14;
      el.innerHTML = S.renderIconSvg(name, size);
    }
  }

  function syncLanguageUI() {
    const lang = I.getLang();
    document.documentElement.lang = lang;
    document.title = pipWindow ? I.t('pageTitleMini') : I.t('pageTitle');

    if (brandTitle) brandTitle.textContent = I.t('brandTitle');
    canvas?.setAttribute('aria-label', I.t('canvasAria'));
    hudActions?.setAttribute('aria-label', I.t('toolbarAria'));
    liveBadge?.setAttribute('title', I.t('liveZeroTitle'));
    if (liveZeroTag) liveZeroTag.textContent = I.t('liveZeroTag');

    if (langBtn && langBtnCode) {
      if (lang === 'en') {
        langBtnCode.textContent = I.t('langTargetCodeKo');
        langBtnCode.setAttribute('lang', 'ko');
        langBtn.setAttribute('aria-label', I.t('langSwitchToKoAria'));
        langBtn.title = I.t('langSwitchToKoTitle');
      } else {
        langBtnCode.textContent = I.t('langTargetCodeEn');
        langBtnCode.setAttribute('lang', 'en');
        langBtn.setAttribute('aria-label', I.t('langSwitchToEnAria'));
        langBtn.title = I.t('langSwitchToEnTitle');
      }
    }

    langOptEn?.classList.toggle('is-selected', lang === 'en');
    langOptEn?.setAttribute('aria-pressed', lang === 'en' ? 'true' : 'false');
    langOptKo?.classList.toggle('is-selected', lang === 'ko');
    langOptKo?.setAttribute('aria-pressed', lang === 'ko' ? 'true' : 'false');

    if (listBtnLabel) listBtnLabel.textContent = I.t('listLabel');
    listBtn?.setAttribute('aria-label', I.t('listAria'));
    if (listBtn) listBtn.title = I.t('listTitle');

    if (helpBtnLabel) helpBtnLabel.textContent = I.t('helpLabel');
    helpBtn?.setAttribute('aria-label', I.t('helpAria'));
    if (helpBtn) helpBtn.title = I.t('helpTitle');

    if (pipBtnLabel) {
      if (pipWindow) pipBtnLabel.textContent = I.t('pipCloseLabel');
      else pipBtnLabel.textContent = isEmbeddedFrame ? I.t('pipPopoutLabel') : I.t('pipMiniLabel');
    }
    if (pipBtn) {
      pipBtn.setAttribute('aria-label', isEmbeddedFrame ? I.t('pipPopoutAria') : I.t('pipMiniTitle'));
      pipBtn.title = isEmbeddedFrame ? I.t('pipPopoutTitle') : I.t('pipMiniTitle');
    }

    if (stopDemoLabel) stopDemoLabel.textContent = I.t('stopDemoLabel');
    if (stopDemoBtn) stopDemoBtn.title = I.t('stopDemoTitle');
    if (retryBtn) retryBtn.textContent = I.t('retryLabel');

    zoomControls?.setAttribute('aria-label', I.t('zoomControlsAria'));
    zoomInBtn?.setAttribute('aria-label', I.t('zoomInAria'));
    if (zoomInBtn) zoomInBtn.title = I.t('zoomInTitle');
    zoomOutBtn?.setAttribute('aria-label', I.t('zoomOutAria'));
    if (zoomOutBtn) zoomOutBtn.title = I.t('zoomOutTitle');
    if (resetViewBtn) {
      resetViewBtn.textContent = I.t('fitLabel');
      resetViewBtn.setAttribute('aria-label', I.t('fitAria'));
      resetViewBtn.title = I.t('fitTitle');
    }

    if (exitFocusBtn) exitFocusBtn.textContent = I.t('focusExitBtn');
    if (exitSourceBtn) exitSourceBtn.textContent = I.t('sourceExitBtn');

    if (helpHeadingTitle) helpHeadingTitle.textContent = I.t('helpTitleHeading');
    closeHelpBtn?.setAttribute('aria-label', I.t('closeGuideAria'));
    if (notifyBtnLabel) notifyBtnLabel.textContent = I.t('notifyLabel');
    if (demoBtnLabel) demoBtnLabel.textContent = I.t('demoLabel');

    const legendIds = [
      ['legendRolesTitle', 'legendRolesTitle'],
      ['legendRoleMayor', 'legendRoleMayor'],
      ['legendRoleSub', 'legendRoleSub'],
      ['legendHouseState', 'legendHouseState'],
      ['legendTools', 'legendTools'],
      ['legendWorkTitle', 'legendWorkTitle'],
      ['legendWorkRead', 'legendWorkRead'],
      ['legendWorkBoard', 'legendWorkBoard'],
      ['legendWorkCraft', 'legendWorkCraft'],
      ['legendExecTitle', 'legendExecTitle'],
      ['legendExecCmd', 'legendExecCmd'],
      ['legendExecWeb', 'legendExecWeb'],
      ['legendExecErr', 'legendExecErr'],
      ['shortcutNote', 'shortcutNote'],
    ];
    for (const [domId, key] of legendIds) {
      const el = document.getElementById(domId);
      if (el) el.textContent = I.t(key);
    }

    if (dirHeadingTitle) dirHeadingTitle.textContent = I.t('dirHeading');
    closeListBtn?.setAttribute('aria-label', I.t('closeDirAria'));
    if (dirSearchInput) {
      dirSearchInput.placeholder = I.t('searchPlaceholder');
      dirSearchInput.setAttribute('aria-label', I.t('searchAria'));
    }

    inspectorCard?.setAttribute('aria-label', I.t('inspectorCardAria'));
    if (inspectorBackLabel) inspectorBackLabel.textContent = I.t('inspectorBackBtn');
    closeInspectorBtn?.setAttribute('aria-label', I.t('closeInspectorAria'));
    if (inspectorQuestLabel) inspectorQuestLabel.textContent = I.t('questLabel');
    if (inspectorFooterText) inspectorFooterText.textContent = I.t('passportFooter');

    lastStatsText = '';
    lastBadgeKey = '';
    lastInspectorSig = '';
    lastDirectorySig = '';
    S.clearTerrainCache();
    syncThemeUI();
    syncFilterUI();
    renderSourceFilterPills();
  }

  function switchLanguage(nextLang) {
    if (nextLang === I.getLang()) return;
    I.setLang(nextLang);
    if (toastTimer) clearTimeout(toastTimer);
    toastEl.classList.add('hidden');
    syncLanguageUI();
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
  }

  function syncThemeUI() {
    const resolved = S.getLightingTheme(themeMode, new Date());
    const iconName =
      themeMode === 'auto'
        ? 'clock-auto'
        : themeMode === 'day'
          ? 'sun'
          : themeMode === 'sunset'
            ? 'sunset'
            : 'moon';
    const labelText = I.formatThemeBtnLabel(themeMode, resolved.key);
    if (themeIconSlot) themeIconSlot.innerHTML = S.renderIconSvg(iconName, 13);
    if (themeBtnLabel) themeBtnLabel.textContent = labelText;
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', I.t('themeBtnAria', { label: labelText }));
      themeBtn.title = I.t('themeBtnTitle', { label: labelText });
    }
    if (lastOceanThemeKey !== resolved.key) {
      lastOceanThemeKey = resolved.key;
      stageEl.style.background = `linear-gradient(180deg, ${resolved.oceanTop} 0%, ${resolved.oceanBottom} 100%)`;
    }
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
    return d.toLocaleTimeString(I.getLang() === 'ko' ? 'ko-KR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Action-oriented filter button:
  // When viewing Active Only -> button displays "Show All" (action to switch to All Islands).
  // When viewing All Islands -> button displays "Active Only" (action to filter to Active Islands).
  function syncFilterUI() {
    filterBtn.classList.toggle('is-active', onlyActiveIslands);
    if (filterIconSlot) {
      filterIconSlot.innerHTML = S.renderIconSvg(onlyActiveIslands ? 'layers' : 'filter', 13);
    }
    if (filterBtnLabel) {
      filterBtnLabel.textContent = onlyActiveIslands ? I.t('filterToAllLabel') : I.t('filterToActiveLabel');
    }
    filterBtn.setAttribute(
      'aria-label',
      onlyActiveIslands ? I.t('filterToAllAria') : I.t('filterToActiveAria')
    );
    filterBtn.title = onlyActiveIslands ? I.t('filterToAllTitle') : I.t('filterToActiveTitle');
  }

  function syncNotifyUI() {
    notifyBtn.classList.toggle('is-active', notifyEnabled);
    notifyBtn.setAttribute('aria-pressed', notifyEnabled ? 'true' : 'false');
  }

  function syncDemoUI(active) {
    demoBtn.classList.toggle('is-active', active);
    demoBtn.setAttribute('aria-pressed', active ? 'true' : 'false');
  }

  function syncStageBanners(effective) {
    if (focusedIslandId && !effective.isDemo) {
      const targetIsl = (liveSnapshot.islands || []).find((i) => i.id === focusedIslandId);
      if (!targetIsl) {
        focusedIslandId = null;
        focusBanner.classList.add('hidden');
      } else {
        focusBannerText.textContent = `${I.t('focusBannerPrefix')} ${formatIslandTitle(targetIsl.name, targetIsl.isFreePlaza)}`;
        focusBanner.classList.remove('hidden');
      }
    } else if (focusedIslandId && effective.isDemo) {
      const demoIsl = effective.islands.find((i) => i.id === focusedIslandId);
      if (demoIsl) {
        focusBannerText.textContent = `${I.t('focusBannerPrefix')} ${formatIslandTitle(demoIsl.name, demoIsl.isFreePlaza)}`;
        focusBanner.classList.remove('hidden');
      } else {
        focusedIslandId = null;
        focusBanner.classList.add('hidden');
      }
    } else {
      focusBanner.classList.add('hidden');
    }

    if (activeSourceFilter !== 'all') {
      sourceBannerText.textContent = `${I.t('sourceBannerPrefix')} ${I.formatSourceLabel(activeSourceFilter)}`;
      sourceFilterBanner.classList.remove('hidden');
    } else {
      sourceFilterBanner.classList.add('hidden');
    }
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
        const vName = I.formatVillagerName(v);
        if (prev.isRunning && !v.isRunning && v.activity !== 'error') {
          const msg = `${v.islandName} · ${vName}`;
          if (notifyEnabled) {
            showToast(I.t('notifDoneToast', { msg }));
            sendDesktopNotification(I.t('notifDoneTitle'), msg);
          }
        } else if (prev.activity !== 'error' && v.activity === 'error') {
          const msg = `${v.islandName} · ${vName}`;
          if (notifyEnabled) {
            showToast(I.t('notifErrToast', { msg }));
            sendDesktopNotification(I.t('notifErrTitle'), msg);
          }
        }
      }
      prevVillagerStates.set(v.conversationId, { isRunning: v.isRunning, activity: v.activity });
    }
  }

  function getEffectiveSnapshot() {
    const now = Date.now();
    const isDemo = now < demoUntil;
    if (isDemo) {
      const demo = I.getDemoSnapshot(now, demoUntil);
      let demoIslands = demo.islands;
      let demoVillagers = demo.villagers;

      if (activeSourceFilter !== 'all') {
        demoVillagers = demoVillagers.filter((v) => v.agentSource === activeSourceFilter);
        const kept = new Set(demoVillagers.map((v) => v.islandId));
        demoIslands = demoIslands.filter((i) => kept.has(i.id));
      }
      if (focusedIslandId) {
        const focusMatch = demoIslands.find((i) => i.id === focusedIslandId);
        if (focusMatch) {
          demoIslands = [focusMatch];
          demoVillagers = demoVillagers.filter((v) => v.islandId === focusedIslandId);
        }
      } else if (hiddenIslandIds.size > 0) {
        demoIslands = demoIslands.filter((i) => !hiddenIslandIds.has(i.id));
        const visIds = new Set(demoIslands.map((i) => i.id));
        demoVillagers = demoVillagers.filter((v) => visIds.has(v.islandId));
      }
      if (onlyActiveIslands && !focusedIslandId) {
        demoIslands = demoIslands.filter((i) => i.activeCount > 0);
        const visIds = new Set(demoIslands.map((i) => i.id));
        demoVillagers = demoVillagers.filter((v) => visIds.has(v.islandId));
      }
      return { islands: demoIslands, villagers: demoVillagers, isDemo: true, hiddenDemoCount: demo.islands.length - demoIslands.length };
    }

    const baseIslands = liveSnapshot.islands || [];
    let villagers = liveSnapshot.villagers || [];

    if (activeSourceFilter !== 'all') {
      villagers = villagers.filter((v) => v.agentSource === activeSourceFilter);
    }

    let islands = baseIslands.map((isl) => {
      const onIsland = villagers.filter((v) => v.islandId === isl.id);
      const activeCount = onIsland.filter((v) => v.isRunning).length;
      const srcs = Array.from(new Set(onIsland.map((v) => v.agentSource)));
      return {
        ...isl,
        sources: srcs.length > 0 ? srcs : isl.sources || [],
        villagerCount: onIsland.length,
        activeCount,
        isCurrentWorkspace: Boolean(isl.folderKey && hostWorkspaceKeys.has(isl.folderKey)),
      };
    });

    if (activeSourceFilter !== 'all') {
      islands = islands.filter((isl) => isl.villagerCount > 0);
    }

    if (focusedIslandId) {
      const match = islands.find((i) => i.id === focusedIslandId);
      if (match) {
        islands = [match];
      } else {
        focusedIslandId = null;
      }
    } else {
      islands = islands.filter((isl) => !hiddenIslandIds.has(isl.id));
      if (onlyActiveIslands) {
        const recentCutoff = now - 15 * 60 * 1000;
        islands = islands.filter(
          (isl) => isl.activeCount > 0 || (isl.lastActivityMs && isl.lastActivityMs >= recentCutoff)
        );
      }
    }

    const visibleIslandIds = new Set(islands.map((i) => i.id));
    villagers = villagers.filter((v) => visibleIslandIds.has(v.islandId));

    return { islands, villagers, isDemo: false };
  }

  function computeIslandGeometry(residents) {
    const residentsCount = residents.length;
    if (residentsCount === 0) {
      return {
        w: 284,
        h: 164,
        isCompactEmpty: true,
        resTop: 52,
        resHeight: 68,
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
    const w = Math.max(664, cols * 150 + 96, maxStationCount >= 2 ? 700 : 664);

    const resTop = 64;
    const rowHeight = 118;
    const resHeight = houseRows * rowHeight;

    const homeSlots = [];
    const homeMap = new Map();

    for (let idx = 0; idx < residentsCount; idx += 1) {
      const r = Math.floor(idx / 4);
      const rowCount = Math.min(4, residentsCount - r * 4);
      const c = idx % 4;
      const slotSpacing = Math.min(144, (w - 96) / Math.max(1, rowCount));
      const rowStartX = w / 2 - ((rowCount - 1) * slotSpacing) / 2 - 10;
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

    const laneY = resTop + resHeight + 18;
    const plazaY = laneY + 144;
    const h = plazaY + 114 + extraStationRows * 42;

    const stations = {
      bookshelf: { x: w * 0.11, y: plazaY, key: 'bookshelf', busy: (stationCounts.bookshelf || 0) > 0 },
      board: { x: w * 0.295, y: plazaY, key: 'board', busy: (stationCounts.board || 0) > 0 },
      workbench: { x: w * 0.485, y: plazaY, key: 'workbench', busy: (stationCounts.workbench || 0) > 0 },
      generator: { x: w * 0.675, y: plazaY, key: 'generator', busy: (stationCounts.generator || 0) > 0 },
      airport: { x: w * 0.87, y: plazaY, key: 'airport', busy: (stationCounts.airport || 0) > 0 },
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

    const colWidths = new Array(gridCols).fill(284);
    const rowHeights = new Array(gridRows).fill(164);

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
              if (Array.isArray(actor.waypoints)) {
                for (const wp of actor.waypoints) {
                  wp.x += dx;
                  wp.y += dy;
                }
              }
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

    const topReserve = focusedIslandId || activeSourceFilter !== 'all' ? 38 : 20;

    if (rect.width < 560) {
      const scaleX = (rect.width - 30) / Math.max(280, bounds.totalW);
      const targetZoom = Math.max(0.54, Math.min(1.18, scaleX));
      camera.zoom = targetZoom;
      camera.x = rect.width / 2;
      const contentH = bounds.totalH * targetZoom;
      camera.y = contentH + topReserve + 20 > rect.height ? topReserve + 12 + contentH / 2 : rect.height / 2 + topReserve * 0.25;
    } else {
      const pad = 54;
      const scaleX = rect.width / (bounds.totalW + pad * 2);
      const scaleY = (rect.height - topReserve) / (bounds.totalH + pad * 2);
      camera.zoom = Math.max(0.32, Math.min(1.36, Math.min(scaleX, scaleY)));
      camera.x = rect.width / 2;
      camera.y = rect.height / 2 + topReserve * 0.35;
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

  function syncActors(villagers, animSec) {
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

      const plot = island.homeMap.get(v.conversationId);
      const baseHomeX = island.x + (plot ? plot.hx : island.w / 2);
      const baseHomeY = island.y + (plot ? plot.hy : island.resTop + 20);
      const homeX = Math.min(island.x + island.w - 46, baseHomeX + 42);
      const homeY = baseHomeY + 14;

      let targetX = homeX;
      let targetY = homeY;
      let stationWorldX = null;

      if (v.station !== 'home' && island.stations[v.station]) {
        const st = island.stations[v.station];
        stationWorldX = island.x + st.x;
        const group = slotGroups.get(`${v.islandId}:${v.station}`) || [v.conversationId];
        const slotIdx = group.indexOf(v.conversationId);
        const row = Math.floor(slotIdx / 2);
        const baseSide = v.station === 'airport' || v.station === 'generator' || v.station === 'board' ? -1 : 1;
        const sideSign = slotIdx % 2 === 0 ? baseSide : -baseSide;
        const rawX = stationWorldX + sideSign * (29 + row * 10);
        targetX = Math.max(island.x + 42, Math.min(island.x + island.w - 48, rawX));
        targetY = island.y + st.y + 22 + row * 36;
      } else if (v.activity === 'coffee' && !reducedMotion) {
        const h = hashStr(v.conversationId);
        const strollSlot = Math.floor((animSec + (h % 9)) / 4.5);
        const dx = Math.sin(strollSlot * 2.1 + h) * 6 + 1;
        const dy = Math.cos(strollSlot * 1.7 + h) * 3;
        targetX = homeX + dx;
        targetY = homeY + dy;
      }

      let actor = actorMap.get(v.conversationId);
      const vis = getVillagerVisualMeta(v);
      if (!actor) {
        actor = {
          id: v.conversationId,
          species: vis.species,
          shirt: vis.shirt,
          x: targetX,
          y: targetY,
          targetX,
          targetY,
          stationWorldX,
          waypoints: [],
          facing: stationWorldX !== null ? (stationWorldX >= targetX ? 1 : -1) : -1,
          dust: [],
          reaction: null,
          lastStation: v.station,
          lastActivity: v.activity,
          data: v,
        };
        actorMap.set(v.conversationId, actor);
      } else {
        actor.species = vis.species;
        actor.stationWorldX = stationWorldX;
        const stationChanged = actor.lastStation !== v.station;
        const activityChanged = actor.lastActivity !== v.activity;

        if (!reducedMotion && stationChanged) {
          actor.dust.push({ x: actor.x, y: actor.y + 8, life: 1 });

          const laneWorldY = island.y + island.laneY + 5;
          const rampWorldX = island.x + island.w / 2;
          const wps = [];
          if (actor.lastStation === 'home' && v.station !== 'home') {
            wps.push({ x: actor.x, y: laneWorldY });
            wps.push({ x: targetX, y: laneWorldY });
          } else if (actor.lastStation !== 'home' && v.station === 'home') {
            wps.push({ x: actor.x, y: laneWorldY });
            wps.push({ x: targetX, y: laneWorldY });
          }
          wps.push({ x: targetX, y: targetY });
          actor.waypoints = wps;
        } else if (actor.waypoints.length > 0) {
          actor.waypoints[actor.waypoints.length - 1] = { x: targetX, y: targetY };
        }

        if (!reducedMotion && (stationChanged || activityChanged)) {
          if (v.activity === 'error') {
            actor.reaction = { type: 'sweat', life: 1.0 };
          } else if (v.activity === 'coordinating') {
            actor.reaction = { type: 'music', life: 1.0 };
          } else if (actor.lastStation === 'home' && v.station !== 'home') {
            actor.reaction = { type: 'idea', life: 1.0 };
          } else if (actor.lastStation !== 'home' && v.station === 'home') {
            actor.reaction = { type: 'joy', life: 1.0 };
          }
        }

        actor.lastStation = v.station;
        actor.lastActivity = v.activity;
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
      statsText = I.formatDemoStats(remainSec);
    } else {
      const realActive = effective.villagers.filter((v) => v.isRunning).length;
      const visibleIslandsCount = effective.islands.length;
      statsText = I.formatStats(realActive, visibleIslandsCount);
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
        liveBadgeText.textContent = I.t('liveDemo');
        liveZeroTag.classList.add('hidden');
      } else if (badgeKey === 'offline') {
        liveBadge.className = 'status-badge is-offline';
        liveBadgeText.textContent = I.t('liveOffline');
        liveZeroTag.classList.add('hidden');
      } else {
        liveBadge.className = 'status-badge';
        liveBadgeText.textContent = I.t('liveStatus');
        liveZeroTag.classList.remove('hidden');
      }
    }
    syncDemoUI(effective.isDemo);
    syncStageBanners(effective);
  }

  function updateEmptyState(effective) {
    const diag = liveSnapshot.diagnostics;
    if (diag && diag.ok === false && !effective.isDemo && (liveSnapshot.islands || []).length === 0) {
      emptyStateTitle.textContent = I.t('emptyDbTitle');
      emptyStateBody.textContent = diag.message || I.t('emptyDbBody');
      showAllIslandsBtn.textContent = I.t('emptyDbRetry');
      showAllIslandsBtn.dataset.mode = 'retry';
      showAllIslandsBtn.classList.remove('hidden');
      emptyStateCard.classList.remove('hidden');
      return;
    }

    const allIslands = liveSnapshot.islands || [];
    if (allIslands.length === 0 && !effective.isDemo) {
      emptyStateTitle.textContent = I.t('emptyNoProjectsTitle');
      emptyStateBody.textContent = I.t('emptyNoProjectsBody');
      showAllIslandsBtn.classList.add('hidden');
      showAllIslandsBtn.dataset.mode = '';
      emptyStateCard.classList.remove('hidden');
      return;
    }

    if (!effective.isDemo && allIslands.length > 0 && effective.islands.length === 0) {
      if (activeSourceFilter !== 'all') {
        emptyStateTitle.textContent = I.t('emptyNoSourceTitle', { source: I.formatSourceLabel(activeSourceFilter) });
        emptyStateBody.textContent = I.t('emptyNoSourceBody');
        showAllIslandsBtn.textContent = I.t('sourceExitBtn');
        showAllIslandsBtn.dataset.mode = 'resetSource';
        showAllIslandsBtn.classList.remove('hidden');
        emptyStateCard.classList.remove('hidden');
        return;
      }

      const visibleAfterHidden = allIslands.filter((i) => !hiddenIslandIds.has(i.id));
      if (visibleAfterHidden.length === 0) {
        emptyStateTitle.textContent = I.t('emptyAllHiddenTitle', { count: allIslands.length });
        emptyStateBody.textContent = I.t('emptyAllHiddenBody');
        showAllIslandsBtn.textContent = I.t('dirRestoreAllBtn');
        showAllIslandsBtn.dataset.mode = 'restoreAll';
        showAllIslandsBtn.classList.remove('hidden');
        emptyStateCard.classList.remove('hidden');
        return;
      }

      if (onlyActiveIslands) {
        emptyStateTitle.textContent = I.t('emptyNoActiveTitle');
        emptyStateBody.textContent = I.t('emptyNoActiveBody', { count: visibleAfterHidden.length });
        showAllIslandsBtn.textContent = I.t('emptyNoActiveBtn', { count: visibleAfterHidden.length });
        showAllIslandsBtn.dataset.mode = 'showAll';
        showAllIslandsBtn.classList.remove('hidden');
        emptyStateCard.classList.remove('hidden');
        return;
      }
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
        showToast(data?.error || I.t('toastFolderErr'));
        return;
      }
      showToast(I.t('toastFolderOpened'));
    } catch {
      showToast(I.t('toastFolderErr'));
    }
  }

  function createActionPill(label, iconName, secondary, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = secondary ? 'action-pill is-secondary' : 'action-pill';
    btn.innerHTML = `${S.renderIconSvg(iconName, 13)}<span>${escapeHtml(label)}</span>`;
    btn.addEventListener('click', onClick);
    return btn;
  }

  function enterFocusMode(islandId) {
    const effective = getEffectiveSnapshot();
    const targetIsl =
      (effective.isDemo ? effective.islands : liveSnapshot.islands || []).find((i) => i.id === islandId) ||
      effective.islands.find((i) => i.id === islandId);
    if (!targetIsl) return;

    focusedIslandId = islandId;
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
    showToast(I.t('focusStartedToast', { name: formatIslandTitle(targetIsl.name, targetIsl.isFreePlaza) }));
  }

  function exitFocusMode() {
    if (!focusedIslandId) return;
    focusedIslandId = null;
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
    showToast(I.t('focusEndedToast'));
  }

  function hideIslandById(islandId, islandName, isFreePlaza = false) {
    hiddenIslandIds.add(islandId);
    saveHiddenIslands();
    if (focusedIslandId === islandId) focusedIslandId = null;
    if (selectedTarget?.type === 'island' && selectedTarget.id === islandId) {
      selectedTarget = null;
    } else if (selectedTarget?.type === 'villager') {
      const v = (liveSnapshot.villagers || []).find((x) => x.conversationId === selectedTarget.id);
      if (v && v.islandId === islandId) selectedTarget = null;
    }
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
    showToast(I.t('toastHiddenIsland', { name: formatIslandTitle(islandName, isFreePlaza) }));
  }

  function restoreIslandById(islandId, islandName, isFreePlaza = false) {
    hiddenIslandIds.delete(islandId);
    saveHiddenIslands();
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
    showToast(I.t('toastRestoredIsland', { name: formatIslandTitle(islandName, isFreePlaza) }));
  }

  function restoreAllHiddenIslands() {
    hiddenIslandIds.clear();
    saveHiddenIslands();
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
    showToast(I.t('toastRestoredAll'));
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
    if (v) {
      announce(
        I.t('announceVillager', {
          name: I.formatVillagerName(v),
          action: I.formatActionLabel(v.actionKey, v.actionLabel),
        })
      );
    }
    requestAnimationFrame(() => {
      const actor = actorMap.get(conversationId);
      const isl = v ? islandLayouts.get(v.islandId) : null;
      const rect = stageEl.getBoundingClientRect();
      if (isl && rect.width && rect.height) {
        const fitW = (rect.width - 40) / Math.max(280, isl.w);
        const fitH = (rect.height - 44) / Math.max(200, isl.h + 24);
        const islFitZoom = Math.min(fitW, fitH);
        if (islFitZoom >= 0.56) {
          camera.zoom = Math.max(0.56, Math.min(1.02, islFitZoom));
          camera.x = rect.width / 2 - (isl.x + isl.w / 2) * camera.zoom;
          camera.y = rect.height / 2 - (isl.y + isl.h / 2 - 6) * camera.zoom;
          camera.userAdjusted = true;
          return;
        }
      }
      if (actor) {
        panToWorld(actor.targetX, actor.targetY, 0.72);
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
    if (isl) {
      announce(
        I.t('announceIsland', {
          name: formatIslandTitle(isl.name, isl.isFreePlaza),
          active: isl.activeCount,
          total: isl.villagerCount,
        })
      );
    }
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
      inspectorQuestBox.classList.add('hidden');
      return;
    }

    const effective = getEffectiveSnapshot();
    const lang = I.getLang();

    if (selectedTarget.type === 'villager') {
      const v = effective.villagers.find((item) => item.conversationId === selectedTarget.id);
      if (!v) {
        selectedTarget = null;
        lastInspectorSig = '';
        inspectorCard.classList.add('hidden');
        inspectorErrorBox.classList.add('hidden');
        inspectorQuestBox.classList.add('hidden');
        return;
      }
      const island = effective.islands.find((item) => item.id === v.islandId);
      const isCurrentConv = hostConversationId && v.conversationId === hostConversationId;
      const feedItems = (v.feed || []).slice(0, 5);
      const vName = I.formatVillagerName(v);
      const vRole = I.formatRoleFull(v.roleCode);
      const vQuest = v.title && !v.conversationId.startsWith('demo-') ? v.title : I.formatQuestTitle(v);
      const vAction = I.formatActionLabel(v.actionKey, v.actionLabel);
      const vDetail = I.formatDetail(v);
      const isFocusedOnThis = focusedIslandId === v.islandId;
      const sig = JSON.stringify([
        'v',
        lang,
        v.conversationId,
        v.agentSource,
        isFocusedOnThis,
        selectedTarget.fromIslandId || '',
        vName,
        vQuest,
        vAction,
        vDetail,
        v.icon,
        v.errorFull || '',
        v.stepCount,
        v.isRunning,
        isCurrentConv,
        island?.folderPath || '',
        feedItems.map((f) => [f.actionKey, f.detail, f.time, f.icon]),
      ]);
      if (!forceRebuild && sig === lastInspectorSig) return;
      lastInspectorSig = sig;

      const vis = getVillagerVisualMeta(v);
      const srcId = v.agentSource || 'antigravity';
      withPreservedFocus(inspectorCard, () => {
        inspectorBackBtn.classList.toggle('hidden', !selectedTarget.fromIslandId);
        inspectorBadge.innerHTML = S.renderSpeciesPortraitSvg(vis.species, vis.shirt, vis.roleCode, 34);
        inspectorBadge.style.borderColor = vis.shirt;
        inspectorTitle.textContent = vName;
        inspectorSub.textContent = `${formatIslandTitle(v.islandName, v.isFreePlaza)} · ${vRole}${isCurrentConv ? ` · ${I.t('currentSessionTag')}` : ''}`;
        inspectorQuestText.textContent = vQuest || I.formatQuestTitle(v);
        inspectorQuestBox.classList.remove('hidden');
        if (inspectorFeedLabel) inspectorFeedLabel.textContent = I.t('feedLabel');

        inspectorMeta.innerHTML = `
          <span class="provider-badge is-${escapeHtml(srcId)}">${S.renderProviderIconSvg(srcId, 11)} <span>${escapeHtml(I.formatSourceLabel(srcId))}</span></span>
          <span class="meta-chip ${v.isRunning ? 'is-live' : ''}">${S.renderIconSvg(v.icon || 'sparkle', 12)} <span>${escapeHtml(vAction)}</span></span>
          <span class="meta-chip">${escapeHtml(vDetail || I.t('idleWaitingDetail'))}</span>
          <span class="meta-chip">${escapeHtml(I.t('stepsMeta', { count: v.stepCount }))}</span>
        `;

        if (v.activity === 'error' && v.errorFull) {
          inspectorErrorBox.textContent = `${I.t('detailErrorPrefix')}${v.errorFull}`;
          inspectorErrorBox.classList.remove('hidden');
        } else {
          inspectorErrorBox.textContent = '';
          inspectorErrorBox.classList.add('hidden');
        }

        inspectorActions.innerHTML = '';
        if (isEmbeddedFrame && window.sidecar?.ui?.toggleConversation && srcId === 'antigravity') {
          const openConvBtn = createActionPill(I.t('btnOpenChat'), 'chat', false, () => {
            window.sidecar.ui.toggleConversation(v.conversationId);
          });
          openConvBtn.dataset.focusKey = 'act-conv';
          inspectorActions.appendChild(openConvBtn);
        } else if (!v.conversationId.startsWith('demo-')) {
          const copyIdBtn = createActionPill(I.t('btnCopyId'), 'copy', true, async () => {
            const ok = await copyTextFallback(v.conversationId);
            showToast(ok ? I.t('toastCopiedId') : I.t('toastCopyFallback', { id: v.conversationId }));
          });
          copyIdBtn.dataset.focusKey = 'act-copy-id';
          inspectorActions.appendChild(copyIdBtn);
        }
        if (island?.folderPath && !island.id.startsWith('demo-')) {
          const openFolderBtn = createActionPill(I.t('btnOpenFolder'), 'folder', true, () => openIslandFolder(island.id));
          openFolderBtn.dataset.focusKey = 'act-folder';
          inspectorActions.appendChild(openFolderBtn);
        }
        const focusBtn = createActionPill(
          isFocusedOnThis ? I.t('btnExitFocus') : I.t('btnFocusIsland'),
          isFocusedOnThis ? 'layers' : 'focus',
          true,
          () => (isFocusedOnThis ? exitFocusMode() : enterFocusMode(v.islandId))
        );
        focusBtn.dataset.focusKey = 'act-focus-isl';
        inspectorActions.appendChild(focusBtn);

        if (!isEmbeddedFrame && !v.conversationId.startsWith('demo-') && srcId === 'antigravity') {
          const note = document.createElement('span');
          note.className = 'standalone-note';
          note.textContent = I.t('standaloneChatNote');
          inspectorActions.appendChild(note);
        }
        inspectorActions.classList.toggle('hidden', inspectorActions.childElementCount === 0);

        inspectorFeed.innerHTML = feedItems.length
          ? feedItems
              .map((item) => {
                const feedLabel = I.formatActionLabel(item.actionKey, item.label);
                const base = item.baseDetail || item.detail || '';
                const feedDet = item.count > 1 && base ? `${base} (×${item.count})` : item.detail || base;
                return `
                <li>
                  <span class="feed-left">
                    ${S.renderIconSvg(item.icon || 'sparkle', 13)}
                    <span class="feed-label">${escapeHtml(feedLabel)}</span>
                    <span class="feed-detail" title="${escapeHtml(item.fullDetail || feedDet)}">${escapeHtml(feedDet)}</span>
                  </span>
                  <span class="feed-time">${formatClock(item.time)}</span>
                </li>`;
              })
              .join('')
          : `<li><span class="feed-left"><span class="feed-detail">${escapeHtml(I.t('waitingFootprints'))}</span></span></li>`;
      });
      inspectorCard.classList.remove('hidden');
    } else if (selectedTarget.type === 'island') {
      const isl = effective.islands.find((item) => item.id === selectedTarget.id);
      if (!isl) {
        selectedTarget = null;
        lastInspectorSig = '';
        inspectorCard.classList.add('hidden');
        inspectorErrorBox.classList.add('hidden');
        inspectorQuestBox.classList.add('hidden');
        return;
      }
      const residents = effective.villagers.filter((v) => v.islandId === isl.id);
      const isFocusedOnThis = focusedIslandId === isl.id;
      const sig = JSON.stringify([
        'i',
        lang,
        isl.id,
        isl.name,
        isFocusedOnThis,
        isl.isCurrentWorkspace,
        isl.activeCount,
        isl.sources,
        isl.folderPath || '',
        showAllIslandResidents,
        residents.map((r) => [r.conversationId, r.agentSource, r.actionKey, r.icon, r.isRunning]),
      ]);
      if (!forceRebuild && sig === lastInspectorSig) return;
      lastInspectorSig = sig;

      withPreservedFocus(inspectorCard, () => {
        inspectorBackBtn.classList.add('hidden');
        inspectorBadge.innerHTML = S.renderIconSvg('island', 20);
        inspectorBadge.style.borderColor = '';
        inspectorTitle.textContent = `${formatIslandTitle(isl.name, isl.isFreePlaza)}${isl.isCurrentWorkspace ? ` · ${I.t('currentWorkspaceTag')}` : ''}`;
        inspectorSub.textContent = isl.isFreePlaza ? I.t('freePlazaName') : (isl.folderPath || I.t('defaultIslandName'));
        inspectorQuestBox.classList.add('hidden');
        if (inspectorFeedLabel) inspectorFeedLabel.textContent = I.t('islandResidentsLabel', { count: residents.length });
        inspectorErrorBox.textContent = '';
        inspectorErrorBox.classList.add('hidden');

        const srcChips = (isl.sources || [])
          .map(
            (s) =>
              `<span class="provider-badge is-${escapeHtml(s)}">${S.renderProviderIconSvg(s, 11)} <span>${escapeHtml(I.formatSourceLabel(s, true))}</span></span>`
          )
          .join('');

        inspectorMeta.innerHTML = `
          ${srcChips}
          <span class="meta-chip ${isl.activeCount > 0 ? 'is-live' : ''}">${escapeHtml(I.t('activeCountChip', { count: isl.activeCount }))}</span>
          <span class="meta-chip">${escapeHtml(I.t('residentCountChip', { count: residents.length }))}</span>
        `;

        inspectorActions.innerHTML = '';
        const focusBtn = createActionPill(
          isFocusedOnThis ? I.t('btnExitFocus') : I.t('btnFocusIsland'),
          isFocusedOnThis ? 'layers' : 'focus',
          false,
          () => (isFocusedOnThis ? exitFocusMode() : enterFocusMode(isl.id))
        );
        focusBtn.dataset.focusKey = 'act-focus-isl';
        inspectorActions.appendChild(focusBtn);

        if (!isl.id.startsWith('demo-') && isl.folderPath) {
          const folderBtn = createActionPill(I.t('btnOpenFolder'), 'folder', true, () => openIslandFolder(isl.id));
          folderBtn.dataset.focusKey = 'act-folder';
          inspectorActions.appendChild(folderBtn);
        }

        if (!isl.id.startsWith('demo-') || effective.islands.length > 1) {
          const hideBtn = createActionPill(I.t('btnHideIsland'), 'eye-off', true, () =>
            hideIslandById(isl.id, isl.name, isl.isFreePlaza)
          );
          hideBtn.dataset.focusKey = 'act-hide-isl';
          inspectorActions.appendChild(hideBtn);
        }
        inspectorActions.classList.toggle('hidden', inspectorActions.childElementCount === 0);

        inspectorFeed.innerHTML = '';
        if (residents.length === 0) {
          inspectorFeed.innerHTML = `<li><span class="feed-left"><span class="feed-detail">${escapeHtml(I.t('quietIslandMsg'))}</span></span></li>`;
        } else {
          const visibleResidents =
            !showAllIslandResidents && residents.length > 4 ? residents.slice(0, 4) : residents;
          for (const r of visibleResidents) {
            const vis = getVillagerVisualMeta(r);
            const li = document.createElement('li');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'feed-row-btn';
            btn.dataset.focusKey = `isl-res-${r.conversationId}`;
            btn.innerHTML = `
              <span class="feed-left">
                ${S.renderSpeciesPortraitSvg(vis.species, vis.shirt, vis.roleCode, 20)}
                <span class="feed-label">${escapeHtml(I.formatVillagerName(r))}</span>
                <span class="feed-detail">${escapeHtml(I.formatQuestTitle(r) || I.formatDetail(r))}</span>
              </span>
              <span class="feed-time">${escapeHtml(r.isRunning ? I.t('rowWorkingCta') : I.t('rowRestingCta'))}</span>
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
            moreBtn.innerHTML = `<span class="feed-left"><span class="feed-label">${escapeHtml(I.t('moreResidentsBtn', { count: residents.length - 4 }))}</span></span>`;
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

  function renderSourceFilterPills() {
    if (!dirSourceFilters) return;
    if (!state?.experimentalAdapters) {
      dirSourceFilters.classList.add('hidden');
      dirSourceFilters.innerHTML = '';
      if (activeSourceFilter !== 'all') {
        activeSourceFilter = 'all';
      }
      return;
    }
    dirSourceFilters.classList.remove('hidden');
    dirSourceFilters.innerHTML = '';
    for (const srcId of SOURCE_IDS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `source-filter-pill${activeSourceFilter === srcId ? ' is-active' : ''}`;
      btn.setAttribute('aria-pressed', activeSourceFilter === srcId ? 'true' : 'false');
      const iconHtml = srcId === 'all' ? '' : S.renderProviderIconSvg(srcId, 11);
      btn.innerHTML = `${iconHtml}<span>${escapeHtml(I.formatSourceLabel(srcId, true))}</span>`;
      btn.addEventListener('click', () => {
        activeSourceFilter = srcId;
        renderSourceFilterPills();
        camera.userAdjusted = false;
        recomputeAndFit();
        refreshInspector(true);
        renderDirectoryList(true);
      });
      dirSourceFilters.appendChild(btn);
    }
  }

  function renderHiddenIslandsAccordion(allKnownIslands) {
    if (!hiddenIslandsAccordion || !hiddenIslandsSummary || !hiddenIslandsList) return;
    const hiddenList = allKnownIslands.filter((i) => hiddenIslandIds.has(i.id));
    if (hiddenList.length === 0) {
      hiddenIslandsAccordion.classList.add('hidden');
      hiddenIslandsList.innerHTML = '';
      return;
    }

    hiddenIslandsSummary.textContent = I.t('dirHiddenSummary', { count: hiddenList.length });
    hiddenIslandsList.innerHTML = '';
    for (const isl of hiddenList) {
      const row = document.createElement('div');
      row.className = 'dir-row-wrap';
      const title = formatIslandTitle(isl.name, isl.isFreePlaza);
      const restoreBtn = document.createElement('button');
      restoreBtn.type = 'button';
      restoreBtn.className = 'restore-pill';
      restoreBtn.textContent = I.t('dirRestoreBtn');
      restoreBtn.addEventListener('click', () => restoreIslandById(isl.id, isl.name, isl.isFreePlaza));

      const info = document.createElement('div');
      info.className = 'dir-item';
      info.style.cursor = 'default';
      info.innerHTML = `
        <span class="dir-item-main">
          ${S.renderIconSvg('island', 14)}
          <span class="dir-item-title">${escapeHtml(title)}</span>
        </span>
        <span class="dir-item-sub">${escapeHtml(I.t('residentCountChip', { count: isl.villagerCount }))}</span>
      `;
      row.appendChild(info);
      row.appendChild(restoreBtn);
      hiddenIslandsList.appendChild(row);
    }

    if (hiddenList.length > 1) {
      const restoreAll = document.createElement('button');
      restoreAll.type = 'button';
      restoreAll.className = 'dir-item dir-more-btn';
      restoreAll.textContent = I.t('dirRestoreAllBtn');
      restoreAll.addEventListener('click', restoreAllHiddenIslands);
      hiddenIslandsList.appendChild(restoreAll);
    }
    hiddenIslandsAccordion.classList.remove('hidden');
  }

  function renderDirectoryList(forceRebuild = false) {
    if (directoryDrawer.classList.contains('hidden')) return;
    const q = dirSearchInput.value.trim().toLowerCase();
    const effective = getEffectiveSnapshot();
    const lang = I.getLang();

    const allVillagers = [...effective.villagers].sort((a, b) => {
      const scoreA = a.activity === 'error' ? 2 : a.isRunning ? 1 : 0;
      const scoreB = b.activity === 'error' ? 2 : b.isRunning ? 1 : 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return b.lastModifiedMs - a.lastModifiedMs;
    });

    const matchedVillagers = allVillagers.filter((v) => {
      if (!q) return true;
      const haystack = `${v.islandName} ${I.formatVillagerName(v)} ${I.formatSourceLabel(v.agentSource)} ${v.title} ${I.formatQuestTitle(v)} ${I.formatDetail(v)}`.toLowerCase();
      return haystack.includes(q);
    });
    const matchedActive = matchedVillagers.filter((v) => v.isRunning || v.activity === 'error');
    const matchedIdle = matchedVillagers.filter((v) => !v.isRunning && v.activity !== 'error');
    const matchedIslands = effective.islands.filter((isl) => {
      if (!q) return true;
      return `${formatIslandTitle(isl.name, isl.isFreePlaza)} ${isl.folderPath} ${(isl.sources || []).join(' ')}`.toLowerCase().includes(q);
    });

    const hiddenArr = Array.from(hiddenIslandIds);
    const sig = JSON.stringify([
      lang,
      q,
      activeSourceFilter,
      focusedIslandId || '',
      hiddenArr,
      showAllIdleDir,
      matchedActive.map((v) => [v.conversationId, v.actionKey, v.icon]),
      matchedIdle.map((v) => [v.conversationId, v.actionKey, v.icon]),
      matchedIslands.map((i) => [i.id, i.name, i.activeCount, i.villagerCount]),
    ]);
    if (!forceRebuild && sig === lastDirectorySig) return;
    lastDirectorySig = sig;

    withPreservedFocus(directoryDrawer, () => {
      directoryList.innerHTML = '';
      if (forceRebuild) directoryList.scrollTop = 0;

      const appendSectionLabel = (text) => {
        const label = document.createElement('div');
        label.className = 'dir-section-label';
        label.textContent = text;
        directoryList.appendChild(label);
      };

      const appendVillagerRow = (v) => {
        const vis = getVillagerVisualMeta(v);
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = `dir-item${v.isRunning ? ' is-running' : ''}`;
        btn.dataset.focusKey = `dir-v-${v.conversationId}`;
        const vName = I.formatVillagerName(v);
        const qText = I.formatQuestTitle(v) || I.formatDetail(v) || I.t('restLabel');
        const subText = v.isRunning || v.activity === 'error'
          ? `${v.islandName} · ${qText}`
          : `${v.islandName} · ${I.t('restLabel')}`;
        const srcId = v.agentSource || 'antigravity';
        btn.innerHTML = `
          <span class="dir-item-main">
            ${S.renderSpeciesPortraitSvg(vis.species, vis.shirt, vis.roleCode, 22)}
            <span class="provider-badge is-${escapeHtml(srcId)}">${S.renderProviderIconSvg(srcId, 10)}</span>
            <span class="dir-item-title">${escapeHtml(vName)}</span>
          </span>
          <span class="dir-item-sub">${escapeHtml(subText)}</span>
        `;
        btn.addEventListener('click', () => {
          toggleDrawer(directoryDrawer, listBtn, false, false);
          focusVillagerById(v.conversationId, null);
        });
        directoryList.appendChild(btn);
      };

      if (matchedActive.length > 0) {
        appendSectionLabel(I.t('dirWorkingHeader', { count: matchedActive.length }));
        for (const v of matchedActive) appendVillagerRow(v);
      }

      if (matchedIslands.length > 0) {
        appendSectionLabel(I.t('dirIslandsHeader', { count: matchedIslands.length }));
        for (const isl of matchedIslands) {
          const rowWrap = document.createElement('div');
          rowWrap.className = 'dir-row-wrap';

          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = `dir-item${isl.activeCount > 0 ? ' is-running' : ''}`;
          btn.dataset.focusKey = `dir-i-${isl.id}`;
          const islLabel = formatIslandTitle(isl.name, isl.isFreePlaza);
          const statSub = isl.activeCount > 0
            ? I.t('activeCountChip', { count: isl.activeCount })
            : I.t('residentCountChip', { count: isl.villagerCount });
          btn.innerHTML = `
            <span class="dir-item-main">
              ${S.renderIconSvg('island', 16)}
              <span class="dir-item-title">${escapeHtml(islLabel)}</span>
            </span>
            <span class="dir-item-sub">${escapeHtml(statSub)}</span>
          `;
          btn.addEventListener('click', () => {
            toggleDrawer(directoryDrawer, listBtn, false, false);
            focusIslandById(isl.id);
          });

          const actions = document.createElement('div');
          actions.className = 'dir-row-actions';

          const focusRowBtn = document.createElement('button');
          focusRowBtn.type = 'button';
          focusRowBtn.className = 'dir-mini-btn';
          focusRowBtn.innerHTML = S.renderIconSvg('focus', 14);
          focusRowBtn.title = I.t('dirFocusRowTitle');
          focusRowBtn.setAttribute('aria-label', I.t('dirFocusRowAria', { name: islLabel }));
          focusRowBtn.addEventListener('click', () => {
            toggleDrawer(directoryDrawer, listBtn, false, false);
            enterFocusMode(isl.id);
          });
          actions.appendChild(focusRowBtn);

          const hideRowBtn = document.createElement('button');
          hideRowBtn.type = 'button';
          hideRowBtn.className = 'dir-mini-btn';
          hideRowBtn.innerHTML = S.renderIconSvg('eye-off', 14);
          hideRowBtn.title = I.t('dirHideRowTitle');
          hideRowBtn.setAttribute('aria-label', I.t('dirHideRowAria', { name: islLabel }));
          hideRowBtn.addEventListener('click', () => hideIslandById(isl.id, isl.name, isl.isFreePlaza));
          actions.appendChild(hideRowBtn);

          rowWrap.appendChild(btn);
          rowWrap.appendChild(actions);
          directoryList.appendChild(rowWrap);
        }
      }

      if (matchedIdle.length > 0) {
        appendSectionLabel(I.t('dirRestingHeader', { count: matchedIdle.length }));
        const visibleIdle = !q && !showAllIdleDir && matchedIdle.length > 3 ? matchedIdle.slice(0, 3) : matchedIdle;
        for (const v of visibleIdle) appendVillagerRow(v);
        if (!q && !showAllIdleDir && matchedIdle.length > 3) {
          const moreBtn = document.createElement('button');
          moreBtn.type = 'button';
          moreBtn.className = 'dir-item dir-more-btn';
          moreBtn.dataset.focusKey = 'dir-idle-more';
          moreBtn.textContent = I.t('dirShowMoreIdle', { count: matchedIdle.length - 3 });
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
        emptyMsg.textContent = I.t('dirNoMatches');
        directoryList.appendChild(emptyMsg);
      }

      const knownList = effective.isDemo ? I.getDemoSnapshot(Date.now(), demoUntil).islands : liveSnapshot.islands || [];
      renderHiddenIslandsAccordion(knownList);
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

  function drawStationLabel(cx, cy, stationKey, isBusy, theme) {
    if (camera.zoom < 0.42) return;
    const label = I.formatStationLabel(stationKey);
    ctx.save();
    ctx.font = `800 10.5px ${S.CANVAS_FONT}`;
    const tw = ctx.measureText(label).width + 12;
    const ly = cy - 51;
    ctx.fillStyle = isBusy
      ? '#e4f5eb'
      : theme.key === 'night'
        ? 'rgba(54, 38, 25, 0.92)'
        : 'rgba(255, 251, 240, 0.94)';
    ctx.strokeStyle = isBusy ? '#2a7d4f' : '#8d5b32';
    ctx.lineWidth = isBusy ? 1.5 : 1.1;
    drawRoundedRect(cx - tw / 2, ly, tw, 17, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = isBusy ? '#154e2e' : theme.key === 'night' ? '#fff7e0' : '#2c1c0f';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, cx, ly + 9);
    ctx.restore();
  }

  function drawIsland(isl, animSec, theme) {
    const { x, y, w, h, isCompactEmpty, stations, homeSlots, resTop, resHeight } = isl;
    const isSelectedIsl = selectedTarget?.type === 'island' && selectedTarget.id === isl.id;
    const seed = S.hashStr(isl.id);
    const localizedIslName = isl.isFreePlaza ? I.t('freePlazaName') : isl.name;

    ctx.save();
    // 2.5D Ocean surf foam pulse following shoreline perimeter
    const pulse = reducedMotion ? 0 : Math.sin(animSec * 1.9 + x * 0.01) * 2.8;
    ctx.fillStyle = isSelectedIsl ? 'rgba(34, 197, 94, 0.28)' : theme.oceanFoam;
    S.buildOrganicPerimeterPath(ctx, x - 14 - pulse, y - 10 - pulse, w + 28 + pulse * 2, h + 30 + pulse * 2, 50, seed, 6);
    ctx.fill();

    if (isSelectedIsl) {
      ctx.strokeStyle = '#15803d';
      ctx.lineWidth = 3.2;
      S.buildOrganicPerimeterPath(ctx, x - 9, y - 7, w + 18, h + 22, 46, seed, 5);
      ctx.stroke();
    }

    // Draw pre-baked 2.5D sculpted cliff diorama terrain canvas
    const terrainCanvas = S.getIslandTerrainCanvas(isl, theme, I.t('openPlotSign'));
    ctx.drawImage(
      terrainCanvas,
      x - S.TERRAIN_PAD,
      y - S.TERRAIN_PAD,
      w + S.TERRAIN_PAD * 2,
      h + S.TERRAIN_PAD * 2
    );

    if (!isCompactEmpty) {
      // Subtle animated waterfall whitewater shimmer across the upper cliff chute
      if (!reducedMotion) {
        const fallY = resTop - 24 + resHeight + 12;
        const creekX = w - 38;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let i = 0; i < 3; i += 1) {
          const dropOffset = ((animSec * 22 + i * 6) % 17);
          ctx.fillRect(x + creekX - 4 + i * 3, y + fallY + dropOffset, 2.2, 4.5);
        }
      }

      for (const plot of homeSlots) {
        const dpText = I.formatDoorplateLabel(plot.villager);
        S.drawAgentHouse(ctx, x + plot.hx, y + plot.hy, plot.villager, plot.roofColor, animSec, theme, reducedMotion, camera.zoom, dpText);
      }

      S.drawBookshelfStation(ctx, x + stations.bookshelf.x, y + stations.bookshelf.y, theme);
      S.drawBoardStation(ctx, x + stations.board.x, y + stations.board.y, stations.board.busy, theme);
      S.drawWorkbenchStation(ctx, x + stations.workbench.x, y + stations.workbench.y, theme);
      S.drawGeneratorStation(ctx, x + stations.generator.x, y + stations.generator.y, isl.activeCount > 0, animSec, theme, reducedMotion);
      S.drawAirportStation(ctx, x + stations.airport.x, y + stations.airport.y, animSec, theme, reducedMotion);

      for (const st of Object.values(stations)) {
        drawStationLabel(x + st.x, y + st.y, st.key, st.busy, theme);
      }

      if (theme.fireflies && !reducedMotion) {
        ctx.fillStyle = 'rgba(253, 224, 71, 0.85)';
        for (let f = 0; f < 5; f += 1) {
          const fx = x + 42 + ((hashStr(isl.id) + f * 97) % Math.max(80, w - 84)) + Math.sin(animSec * 1.4 + f * 2) * 8;
          const fy = y + 48 + ((hashStr(isl.id) + f * 53) % Math.max(60, h - 90)) + Math.cos(animSec * 1.8 + f) * 6;
          const rad = 1.6 + Math.sin(animSec * 5 + f) * 0.6;
          ctx.beginPath();
          ctx.arc(fx, fy, Math.max(0.8, rad), 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    S.drawIslandSignboard(ctx, { ...isl, name: localizedIslName }, animSec, theme, reducedMotion);
    ctx.restore();
  }

  function collectActorOverlays(actor, isSelected, isHovered, isCurrentConv, pendingNameplates, pendingBubbles) {
    const v = actor.data;
    const moving = Math.hypot(actor.targetX - actor.x, actor.targetY - actor.y) > 2;
    const bob = reducedMotion
      ? 0
      : moving
        ? Math.abs(Math.sin(performance.now() / 1000 * 14)) * 4.5
        : 0;
    const px = actor.x;
    const py = actor.y - bob;

    pendingNameplates.push({
      actor,
      v,
      px,
      ny: actor.y + 16,
      nameTag: I.formatVillagerName(v),
      isCurrentConv,
      isSelected,
    });

    const showBubble =
      isSelected ||
      isHovered ||
      v.activity === 'error' ||
      (v.isRunning && v.activity !== 'thinking');

    if (showBubble) {
      const compactIconOnly = camera.zoom < 0.64 && !isSelected && !isHovered && v.activity !== 'error';
      const detailTxt = I.formatDetail(v) || I.formatActionLabel(v.actionKey, v.actionLabel);
      pendingBubbles.push({
        actor,
        v,
        px,
        py,
        icon: v.icon || 'sparkle',
        compactIconOnly,
        text: compactIconOnly ? '' : truncateEnd(detailTxt, 18),
      });
    }
  }

  function boxesOverlap(ax, ay, aw, ah, bx, by, bw, bh, padX = 0, padY = 0) {
    return (
      ax < bx + bw + padX &&
      ax + aw + padX > bx &&
      ay < by + bh + padY &&
      ay + ah + padY > by
    );
  }

  function getIslandObstacles(isl) {
    const stationBoxes = [];
    const stationLabelBoxes = [];
    const doorplateBoxes = [];
    const houseBoxes = [];
    if (!isl || isl.isCompactEmpty) return { stationBoxes, stationLabelBoxes, doorplateBoxes, houseBoxes };
    for (const st of Object.values(isl.stations || {})) {
      stationBoxes.push({ bx: isl.x + st.x - 32, by: isl.y + st.y - 54, bw: 64, bh: 68 });
      stationLabelBoxes.push({ bx: isl.x + st.x - 45, by: isl.y + st.y - 53, bw: 90, bh: 21 });
    }
    for (const plot of isl.homeSlots || []) {
      const isSub = Boolean(plot.villager?.isSubagent);
      const dpY = isl.y + plot.hy + (isSub ? 32 : 36);
      const dpText = I.formatDoorplateLabel(plot.villager);
      const estW = Math.min(88, Math.max(44, dpText.length * 7.8 + 14));
      doorplateBoxes.push({ bx: isl.x + plot.hx - estW / 2, by: dpY - 1, bw: estW, bh: 18 });
      houseBoxes.push({ bx: isl.x + plot.hx - 40, by: isl.y + plot.hy - 22, bw: 86, bh: 74 });
    }
    return { stationBoxes, stationLabelBoxes, doorplateBoxes, houseBoxes };
  }

  function segmentHitsBox(x1, y1, x2, y2, box) {
    const steps = 6;
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      const sx = x1 + (x2 - x1) * t;
      const sy = y1 + (y2 - y1) * t;
      if (sx >= box.bx - 2 && sx <= box.bx + box.bw + 2 && sy >= box.by - 2 && sy <= box.by + box.bh + 2) {
        return true;
      }
    }
    return false;
  }

  function drawResolvedNameplates(pendingNameplates) {
    if (!pendingNameplates.length) return;
    ctx.save();
    ctx.font = `800 11px ${S.CANVAS_FONT}`;

    const placed = [];
    const items = [...pendingNameplates].sort((a, b) => a.ny - b.ny || a.px - b.px);
    const obstacleCache = new Map();
    const actorBoxes = Array.from(actorMap.values()).map((a) => ({
      id: a.id,
      bx: a.x - 16,
      by: a.y - 30,
      bw: 32,
      bh: 40,
    }));

    for (const item of items) {
      const isl = islandLayouts.get(item.v.islandId);
      if (isl && !obstacleCache.has(isl.id)) {
        obstacleCache.set(isl.id, getIslandObstacles(isl));
      }
      const obs = isl ? obstacleCache.get(isl.id) : { stationBoxes: [], doorplateBoxes: [] };

      const starPad = item.isCurrentConv ? 12 : 0;
      const nw = Math.min(144, ctx.measureText(item.nameTag).width + 22 + starPad);
      const nh = 18;
      const minNx = isl ? isl.x + 8 : item.px - nw / 2 - 60;
      const maxNx = isl ? isl.x + isl.w - nw - 8 : item.px - nw / 2 + 60;
      const baseNx = Math.max(minNx, Math.min(maxNx, item.px - nw / 2));
      let nx = baseNx;
      let ny = item.ny;

      const xShifts = [0, 24, -24, 48, -48, 72, -72];
      let bestCost = Infinity;
      for (let guard = 0; guard < 4; guard += 1) {
        const candY = item.ny + guard * (nh + 2);
        for (const xs of xShifts) {
          const candX = Math.max(minNx, Math.min(maxNx, baseNx + xs));
          const collidesPlaced = placed.some((p) => boxesOverlap(candX, candY, nw, nh, p.nx, p.ny, p.nw, p.nh, 4, 2));
          const collidesDoor = obs.doorplateBoxes.some((d) => boxesOverlap(candX, candY, nw, nh, d.bx, d.by, d.bw, d.bh, 2, 2));
          const collidesStation = obs.stationBoxes.some((s) => boxesOverlap(candX, candY, nw, nh, s.bx, s.by, s.bw, s.bh, 2, 1));
          const collidesActor = actorBoxes.some(
            (a) => a.id !== item.actor.id && boxesOverlap(candX, candY, nw, nh, a.bx, a.by, a.bw, a.bh, 2, 1)
          );
          const cost =
            (collidesPlaced ? 100 : 0) +
            (collidesActor ? 28 : 0) +
            (collidesDoor ? 14 : 0) +
            (collidesStation ? 10 : 0) +
            guard * 4 +
            Math.abs(xs) * 0.05;
          if (cost < bestCost) {
            bestCost = cost;
            nx = candX;
            ny = candY;
            if (cost === 0) break;
          }
        }
        if (bestCost === 0) break;
      }

      placed.push({ nx, ny, nw, nh, item });
    }

    for (const { nx, ny, nw, nh, item } of placed) {
      ctx.fillStyle = 'rgba(28, 18, 8, 0.20)';
      drawRoundedRect(nx, ny + 2, nw, nh, 9);
      ctx.fill();

      ctx.fillStyle = item.isCurrentConv
        ? '#154e2e'
        : item.isSelected
          ? '#7c2d12'
          : 'rgba(44, 28, 15, 0.90)';
      drawRoundedRect(nx, ny, nw, nh, 9);
      ctx.fill();

      const dotCol = item.v.isSubagent ? '#4ade80' : '#fbbf24';
      ctx.fillStyle = dotCol;
      ctx.beginPath();
      ctx.arc(nx + 9, ny + nh / 2, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fffbf0';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(item.nameTag, nx + 16, ny + nh / 2 + 0.5, nw - 22);
    }
    ctx.restore();
  }

  function drawResolvedBubbles(pendingBubbles) {
    if (!pendingBubbles.length) return;

    ctx.save();
    ctx.font = `800 11px ${S.CANVAS_FONT}`;

    const rects = [];
    const items = [...pendingBubbles].sort((a, b) => a.px - b.px || a.py - b.py);
    const obstacleCache = new Map();
    const actorHeadBoxes = Array.from(actorMap.values()).map((a) => ({
      id: a.id,
      bx: a.x - 16,
      by: a.y - 34,
      bw: 32,
      bh: 44,
    }));

    for (const item of items) {
      const isl = islandLayouts.get(item.v.islandId);
      if (isl && !obstacleCache.has(isl.id)) {
        obstacleCache.set(isl.id, getIslandObstacles(isl));
      }
      const obs = isl ? obstacleCache.get(isl.id) : { stationBoxes: [], stationLabelBoxes: [], houseBoxes: [] };

      if (item.compactIconOnly) {
        const bw = 24;
        const bh = 24;
        const outerRight = item.actor.stationWorldX !== null ? item.px >= item.actor.stationWorldX : true;
        const minBx = isl ? isl.x + 8 : item.px - 60;
        const maxBx = isl ? isl.x + isl.w - bw - 8 : item.px + 60;
        const offsets = outerRight
          ? [[12, -34], [-36, -34], [12, -62], [-36, -62], [-12, -68], [20, -10], [-44, -10]]
          : [[-36, -34], [12, -34], [-36, -62], [12, -62], [-12, -68], [-44, -10], [20, -10]];

        let chosenBx = Math.max(minBx, Math.min(maxBx, item.px + offsets[0][0]));
        let chosenBy = item.py + offsets[0][1];
        let bestCompactScore = Infinity;

        for (let idx = 0; idx < offsets.length; idx += 1) {
          const candX = Math.max(minBx, Math.min(maxBx, item.px + offsets[idx][0]));
          const candY = item.py + offsets[idx][1];
          const hitsBubble = rects.some((r) => boxesOverlap(candX, candY, bw, bh, r.bx, r.by, r.bw, r.bh, 4, 4));
          const hitsLabel = obs.stationLabelBoxes.some((l) => boxesOverlap(candX, candY, bw, bh, l.bx, l.by, l.bw, l.bh, 3, 2));
          const hitsStation = obs.stationBoxes.some((s) => boxesOverlap(candX, candY, bw, bh, s.bx, s.by, s.bw, s.bh, 2, 2));
          const hitsActor = actorHeadBoxes.some(
            (a) => a.id !== item.actor.id && boxesOverlap(candX, candY, bw, bh, a.bx, a.by, a.bw, a.bh, 3, 2)
          );
          const score =
            (hitsBubble ? 40 : 0) +
            (hitsActor ? 32 : 0) +
            (hitsLabel ? 26 : 0) +
            (hitsStation ? 10 : 0) +
            idx * 0.4;
          if (score < bestCompactScore) {
            bestCompactScore = score;
            chosenBx = candX;
            chosenBy = candY;
            if (score === 0) break;
          }
        }

        rects.push({ bx: chosenBx, by: chosenBy, bw, bh, item, obs });
        continue;
      }

      const bw = Math.min(168, Math.max(72, ctx.measureText(item.text).width + 32));
      const bh = 23;
      const minBx = isl ? isl.x + 8 : item.px - bw / 2 - 80;
      const maxBx = isl ? isl.x + isl.w - bw - 8 : item.px - bw / 2 + 80;
      const baseBx = Math.max(minBx, Math.min(maxBx, item.px - bw / 2));
      const baseBy = item.py - 64;

      let chosenBx = baseBx;
      let chosenBy = baseBy;
      let bestCleanCost = Infinity;
      let bestFallbackScore = Infinity;

      const bubbleShifts = [0, -32, 32, -64, 64, -96, 96];
      for (let lift = 0; lift <= 4; lift += 1) {
        const candidateY = baseBy - lift * 26;
        for (const shift of bubbleShifts) {
          const candidateX = Math.max(minBx, Math.min(maxBx, baseBx + shift));
          const hitsBubble = rects.some((r) => boxesOverlap(candidateX, candidateY, bw, bh, r.bx, r.by, r.bw, r.bh, 6, 4));
          const hitsStationLabel = obs.stationLabelBoxes.some((l) => boxesOverlap(candidateX, candidateY, bw, bh, l.bx, l.by, l.bw, l.bh, 4, 3));
          const hitsStation = obs.stationBoxes.some((s) => boxesOverlap(candidateX, candidateY, bw, bh, s.bx, s.by, s.bw, s.bh, 3, 2));
          const hitsHouse = obs.houseBoxes.some((h) => boxesOverlap(candidateX, candidateY, bw, bh, h.bx, h.by, h.bw, h.bh, 3, 2));
          const hitsActor = actorHeadBoxes.some(
            (a) => a.id !== item.actor.id && boxesOverlap(candidateX, candidateY, bw, bh, a.bx, a.by, a.bw, a.bh, 4, 3)
          );
          const anchorX = Math.max(candidateX + 10, Math.min(candidateX + bw - 10, item.px));
          const hasTether = item.py - 35 - (candidateY + bh) > 6;
          const tetherHitsLabel =
            hasTether &&
            obs.stationLabelBoxes.some((lbl) => segmentHitsBox(anchorX, candidateY + bh, item.px, item.py - 35, lbl));
          const tetherHitsBubble =
            hasTether &&
            rects.some((r) => segmentHitsBox(anchorX, candidateY + bh, item.px, item.py - 35, r));

          if (!hitsBubble && !hitsStationLabel && !hitsStation && !hitsHouse && !hitsActor && !tetherHitsLabel && !tetherHitsBubble) {
            const cleanCost = Math.abs(shift) * 1.3 + lift * 15;
            if (cleanCost < bestCleanCost) {
              bestCleanCost = cleanCost;
              chosenBx = candidateX;
              chosenBy = candidateY;
            }
          } else {
            const score =
              (hitsBubble ? 38 : 0) +
              (hitsActor ? 32 : 0) +
              (hitsStationLabel ? 26 : 0) +
              (tetherHitsBubble ? 14 : 0) +
              (tetherHitsLabel ? 12 : 0) +
              (hitsStation ? 8 : 0) +
              (hitsHouse ? 6 : 0) +
              lift * 0.5 +
              Math.abs(shift) * 0.02;
            if (bestCleanCost === Infinity && score < bestFallbackScore) {
              bestFallbackScore = score;
              chosenBx = candidateX;
              chosenBy = candidateY;
            }
          }
        }
      }

      rects.push({ bx: chosenBx, by: chosenBy, bw, bh, item, obs });
    }

    for (const { bx, by, bw, bh, item } of rects) {
      const { px, py, v, icon, text, compactIconOnly } = item;
      const strokeCol = v.activity === 'error' ? '#dc2626' : v.isRunning ? '#1e6b40' : '#966d3b';
      const gapToHead = py - 35 - (by + bh);

      if (!compactIconOnly && gapToHead > 6) {
        const anchorX = Math.max(bx + 10, Math.min(bx + bw - 10, px));
        ctx.strokeStyle = strokeCol;
        ctx.lineWidth = 1.6;
        ctx.setLineDash(gapToHead > 22 ? [3, 3] : []);
        ctx.beginPath();
        ctx.moveTo(anchorX, by + bh);
        ctx.lineTo(px, py - 35);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      ctx.fillStyle = 'rgba(38, 24, 12, 0.16)';
      drawRoundedRect(bx, by + 2, bw, bh, bh / 2);
      ctx.fill();

      ctx.fillStyle = '#fffbf0';
      ctx.strokeStyle = strokeCol;
      ctx.lineWidth = v.isRunning ? 2 : 1.5;
      drawRoundedRect(bx, by, bw, bh, bh / 2);
      ctx.fill();
      ctx.stroke();

      if (!compactIconOnly && gapToHead <= 6) {
        const tipX = Math.max(bx + 8, Math.min(bx + bw - 8, px));
        ctx.fillStyle = '#fffbf0';
        ctx.beginPath();
        ctx.moveTo(tipX - 4, by + bh - 1);
        ctx.lineTo(tipX, by + bh + 5);
        ctx.lineTo(tipX + 4, by + bh - 1);
        ctx.closePath();
        ctx.fill();
      }

      if (compactIconOnly) {
        S.drawCanvasIcon(ctx, icon, bx + bw / 2, by + bh / 2, 13);
      } else {
        S.drawCanvasIcon(ctx, icon, bx + 13, by + bh / 2, 11);
        ctx.fillStyle = '#2c1c0f';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, bx + 23, by + bh / 2 + 0.5, bw - 30);
      }
    }

    ctx.restore();
  }

  let wasDemoActive = false;
  let lastDemoStep = -1;

  function isPaused() {
    return stageSkipped || docHidden;
  }

  function ensureLoopRunning() {
    if (!isPaused() && !rafId) {
      rafId = requestAnimationFrame(stepAndRender);
    }
  }

  function stepAndRender(nowMs) {
    rafId = 0;
    if (isPaused()) return;

    const animSec = reducedMotion ? 0 : nowMs / 1000;
    const dpr = window.devicePixelRatio || 1;
    const rect = stageEl.getBoundingClientRect();
    const targetW = Math.max(1, Math.floor(rect.width * dpr));
    const targetH = Math.max(1, Math.floor(rect.height * dpr));

    const theme = S.getLightingTheme(themeMode, new Date());
    syncThemeUI();

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

    syncActors(effective.villagers, animSec);
    updateBadgeAndStats(effective);
    updateEmptyState(effective);

    for (const actor of actorMap.values()) {
      const dest = actor.waypoints && actor.waypoints.length > 0
        ? actor.waypoints[0]
        : { x: actor.targetX, y: actor.targetY };

      const dx = dest.x - actor.x;
      const dy = dest.y - actor.y;
      const dist = Math.hypot(dx, dy);

      if (Math.abs(dx) > 1.5) {
        actor.facing = dx >= 0 ? 1 : -1;
      } else if ((!actor.waypoints || actor.waypoints.length === 0) && actor.stationWorldX !== null) {
        actor.facing = actor.stationWorldX >= actor.x ? 1 : -1;
      }

      if (reducedMotion) {
        actor.x = actor.targetX;
        actor.y = actor.targetY;
        actor.waypoints = [];
      } else if (dist < 2.2) {
        actor.x = dest.x;
        actor.y = dest.y;
        if (actor.waypoints && actor.waypoints.length > 0) {
          actor.waypoints.shift();
        }
      } else {
        const step = Math.min(dist, Math.max(3.6, dist * 0.22));
        actor.x += (dx / dist) * step;
        actor.y += (dy / dist) * step;
      }

      for (let i = actor.dust.length - 1; i >= 0; i -= 1) {
        actor.dust[i].life -= 0.035;
        if (actor.dust[i].life <= 0) actor.dust.splice(i, 1);
      }

      if (actor.reaction) {
        actor.reaction.life -= 0.01;
        if (actor.reaction.life <= 0) actor.reaction = null;
      }
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    S.drawOceanBackdrop(ctx, rect.width, rect.height, animSec, theme, reducedMotion);

    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    ctx.fillStyle = theme.key === 'night' ? 'rgba(200, 224, 248, 0.10)' : 'rgba(255, 255, 255, 0.22)';
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
      drawIsland(isl, animSec, theme);
    }

    const pendingNameplates = [];
    const pendingBubbles = [];
    const sortedActors = Array.from(actorMap.values()).sort((a, b) => a.y - b.y);
    for (const actor of sortedActors) {
      const isSel = selectedTarget?.type === 'villager' && selectedTarget.id === actor.id;
      const isHov = hoveredTarget?.type === 'villager' && hoveredTarget.id === actor.id;
      const isCur = Boolean(hostConversationId && actor.data.conversationId === hostConversationId);
      S.drawVillagerSprite(ctx, actor, animSec, isSel, isHov, isCur, reducedMotion);
      collectActorOverlays(actor, isSel, isHov, isCur, pendingNameplates, pendingBubbles);
    }
    drawResolvedNameplates(pendingNameplates);
    drawResolvedBubbles(pendingBubbles);

    if (theme.ambientWash) {
      ctx.restore();
      ctx.save();
      ctx.fillStyle = theme.ambientWash;
      ctx.fillRect(0, 0, rect.width * dpr, rect.height * dpr);
    }

    ctx.restore();
    rafId = requestAnimationFrame(stepAndRender);
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
        if (world.x >= px - 28 && world.x <= px + 28 && world.y >= py - 24 && world.y <= py + 44) {
          return { type: 'villager', id: plot.villager.conversationId };
        }
      }
      if (world.x >= isl.x && world.x <= isl.x + isl.w && world.y >= isl.y - 18 && world.y <= isl.y + isl.h) {
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
      if (v) {
        const srcShort = I.formatSourceLabel(v.agentSource || 'antigravity', true);
        label = `[${srcShort}] ${I.formatVillagerName(v)} · ${I.formatQuestTitle(v)} (${I.formatDetail(v) || I.formatActionLabel(v.actionKey, v.actionLabel)})`;
      }
    } else if (hit.type === 'island') {
      const isl = effective.islands.find((item) => item.id === hit.id);
      if (isl) {
        label = `${formatIslandTitle(isl.name, isl.isFreePlaza)} (${I.t('activeCountChip', { count: isl.activeCount })} · ${I.t('residentCountChip', { count: isl.villagerCount })})`;
      }
    }
    if (!label) {
      canvasTooltip.classList.add('hidden');
      return;
    }
    const stageRect = stageEl.getBoundingClientRect();
    const relX = Math.max(8, Math.min(stageRect.width - 250, clientX - stageRect.left + 12));
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
    if (focusedIslandId?.startsWith('demo-')) {
      focusedIslandId = null;
    }
    recomputeAndFit();
    renderDirectoryList(true);
    showToast(I.t('toastDemoEnded'));
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

  langBtn?.addEventListener('click', () => {
    switchLanguage(I.getLang() === 'en' ? 'ko' : 'en');
  });
  langOptEn?.addEventListener('click', () => switchLanguage('en'));
  langOptKo?.addEventListener('click', () => switchLanguage('ko'));

  themeBtn.addEventListener('click', () => {
    const idx = THEME_MODES.indexOf(themeMode);
    themeMode = THEME_MODES[(idx + 1) % THEME_MODES.length];
    safeSetStorage('agentCrossing.themeMode', themeMode);
    syncThemeUI();
    const resolved = S.getLightingTheme(themeMode, new Date());
    const resolvedName = I.formatThemeName(resolved.key);
    const label = themeMode === 'auto' ? I.t('themeAutoLabel', { label: resolvedName }) : resolvedName;
    showToast(I.t('themeToast', { label }));
  });

  function toggleActiveFilter() {
    onlyActiveIslands = !onlyActiveIslands;
    syncFilterUI();
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
  }

  filterBtn.addEventListener('click', toggleActiveFilter);
  exitFocusBtn?.addEventListener('click', exitFocusMode);
  exitSourceBtn?.addEventListener('click', () => {
    activeSourceFilter = 'all';
    renderSourceFilterPills();
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
  });

  showAllIslandsBtn.addEventListener('click', () => {
    const mode = showAllIslandsBtn.dataset.mode;
    if (mode === 'retry') {
      pollState();
      return;
    }
    if (mode === 'restoreAll') {
      restoreAllHiddenIslands();
      return;
    }
    if (mode === 'resetSource') {
      activeSourceFilter = 'all';
      renderSourceFilterPills();
      recomputeAndFit();
      refreshInspector(true);
      renderDirectoryList(true);
      return;
    }
    onlyActiveIslands = false;
    syncFilterUI();
    camera.userAdjusted = false;
    recomputeAndFit();
    refreshInspector(true);
    renderDirectoryList(true);
  });

  helpBtn.addEventListener('click', () => toggleDrawer(helpSheet, helpBtn));
  closeHelpBtn.addEventListener('click', () => toggleDrawer(helpSheet, helpBtn, false));

  listBtn.addEventListener('click', () => {
    showAllIdleDir = false;
    renderSourceFilterPills();
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
    focusedIslandId = null;
    refreshInspector(true);
    syncDemoUI(true);
    stopDemoBtn.classList.remove('hidden');
    toggleDrawer(helpSheet, helpBtn, false, false);
    camera.userAdjusted = false;
    recomputeAndFit();
    showToast(I.t('toastDemoStarted'));
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
      showToast(I.t('toastNotifyOn'));
    } else {
      showToast(I.t('toastNotifyOff'));
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
      renderSourceFilterPills();
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
        return;
      }
      if (focusedIslandId) {
        exitFocusMode();
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
      renderSourceFilterPills();
      toggleDrawer(directoryDrawer, listBtn, true);
      renderDirectoryList(true);
      dirSearchInput.focus();
    } else if (e.key === '[') {
      cycleVisibleIslands(-1);
    } else if (e.key === ']') {
      cycleVisibleIslands(1);
    } else if (e.key === 'z' || e.key === 'Z') {
      const effective = getEffectiveSnapshot();
      const targetId =
        selectedTarget?.type === 'island'
          ? selectedTarget.id
          : selectedTarget?.type === 'villager'
            ? effective.villagers.find((v) => v.conversationId === selectedTarget.id)?.islandId
            : null;
      if (targetId) {
        if (focusedIslandId === targetId) exitFocusMode();
        else enterFocusMode(targetId);
      } else if (focusedIslandId) {
        exitFocusMode();
      }
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
        showToast(data?.error || I.t('toastPopoutErr'));
        return;
      }
      showToast(I.t('toastPopoutOpened'));
    } catch {
      showToast(I.t('toastPopoutErr'));
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

    if ('documentPictureInPicture' in window) {
      try {
        pipWindow = await window.documentPictureInPicture.requestWindow({
          width: 460,
          height: 400,
        });

        for (const sheet of document.querySelectorAll('link[rel="stylesheet"], style')) {
          pipWindow.document.head.appendChild(sheet.cloneNode(true));
        }
        pipWindow.document.title = I.t('pageTitleMini');
        pipWindow.document.body.classList.add('is-pip');
        pipWindow.document.body.appendChild(stageWrapper);

        const restoreStage = () => {
          appShell.appendChild(stageWrapper);
          pipWindow = null;
          pipBtn.classList.remove('is-active');
          syncLanguageUI();
          recomputeAndFit();
        };

        pipWindow.addEventListener('pagehide', restoreStage, { once: true });
        pipBtn.classList.add('is-active');
        if (pipBtnLabel) pipBtnLabel.textContent = I.t('pipCloseLabel');

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
          (isl) => !hiddenIslandIds.has(isl.id) && (isl.activeCount > 0 || (isl.lastActivityMs && isl.lastActivityMs >= recentCutoff))
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
    if (pollInFlight || isPaused()) return;
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

  function handleVisibilityPause(paused) {
    if (paused) {
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (pollTimerId) {
        clearInterval(pollTimerId);
        pollTimerId = 0;
      }
    } else {
      ensureLoopRunning();
      if (!pollTimerId) {
        pollTimerId = setInterval(pollState, 1200);
      }
      pollState();
    }
  }

  stageEl.addEventListener('contentvisibilityautostatechange', (event) => {
    stageSkipped = Boolean(event.skipped);
    handleVisibilityPause(isPaused());
  });

  if (!('contentVisibility' in document.documentElement.style) && typeof IntersectionObserver !== 'undefined') {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          stageSkipped = !entry.isIntersecting;
          handleVisibilityPause(isPaused());
        }
      },
      { rootMargin: '200px' }
    );
    io.observe(stageEl);
  }

  document.addEventListener('visibilitychange', () => {
    docHidden = Boolean(document.hidden);
    handleVisibilityPause(isPaused());
  });

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
      const mode = w < 560 ? 'narrow' : w < 720 ? 'mid' : w < 880 ? 'compact-wide' : 'wide';
      if (!camera.userAdjusted || mode !== lastShellMode || Math.abs(w - lastShellWidth) > 72) {
        lastShellMode = mode;
        lastShellWidth = w;
        recomputeAndFit();
      }
    });
    ro.observe(appShell);
  }

  async function boot() {
    hydrateStaticIcons();
    const initRect = appShell.getBoundingClientRect();
    lastShellWidth = initRect.width || 0;
    lastShellMode =
      lastShellWidth < 560
        ? 'narrow'
        : lastShellWidth < 720
          ? 'mid'
          : lastShellWidth < 880
            ? 'compact-wide'
            : 'wide';
    syncNotifyUI();
    syncLanguageUI();

    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        S.clearTerrainCache();
        lastInspectorSig = '';
        lastDirectorySig = '';
      });
    }
    ensureLoopRunning();
    await pollState();
    if (!inSidecar) {
      connectWebSocket();
    }
    if (!pollTimerId && !isPaused()) {
      pollTimerId = setInterval(pollState, 1200);
    }
  }

  boot();
})();
