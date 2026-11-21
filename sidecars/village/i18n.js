(() => {
  const SPECIES_NAMES = {
    en: {
      cat: ['Mochi', 'Yuzu', 'Cheddar', 'Latte', 'Miso', 'Ruby', 'Clover', 'Cloud'],
      shiba: ['Biscuit', 'Waffles', 'Maru', 'Pumpkin', 'Cookie', 'Nori', 'Mango', 'Sunny'],
      bunny: ['Fluff', 'Sugar', 'Berry', 'Cream', 'Pebble', 'Peach', 'Pip', 'Daisy'],
      bear: ['Honey', 'Acorn', 'Button', 'Maple', 'Teddy', 'Bambi', 'Cinnamon', 'Barney'],
      fox: ['Autumn', 'Hazel', 'Ember', 'Pine', 'Saffron', 'Copper', 'Apricot', 'Rusty'],
      frog: ['Sprout', 'Mint', 'Dewdrop', 'Fern', 'Puddle', 'Clover', 'Moss', 'Pickle'],
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

  const ROLE_LABELS = {
    en: {
      mayor: { short: 'Mayor', full: 'Island Mayor' },
      curator: { short: 'Curator', full: 'Museum Curator' },
      pilot: { short: 'Pilot', full: 'Dodo Seaplane Pilot' },
      rescue: { short: 'Rescue', full: 'Rescue Specialist' },
      atelier: { short: 'Atelier', full: 'Design Artisan' },
      secretary: { short: 'Planner', full: 'Resident Services Aide' },
      helper: { short: 'Helper', full: 'DIY Island Helper' },
    },
    ko: {
      mayor: { short: '촌장', full: '섬 대표 촌장' },
      curator: { short: '학예', full: '박물관 학예사' },
      pilot: { short: '항해', full: '비행장 항해사' },
      rescue: { short: '점검', full: '구조·점검반' },
      atelier: { short: '공방', full: '디자인 공방지기' },
      secretary: { short: '안내', full: '안내소 비서' },
      helper: { short: '조수', full: '마을 DIY 조수' },
    },
  };

  const STATION_LABELS = {
    en: {
      bookshelf: 'Book Cart',
      board: 'Notice Board',
      workbench: 'DIY Bench',
      generator: 'Radio Tower',
      airport: 'Dodo Pier',
    },
    ko: {
      bookshelf: '독서 수레',
      board: '안내 게시판',
      workbench: 'DIY 작업대',
      generator: '통신 발전기',
      airport: '비행장 부두',
    },
  };

  const ACTION_LABELS = {
    en: {
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
    },
    ko: {
      reading: '코드·문서 읽는 중',
      crafting: 'DIY 코드 제작 중',
      command: '터미널 장치 가동 중',
      exploring: '바깥 세계 탐색 중',
      coordinating: '주민 에이전트 소집 중',
      planning: '마을 계획 정리 중',
      tool: '도구 작업 중',
      thinking: '아이디어 구상 중',
      error: '오류 발생·점검 필요',
      coffee: '집 마당에서 티타임',
      sleeping: '집에서 꿀잠 휴식 중',
    },
  };

  const TOPIC_DEFAULTS = {
    en: {
      sub_curator: 'Codebase Research',
      sub_pilot: 'Browser Recon',
      sub_rescue: 'Verify & Debug',
      sub_atelier: 'UI & Style Craft',
      sub_secretary: 'Plan Coordination',
      sub_helper: 'Task Delegation',
      sub_mayor: 'New Session Topic',
      new_chat: 'New Session Topic',
    },
    ko: {
      sub_curator: '코드 구조 조사',
      sub_pilot: '브라우저 탐색',
      sub_rescue: '동작 검증·점검',
      sub_atelier: '디자인·UI 손질',
      sub_secretary: '작업 계획 조율',
      sub_helper: '분담 작업 진행',
      sub_mayor: '새 대화 안건',
      new_chat: '새 대화 안건',
    },
  };

  const SOURCE_LABELS = {
    en: {
      all: { label: 'All Tools', short: 'All' },
      antigravity: { label: 'Antigravity', short: 'AGY' },
      claude: { label: 'Claude Code', short: 'Claude' },
      cursor: { label: 'Cursor', short: 'Cursor' },
      codex: { label: 'Codex CLI', short: 'Codex' },
    },
    ko: {
      all: { label: '전체 도구', short: '전체' },
      antigravity: { label: 'Antigravity', short: 'AGY' },
      claude: { label: 'Claude Code', short: 'Claude' },
      cursor: { label: 'Cursor', short: 'Cursor' },
      codex: { label: 'Codex CLI', short: 'Codex' },
    },
  };

  const STRINGS = {
    en: {
      pageTitle: 'Agent Crossing · 2.5D Multi-Agent Supervisor',
      pageTitleMini: 'Agent Crossing (Mini)',
      brandTitle: 'Agent Crossing',
      canvasAria: 'Agent Crossing 2.5D multi-agent island map. Use arrow keys to pan, bracket keys ([ / ]) to cycle islands.',
      toolbarAria: 'Village view controls',
      liveConnecting: 'Connecting...',
      liveStatus: 'Live',
      liveZeroTag: ' · 0 Tokens',
      liveZeroTitle: 'Reads local session logs strictly read-only with 0 extra LLM tokens.',
      liveDemo: 'Demo',
      liveOffline: 'Reconnecting...',
      themeAutoPrefix: 'Auto',
      themeDay: 'Day',
      themeSunset: 'Sunset',
      themeNight: 'Night',
      themeBtnAria: 'Time-of-day lighting: {label}. Click to cycle',
      themeBtnTitle: 'Lighting: {label} (Click: Auto -> Day -> Sunset -> Night)',
      themeToast: 'Lighting: {label}',
      themeAutoLabel: 'Auto ({label})',
      // Action-oriented filter button: label says what clicking WILL do!
      filterToAllLabel: 'Show All',
      filterToAllAria: 'Show All islands (currently showing active islands only · F)',
      filterToAllTitle: 'Click to show all islands (currently filtered to active · F)',
      filterToActiveLabel: 'Active Only',
      filterToActiveAria: 'Active Only filter (currently showing all islands · F)',
      filterToActiveTitle: 'Click to show only recently active islands (F)',
      listLabel: 'Directory',
      listAria: 'Open island and villager directory',
      listTitle: 'Search and jump to islands or villagers (/ or Ctrl+K)',
      helpLabel: 'Guide',
      helpAria: 'Open village guide and settings',
      helpTitle: 'Village legend, alerts, language & demo controls',
      langSwitchToKoAria: 'Switch language to Korean (한국어)',
      langSwitchToEnAria: 'Switch language to English',
      langSwitchToKoTitle: 'Switch to 한국어 (Korean)',
      langSwitchToEnTitle: 'Switch to English',
      langTargetCodeKo: 'KO',
      langTargetCodeEn: 'EN',
      pipPopoutLabel: 'Pop Out',
      pipPopoutAria: 'Open in standalone mini window',
      pipPopoutTitle: 'Pop out into a standalone window',
      pipMiniLabel: 'Mini PiP',
      pipMiniTitle: 'Float an Always-on-Top Mini Window (PiP)',
      pipCloseLabel: 'Close PiP',
      stopDemoLabel: 'End Demo',
      stopDemoTitle: 'End the 12-second interactive demo',
      retryLabel: 'Retry',
      zoomControlsAria: 'Canvas zoom and fit controls',
      zoomInAria: 'Zoom in',
      zoomInTitle: 'Zoom in (+)',
      zoomOutAria: 'Zoom out',
      zoomOutTitle: 'Zoom out (-)',
      fitLabel: 'Fit',
      fitAria: 'Fit village to view',
      fitTitle: 'Fit all islands to view (R or double-click)',
      focusBannerPrefix: 'Focused:',
      focusExitBtn: 'Show All Islands',
      focusStartedToast: 'Focused on {name}',
      focusEndedToast: 'Showing all islands',
      sourceBannerPrefix: 'Tool:',
      sourceExitBtn: 'All Tools',
      helpTitleHeading: 'Village Guide & Settings',
      closeGuideAria: 'Close guide',
      languageLabel: 'Language',
      notifyLabel: 'Done & Error Alerts',
      demoLabel: '12s Demo',
      legendRolesTitle: 'Roles · Tools · Island State',
      legendRoleMayor: 'Mayor (Main Session)',
      legendRoleSub: 'Curator · Pilot · Rescue (Subagent)',
      legendHouseState: 'Lit Warm Window = Resting · Blue = Active',
      legendTools: 'Antigravity Multi-Agent Supervisor (0 Tokens)',
      legendWorkTitle: 'Code · Planning Plaza',
      legendWorkRead: 'Reading Code (Book Cart)',
      legendWorkBoard: 'Planning & Teamwork (Notice Board)',
      legendWorkCraft: 'Crafting Code (DIY Bench)',
      legendExecTitle: 'Run · Explore · Alert',
      legendExecCmd: 'Terminal Commands (Radio Tower)',
      legendExecWeb: 'Web & Browser Recon (Dodo Pier)',
      legendExecErr: 'Error Alert (Check Needed)',
      shortcutNote: 'Shortcuts: / or Ctrl+K (Directory) · [/] (Next Island) · Z (Focus Selected Island) · F (Active/All) · R (Fit) · +/- (Zoom) · Esc (Close/Exit Focus)',
      dirHeading: 'Islands & Villagers',
      closeDirAria: 'Close directory',
      searchPlaceholder: 'Search villager, island, tool, or quest... (Up/Down)',
      searchAria: 'Search villager, island, tool, or quest',
      dirWorkingHeader: 'Working Residents ({count})',
      dirIslandsHeader: 'Project Islands ({count})',
      dirRestingHeader: 'Resting Residents ({count})',
      dirShowMoreIdle: 'Show {count} more resting villagers',
      dirNoMatches: 'No islands or villagers match your filter.',
      dirHiddenSummary: 'Hidden Islands ({count})',
      dirRestoreBtn: 'Restore',
      dirRestoreAllBtn: 'Restore All Islands',
      dirFocusRowAria: 'Focus only {name}',
      dirHideRowAria: 'Hide {name} from village map',
      dirHideRowTitle: 'Hide island',
      dirFocusRowTitle: 'Focus island',
      inspectorCardAria: 'Villager passport and island details',
      inspectorBackBtn: 'Island',
      closeInspectorAria: 'Close passport card (Esc)',
      questLabel: 'Assigned Quest',
      feedLabel: 'Recent Footprints',
      islandResidentsLabel: 'Island Residents ({count})',
      passportFooter: 'Nook Passport · Read-Only · 0 Extra Tokens',
      defaultIslandName: 'Project Island',
      freePlazaName: 'Free Plaza',
      openPlotSign: 'Open Plot',
      currentSessionTag: 'Current Chat',
      currentWorkspaceTag: 'Current Workspace',
      idleWaitingDetail: 'Resting at home',
      stepsMeta: '{count} steps',
      activeCountChip: '{count} working',
      residentCountChip: '{count} residents',
      detailErrorPrefix: 'Error Details: ',
      btnOpenChat: 'Open Chat',
      btnCopyId: 'Copy Session ID',
      btnOpenFolder: 'Open Folder',
      btnFocusIsland: 'Focus Island',
      btnExitFocus: 'Show All Islands',
      btnHideIsland: 'Hide Island',
      standaloneChatNote: 'Open Chat works directly inside the Antigravity sidecar pane.',
      waitingFootprints: 'Waiting for new activity footprints...',
      quietIslandMsg: 'This island is quiet right now. Start a session in this repo and a villager will move in.',
      rowWorkingCta: 'Working ›',
      rowRestingCta: 'Resting ›',
      moreResidentsBtn: 'Show {count} more residents',
      restLabel: 'Resting',
      emptyDbTitle: 'Could not read local session store',
      emptyDbBody: 'Failed to inspect local agent history. Verify read permissions or restart your IDE/agent.',
      emptyDbRetry: 'Retry Scan',
      emptyNoProjectsTitle: 'No agent islands found yet',
      emptyNoProjectsBody: 'Start a session in Antigravity and islands appear here automatically with 0 tokens.',
      emptyAllHiddenTitle: 'All {count} islands are hidden',
      emptyAllHiddenBody: 'You excluded every discovered project island from view. Restore them below or inspect Hidden Islands in Directory.',
      emptyNoActiveTitle: 'No islands are active right now',
      emptyNoActiveBody: 'No projects have activity in the last 15 minutes. Switch to Show All to visit resting villagers across {count} islands.',
      emptyNoActiveBtn: 'Show All Islands ({count})',
      emptyNoSourceTitle: 'No {source} sessions found',
      emptyNoSourceBody: 'No visible villagers matched this tool filter. Reset to All Tools to see your entire archipelago.',
      toastHiddenIsland: 'Hid {name}. Restore anytime from Directory.',
      toastRestoredIsland: 'Restored {name} to the village.',
      toastRestoredAll: 'Restored all hidden islands.',
      toastCopiedId: 'Copied session ID.',
      toastCopyFallback: 'Session ID: {id}',
      toastFolderOpened: 'Opened project folder.',
      toastFolderErr: 'Could not open folder.',
      toastPopoutOpened: 'Opened standalone window.',
      toastPopoutErr: 'Failed to open standalone window.',
      toastDemoStarted: 'Running 12s multi-agent diorama demo across 4 agent tools.',
      toastDemoEnded: 'Ended demo and returned to live workspaces.',
      toastNotifyOn: 'Enabled completion & error alerts.',
      toastNotifyOff: 'Muted desktop & toast alerts.',
      notifDoneToast: 'Done: {msg}',
      notifDoneTitle: 'Agent Crossing · Task Finished',
      notifErrToast: 'Alert: {msg}',
      notifErrTitle: 'Agent Crossing · Error Detected',
      announceVillager: 'Selected {name}. {action}',
      announceIsland: 'Selected {name}. {active} active of {total} villagers.',
    },
    ko: {
      pageTitle: '에이전트의 숲 · Agent Crossing',
      pageTitleMini: '에이전트의 숲 (미니)',
      brandTitle: '에이전트의 숲',
      canvasAria: '에이전트의 숲 2.5D 멀티 에이전트 활동 지도. 화살표로 화면 이동, 대괄호([/]) 키로 섬 순회 가능',
      toolbarAria: '마을 보기 제어',
      liveConnecting: '연결 중...',
      liveStatus: '실시간',
      liveZeroTag: ' · 0토큰',
      liveZeroTitle: '별도 LLM 호출 없이 로컬 로그만 읽기 전용으로 읽어 추가 토큰이 0개 소모됩니다.',
      liveDemo: '시연 중',
      liveOffline: '재연결 중',
      themeAutoPrefix: '자동',
      themeDay: '낮',
      themeSunset: '노을',
      themeNight: '밤',
      themeBtnAria: '시간대 조명: {label}. 클릭해 전환',
      themeBtnTitle: '시간대 조명: {label} (클릭: 자동 → 낮 → 노을 → 밤)',
      themeToast: '조명 모드: {label}',
      themeAutoLabel: '현실 시간 자동 ({label})',
      // Action-oriented filter button: shows the action clicking will take!
      filterToAllLabel: '전체 섬 보기',
      filterToAllAria: '전체 섬 보기 (현재 활발한 섬만 보는 중 · F)',
      filterToAllTitle: '클릭하여 전체 섬 보기 (현재 활발한 섬만 보는 중 · F)',
      filterToActiveLabel: '활발한 섬만',
      filterToActiveAria: '활발한 섬만 보기 (현재 전체 섬 보는 중 · F)',
      filterToActiveTitle: '클릭하여 최근 15분 내 활발한 섬만 보기 (F)',
      listLabel: '명부',
      listAria: '섬과 주민 명부 열기',
      listTitle: '섬과 주민 빠른 검색·이동 목록 (/ 또는 Ctrl+K)',
      helpLabel: '안내',
      helpAria: '마을 안내 및 설정 열기',
      helpTitle: '마을 범례, 언어, 알림, 시연 설정',
      langSwitchToKoAria: '언어를 한국어로 전환',
      langSwitchToEnAria: '영어로 전환 (Switch to English)',
      langSwitchToKoTitle: '한국어로 전환',
      langSwitchToEnTitle: '영어로 전환 (English)',
      langTargetCodeKo: '한',
      langTargetCodeEn: 'EN',
      pipPopoutLabel: '팝아웃',
      pipPopoutAria: '독립 미니창으로 꺼내기',
      pipPopoutTitle: '독립 미니창으로 꺼내기',
      pipMiniLabel: '미니창 고정',
      pipMiniTitle: '다른 창 위에 항상 떠 있는 미니창(PiP) 전환',
      pipCloseLabel: '닫기',
      stopDemoLabel: '시연 종료',
      stopDemoTitle: '12초 시연 즉시 종료',
      retryLabel: '재시도',
      zoomControlsAria: '화면 확대·축소 및 맞춤',
      zoomInAria: '화면 확대',
      zoomInTitle: '확대 (+)',
      zoomOutAria: '화면 축소',
      zoomOutTitle: '축소 (-)',
      fitLabel: '맞춤',
      fitAria: '화면 맞춤 정렬',
      fitTitle: '화면 맞춤 정렬 (R 또는 더블클릭)',
      focusBannerPrefix: '집중 보기:',
      focusExitBtn: '전체 섬 보기',
      focusStartedToast: '{name}만 집중해서 봅니다.',
      focusEndedToast: '전체 섬 보기로 돌아왔습니다.',
      sourceBannerPrefix: '도구 필터:',
      sourceExitBtn: '전체 도구',
      helpTitleHeading: '마을 안내 · 설정',
      closeGuideAria: '안내 닫기',
      languageLabel: '언어 / Language',
      notifyLabel: '완료·오류 알림',
      demoLabel: '12초 시연',
      legendRolesTitle: '주민 직책 · AI 도구 · 섬 상태',
      legendRoleMayor: '촌장 (메인 에이전트)',
      legendRoleSub: '학예·항해·점검 (서브에이전트)',
      legendHouseState: '노랑 창문 휴식 · 파랑 외출',
      legendTools: 'Antigravity 멀티 에이전트 감독 (토큰 소모 0)',
      legendWorkTitle: '코드 · 기획 광장',
      legendWorkRead: '문서 읽기 (독서 수레)',
      legendWorkBoard: '구상·협업 (안내 게시판)',
      legendWorkCraft: 'DIY 제작 (그루터기 작업대)',
      legendExecTitle: '실행 · 탐색 · 오류',
      legendExecCmd: '터미널 실행 (통신 발전기)',
      legendExecWeb: '외부 탐색 (비행장 부두)',
      legendExecErr: '오류 발생 (점검 필요)',
      shortcutNote: '단축키: / 또는 Ctrl+K(주민 명부) · [/] (섬 순회) · Z(선택 섬 집중) · F(전체↔활발 필터) · R/더블클릭(맞춤) · +/−(확대·축소) · Esc(닫기)',
      dirHeading: '섬 · 주민 명부',
      closeDirAria: '목록 닫기',
      searchPlaceholder: '주민 이름, 프로젝트 섬, AI 도구 또는 안건 검색... (↑/↓)',
      searchAria: '주민 이름, 섬, 도구 또는 안건 검색',
      dirWorkingHeader: '활동 중인 주민 ({count}명)',
      dirIslandsHeader: '프로젝트 섬 ({count}곳)',
      dirRestingHeader: '휴식 중인 주민 ({count}명)',
      dirShowMoreIdle: '휴식 중인 주민 {count}명 더 보기',
      dirNoMatches: '조건과 일치하는 섬이나 주민이 없습니다.',
      dirHiddenSummary: '숨긴 섬 관리 ({count}곳)',
      dirRestoreBtn: '복원',
      dirRestoreAllBtn: '숨긴 섬 모두 복원',
      dirFocusRowAria: '{name}만 집중 보기',
      dirHideRowAria: '{name} 섬 숨기기',
      dirHideRowTitle: '섬 숨기기',
      dirFocusRowTitle: '이 섬만 집중 보기',
      inspectorCardAria: '주민 여권 및 섬 상세',
      inspectorBackBtn: '섬으로',
      closeInspectorAria: '여권 카드 닫기 (Esc)',
      questLabel: '담당 안건',
      feedLabel: '최근 발자국',
      islandResidentsLabel: '섬 주민 ({count}명)',
      passportFooter: 'Nook Passport · 읽기 전용 · 추가 토큰 0',
      defaultIslandName: '프로젝트 섬',
      freePlazaName: '자유 광장',
      openPlotSign: '빈 집터',
      currentSessionTag: '현재 대화',
      currentWorkspaceTag: '현재 작업 중',
      idleWaitingDetail: '집에서 쉬는 중',
      stepsMeta: '작업 {count}회',
      activeCountChip: '활동 중 {count}명',
      residentCountChip: '주민 {count}명',
      detailErrorPrefix: '상세 오류: ',
      btnOpenChat: '이 대화 열기',
      btnCopyId: '세션 ID 복사',
      btnOpenFolder: '폴더 열기',
      btnFocusIsland: '이 섬만 집중 보기',
      btnExitFocus: '집중 보기 해제',
      btnHideIsland: '이 섬 숨기기',
      standaloneChatNote: '대화 열기는 Antigravity 사이드카 패널에서 지원됩니다.',
      waitingFootprints: '최근 작업 기록을 대기하고 있습니다.',
      quietIslandMsg: '현재 이 섬은 고요합니다. 이 폴더에서 에이전트 작업을 시작하면 주민이 찾아옵니다.',
      rowWorkingCta: '작업 중 ›',
      rowRestingCta: '집 휴식 ›',
      moreResidentsBtn: '나머지 주민 {count}명 더 보기',
      restLabel: '휴식',
      emptyDbTitle: '로컬 세션 로그를 읽지 못했어요',
      emptyDbBody: '로컬 대화 기록 접근에 실패했습니다. 읽기 권한이나 IDE 상태를 확인해 주세요.',
      emptyDbRetry: '다시 불러오기',
      emptyNoProjectsTitle: '아직 발견된 프로젝트가 없어요',
      emptyNoProjectsBody: 'Antigravity에서 대화를 열면 자동으로 섬과 주민이 나타납니다.',
      emptyAllHiddenTitle: '모든 섬({count}곳)이 숨겨져 있어요',
      emptyAllHiddenBody: '모든 프로젝트 섬을 제외했습니다. 아래 버튼으로 다시 복원하거나 명부에서 개별 복원하세요.',
      emptyNoActiveTitle: '현재 활동 중인 섬이 없어요',
      emptyNoActiveBody: '최근 15분 내 작업한 프로젝트가 없습니다. 전체 {count}개 섬의 휴식 중인 주민을 볼 수 있습니다.',
      emptyNoActiveBtn: '전체 섬 보기 ({count}개)',
      emptyNoSourceTitle: '{source} 세션이 현재 화면에 없어요',
      emptyNoSourceBody: '선택한 AI 도구 필터와 일치하는 섬이 없습니다. 전체 도구를 눌러 다시 확인하세요.',
      toastHiddenIsland: '{name} 섬을 숨겼습니다. 명부에서 언제든 복원할 수 있습니다.',
      toastRestoredIsland: '{name} 섬을 마을로 복원했습니다.',
      toastRestoredAll: '숨긴 섬을 모두 복원했습니다.',
      toastCopiedId: '세션 ID를 복사했습니다.',
      toastCopyFallback: '세션 ID: {id}',
      toastFolderOpened: '프로젝트 폴더를 열었습니다.',
      toastFolderErr: '폴더를 열 수 없습니다.',
      toastPopoutOpened: '독립 미니창을 열었습니다.',
      toastPopoutErr: '미니창 실행에 실패했습니다.',
      toastDemoStarted: '4개 AI 도구 주민들이 함께 움직이는 12초 시연을 시작합니다.',
      toastDemoEnded: '시연을 종료하고 실제 마을로 돌아왔습니다.',
      toastNotifyOn: '작업 완료·오류 알림을 켰습니다.',
      toastNotifyOff: '작업 알림을 껐습니다.',
      notifDoneToast: '작업 완료: {msg}',
      notifDoneTitle: '에이전트의 숲 · 작업 완료',
      notifErrToast: '오류 감지: {msg}',
      notifErrTitle: '에이전트의 숲 · 오류 발생',
      announceVillager: '{name} 주민 선택됨. {action}',
      announceIsland: '{name} 선택됨. 활동 {active}명, 전체 {total}명',
    },
  };

  function detectInitialLang() {
    try {
      const urlLang = new URLSearchParams(window.location.search).get('lang');
      if (urlLang === 'en' || urlLang === 'ko') return urlLang;
    } catch {
      // ignore URL parsing issue
    }
    try {
      const saved = window.localStorage.getItem('agentCrossing.lang');
      if (saved === 'en' || saved === 'ko') return saved;
    } catch {
      // ignore blocked storage
    }
    return 'en';
  }

  let currentLang = detectInitialLang();

  function setLang(lang) {
    currentLang = lang === 'ko' ? 'ko' : 'en';
    try {
      window.localStorage.setItem('agentCrossing.lang', currentLang);
    } catch {
      // ignore storage errors in restricted webviews
    }
    document.documentElement.lang = currentLang;
    return currentLang;
  }

  function getLang() {
    return currentLang;
  }

  function t(key, vars = null) {
    const dict = STRINGS[currentLang] || STRINGS.en;
    let str = dict[key] ?? STRINGS.en[key] ?? key;
    if (vars && typeof vars === 'object') {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  }

  function formatRelativeAge(ageMs, lang = currentLang) {
    const safeAge = Math.max(0, Number(ageMs) || 0);
    if (lang === 'ko') {
      if (safeAge < 60_000) return '방금 전 활동';
      if (safeAge < 3_600_000) return `${Math.floor(safeAge / 60_000)}분 전 활동`;
      if (safeAge < 86_400_000) return `${Math.floor(safeAge / 3_600_000)}시간 전 활동`;
      return `${Math.floor(safeAge / 86_400_000)}일 전 활동`;
    }
    if (safeAge < 60_000) return 'Active just now';
    if (safeAge < 3_600_000) return `${Math.floor(safeAge / 60_000)}m ago`;
    if (safeAge < 86_400_000) return `${Math.floor(safeAge / 3_600_000)}h ago`;
    return `${Math.floor(safeAge / 86_400_000)}d ago`;
  }

  function formatStats(active, totalIslands) {
    return currentLang === 'ko'
      ? `활동 ${active}명 · ${totalIslands}섬`
      : `${active} active · ${totalIslands} ${totalIslands === 1 ? 'island' : 'islands'}`;
  }

  function formatDemoStats(sec) {
    return currentLang === 'ko' ? `시연 · ${sec}초` : `Demo · ${sec}s`;
  }

  function formatIslandTitle(name, isFreePlaza = false) {
    if (isFreePlaza) return t('freePlazaName');
    const clean = String(name || '').trim();
    if (!clean) return t('defaultIslandName');
    if (currentLang === 'ko') {
      return /(섬|광장)$/.test(clean) ? clean : `${clean} 섬`;
    }
    return /(Island|Plaza|Harbor|Studio)$/i.test(clean) ? clean : `${clean} Island`;
  }

  function formatVillagerName(v) {
    if (!v) return '';
    if (v.conversationId?.startsWith('demo-')) {
      return currentLang === 'ko' ? (v.displayNameKo || v.displayName) : (v.displayNameEn || v.displayName);
    }
    const roleMap = ROLE_LABELS[currentLang] || ROLE_LABELS.en;
    const roleShort = (roleMap[v.roleCode] || roleMap.helper).short;
    const sp = SPECIES_NAMES[currentLang]?.[v.species] || SPECIES_NAMES.en.shiba;
    const idx = Number.isInteger(v.nameIndex) ? v.nameIndex % sp.length : 0;
    const baseName = sp[idx] || (currentLang === 'ko' ? v.villagerNameKo : v.villagerNameEn) || v.villagerName;
    return `${roleShort} ${baseName}`;
  }

  function formatRoleFull(roleCode) {
    const roleMap = ROLE_LABELS[currentLang] || ROLE_LABELS.en;
    return (roleMap[roleCode] || roleMap.helper).full;
  }

  function formatStationLabel(stationKey) {
    const map = STATION_LABELS[currentLang] || STATION_LABELS.en;
    return map[stationKey] || stationKey;
  }

  function formatActionLabel(actionKey, fallback = '') {
    const map = ACTION_LABELS[currentLang] || ACTION_LABELS.en;
    return map[actionKey] || fallback || '';
  }

  function formatQuestTitle(v) {
    if (!v) return '';
    if (v.conversationId?.startsWith('demo-')) {
      return currentLang === 'ko' ? (v.questTitleKo || v.questTitle) : (v.questTitleEn || v.questTitle);
    }
    if (v.topicKey && TOPIC_DEFAULTS[currentLang]?.[v.topicKey]) {
      return TOPIC_DEFAULTS[currentLang][v.topicKey];
    }
    return v.questTitle || v.title || '';
  }

  function formatDoorplateLabel(v) {
    if (!v) return '';
    if (v.conversationId?.startsWith('demo-')) {
      return currentLang === 'ko' ? (v.doorplateKo || v.doorplateLabel) : (v.doorplateEn || v.doorplateLabel);
    }
    if (v.topicKey && TOPIC_DEFAULTS[currentLang]?.[v.topicKey]) {
      return TOPIC_DEFAULTS[currentLang][v.topicKey];
    }
    return v.doorplateLabel || '';
  }

  function formatDetail(v) {
    if (!v) return '';
    if (v.conversationId?.startsWith('demo-')) {
      return currentLang === 'ko' ? (v.detailKo || v.detail) : (v.detailEn || v.detail);
    }
    if ((v.activity === 'coffee' || v.activity === 'sleeping') && Number.isFinite(v.ageMs) && v.ageMs > 0) {
      return formatRelativeAge(v.ageMs);
    }
    return v.detail || '';
  }

  function formatSourceLabel(sourceId, short = false) {
    const table = SOURCE_LABELS[currentLang] || SOURCE_LABELS.en;
    const entry = table[sourceId] || SOURCE_LABELS.en.antigravity;
    return short ? entry.short : entry.label;
  }

  function formatThemeName(key) {
    if (key === 'day') return t('themeDay');
    if (key === 'sunset') return t('themeSunset');
    if (key === 'night') return t('themeNight');
    return t('themeDay');
  }

  function formatThemeBtnLabel(mode, resolvedKey) {
    const resolvedName = formatThemeName(resolvedKey);
    return mode === 'auto' ? `${t('themeAutoPrefix')} · ${resolvedName}` : resolvedName;
  }

  function getDemoSnapshot(now, demoUntil) {
    const stepOffset = Math.floor(Math.max(0, now - (demoUntil - 12000)) / 2400);
    const scripts = [
      { activity: 'crafting', actionKey: 'crafting', station: 'workbench', icon: 'hammer', detailEn: 'sprites.js', detailKo: 'sprites.js' },
      { activity: 'reading', actionKey: 'reading', station: 'bookshelf', icon: 'book', detailEn: 'adapters.mjs', detailKo: 'adapters.mjs' },
      { activity: 'command', actionKey: 'command', station: 'generator', icon: 'gear', detailEn: 'npm test', detailKo: 'npm test' },
      { activity: 'exploring', actionKey: 'exploring', station: 'airport', icon: 'plane', detailEn: 'Visual audit', detailKo: '브라우저 검증' },
      { activity: 'coordinating', actionKey: 'coordinating', station: 'board', icon: 'megaphone', detailEn: '4 agent tools', detailKo: '에이전트 협업' },
      { activity: 'coffee', actionKey: 'coffee', station: 'home', icon: 'coffee', detailEn: 'Tea break', detailKo: '방금 전 활동' },
    ];

    const roster = [
      {
        id: 'demo-mayor',
        islandId: 'demo-harbor',
        agentSource: 'antigravity',
        species: 'shiba',
        displayNameEn: 'Mayor Biscuit',
        displayNameKo: '촌장 보리',
        roleCode: 'mayor',
        questTitleEn: '2.5D Village Diorama & Multi-Agent Engine',
        questTitleKo: '2.5D 섬 디오라마 및 범용 엔진 총괄',
        doorplateEn: '2.5D Diorama',
        doorplateKo: '마을 리디자인',
        isSubagent: false,
      },
      {
        id: 'demo-curator',
        islandId: 'demo-harbor',
        agentSource: 'claude',
        species: 'cat',
        displayNameEn: 'Curator Mochi',
        displayNameKo: '학예 모카',
        roleCode: 'curator',
        questTitleEn: 'Inspect Claude & Cursor JSONL Schemas',
        questTitleKo: 'Claude · Cursor 세션 구조 조사',
        doorplateEn: 'Session Docs',
        doorplateKo: '세션 구조조사',
        isSubagent: true,
      },
      {
        id: 'demo-atelier',
        islandId: 'demo-harbor',
        agentSource: 'cursor',
        species: 'fox',
        displayNameEn: 'Atelier Autumn',
        displayNameKo: '공방 단풍',
        roleCode: 'atelier',
        questTitleEn: 'Sculpt 2.5D Cliffs & Cottages in Canvas',
        questTitleKo: '2.5D 절벽·코티지 하우스 스프라이트',
        doorplateEn: 'Cliff Art',
        doorplateKo: '2.5D 아트워크',
        isSubagent: true,
      },
      {
        id: 'demo-rescue',
        islandId: 'demo-harbor',
        agentSource: 'codex',
        species: 'bear',
        displayNameEn: 'Rescue Honey',
        displayNameKo: '점검 꿀비',
        roleCode: 'rescue',
        questTitleEn: 'Run Build & Adapter Integration Suite',
        questTitleKo: '빌드·어댑터 통합 검증 실행',
        doorplateEn: 'Test Suite',
        doorplateKo: '통합 검증반',
        isSubagent: true,
      },
      {
        id: 'demo-pilot',
        islandId: 'demo-maple',
        agentSource: 'claude',
        species: 'bunny',
        displayNameEn: 'Mayor Sugar',
        displayNameKo: '촌장 솜이',
        roleCode: 'mayor',
        questTitleEn: 'Live Browser Screenshot Verification',
        questTitleKo: '해상도별 라이브 브라우저 UI 검증',
        doorplateEn: 'Web Audit',
        doorplateKo: '화면 탐색',
        isSubagent: false,
      },
      {
        id: 'demo-helper',
        islandId: 'demo-maple',
        agentSource: 'cursor',
        species: 'frog',
        displayNameEn: 'Helper Sprout',
        displayNameKo: '조수 연두',
        roleCode: 'helper',
        questTitleEn: 'Organize Nook Passport & Island Filters',
        questTitleKo: '주민 여권 및 섬 필터 정리',
        doorplateEn: 'Passport UI',
        doorplateKo: '여권 카드정리',
        isSubagent: true,
      },
    ];

    const islandNames = {
      'demo-harbor': currentLang === 'ko' ? '시범 너굴섬' : 'Nook Harbor',
      'demo-maple': currentLang === 'ko' ? '단풍 공방' : 'Maple Studio',
    };

    const villagers = roster.map((entry, idx) => {
      const vStep = Math.floor(Math.max(0, now - (demoUntil - 12000) + idx * 350) / 3000);
      const sc = scripts[(idx + vStep) % scripts.length];
      const actionLabel = formatActionLabel(sc.actionKey);
      const detail = currentLang === 'ko' ? sc.detailKo : sc.detailEn;
      return {
        conversationId: entry.id,
        agentSource: entry.agentSource,
        islandId: entry.islandId,
        islandName: islandNames[entry.islandId],
        title: currentLang === 'ko' ? entry.questTitleKo : entry.questTitleEn,
        questTitle: currentLang === 'ko' ? entry.questTitleKo : entry.questTitleEn,
        questTitleEn: entry.questTitleEn,
        questTitleKo: entry.questTitleKo,
        doorplateLabel: currentLang === 'ko' ? entry.doorplateKo : entry.doorplateEn,
        doorplateEn: entry.doorplateEn,
        doorplateKo: entry.doorplateKo,
        displayName: currentLang === 'ko' ? entry.displayNameKo : entry.displayNameEn,
        displayNameEn: entry.displayNameEn,
        displayNameKo: entry.displayNameKo,
        species: entry.species,
        roleCode: entry.roleCode,
        isSubagent: entry.isSubagent,
        stepCount: 14 + idx * 3 + vStep,
        isRunning: sc.activity !== 'coffee',
        lastModifiedMs: now,
        activity: sc.activity,
        actionKey: sc.actionKey,
        station: sc.station,
        icon: sc.icon,
        actionLabel,
        detail,
        detailEn: sc.detailEn,
        detailKo: sc.detailKo,
        feed: [
          {
            time: new Date(now).toISOString(),
            icon: sc.icon,
            actionKey: sc.actionKey,
            label: actionLabel,
            baseDetail: detail,
            detail,
          },
        ],
      };
    });

    const harborResidents = villagers.filter((v) => v.islandId === 'demo-harbor');
    const mapleResidents = villagers.filter((v) => v.islandId === 'demo-maple');

    const islands = [
      {
        id: 'demo-harbor',
        name: islandNames['demo-harbor'],
        fruit: 'apple',
        folderPath: '~/workspaces/nook-harbor',
        sources: ['antigravity', 'claude', 'cursor', 'codex'],
        isCurrentWorkspace: true,
        villagerCount: harborResidents.length,
        activeCount: harborResidents.filter((v) => v.isRunning).length,
        lastActivityMs: now,
      },
      {
        id: 'demo-maple',
        name: islandNames['demo-maple'],
        fruit: 'peach',
        folderPath: '~/workspaces/maple-studio',
        sources: ['claude', 'cursor'],
        isCurrentWorkspace: false,
        villagerCount: mapleResidents.length,
        activeCount: mapleResidents.filter((v) => v.isRunning).length,
        lastActivityMs: now,
      },
    ];

    return { islands, villagers, isDemo: true };
  }

  window.VillageI18n = {
    getLang,
    setLang,
    t,
    formatStats,
    formatDemoStats,
    formatIslandTitle,
    formatVillagerName,
    formatRoleFull,
    formatStationLabel,
    formatActionLabel,
    formatQuestTitle,
    formatDoorplateLabel,
    formatDetail,
    formatSourceLabel,
    formatThemeName,
    formatThemeBtnLabel,
    getDemoSnapshot,
  };
})();
