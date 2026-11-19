<p align="center">
  <img src="./assets/logo.svg" alt="에이전트의 숲 (Agent Crossing) 로고" width="76" />
</p>

# 🍃 에이전트의 숲 (Agent Crossing)

컴퓨터 내 모든 **Google Antigravity** 프로젝트에서 작동 중인 메인 에이전트(**촌장**)와 서브에이전트(**🌱 보조 주민**) 활동을 **추가 토큰 소모 `0`개**로 실시간 관전하는 2D *동물의 숲* 스타일 **Antigravity 사이드카 플러그인**입니다.

---

## ✨ 주요 특징

* **추가 토큰 소모 `0`개 · 에이전트 지연 `0%`**
  * 별도 LLM 호출이나 외부 MCP 서버 없이, Antigravity가 로컬에 기록하는 `conversation_summaries.db`(읽기 전용 SQLite)와 `transcript.jsonl` 스텝 로그만 비동기로 읽어 상태를 매핑합니다.
* **프로젝트별 섬 & 휴식/작업 공간 분리**
  * **주거 구역 (상단)**: 에이전트마다 개별 집이 배정되며, 쉬는 동안 노란 불이 켜진 집 마당에서 티타임/휴식을 취하고 작업이 시작되면 파란 창문으로 전환되어 광장으로 내려갑니다.
  * **작업 광장 (하단)**: 실행 중인 도구에 따라 `문서 읽기`, `구상·협업`, `DIY 제작`, `터미널`, `외부 탐색` 작업대로 이동하며, 비활성/빈 프로젝트는 `🪧 빈 집터` 컴팩트 카드로 정리됩니다.
* **사이드카 보조 패널 & 독립 미니창 (`팝아웃` / `미니창 고정`)**
  * `sidecar.json`의 `"restart_policy": "always"` 설정으로 Antigravity가 백엔드를 자동 실행·유지하며, 좁은 우측 사이드카 패널(`380px+`)과 넓은 독립 팝아웃 창(`960x640`, 우측 도킹 인스펙터)·Document PiP 미니창 모두에 반응형으로 적응합니다.
* **안전한 읽기 전용 관전 & 빠른 연결**
  * 실행 중인 대화를 임의로 조작·중단하지 않으며, 주민·섬 클릭 시 **`💬 이 대화 열기`**(사이드카 내 지원), **`📋 대화 ID 복사`**, **`📂 폴더 열기`**, **`완료·오류 알림`**, 그리고 실제 섬과 분리된 **`12초 시연`** 샌드박스를 제공합니다.

---

## 🗺️ 활동 상태 · 공간 매핑

| 아이콘 / 표시 | 의미 | 실제 Antigravity 상태 |
| :---: | :--- | :--- |
| 🎩 | 촌장 (굴뚝 집) | 메인 에이전트 대화 (`nesting_depth = 0`) |
| 🌱 | 보조 주민 (새싹 집) | 서브에이전트 (`nesting_depth > 0`) |
| ★ | 현재 워크스페이스 · 대화 | 지금 열려 있는 프로젝트 섬·대화 강조 |
| 📖 | 문서 읽기 (책장) | `read_file`, `view_file`, `grep`, `read_resource` 등 읽기·조회 |
| 📋 | 구상·협업 (게시판) | `invoke_subagent`, `send_message`, `swarm`, `exit_plan_mode`, `ask_question`, 사고 구름(`• • •`) |
| 🔨 | DIY 제작 (작업대) | `edit_file`, `write_file` 코드·파일 작성 |
| ⚙️ | 터미널 실행 (발전기) | `run_command`, `manage_task` 명령 실행 |
| 🔭 | 외부 탐색 (부두·지구본) | `search_web`, `search_marketplace`, `browser` 탐색 |
| ☕ / 💤 | 집 마당 휴식 | 최근 15분 이내 휴식(티타임) · 장기 대기(꿀잠) |
| 💦 | 오류 발생·점검 중 | 스텝 오류 발생 (`ERROR` 도구 및 상세 메시지 표시) |

---

## 🚀 설치 방법

### 요구 사항
* **Google Antigravity**
* **Node.js 22.5 이상** (`node:sqlite` 내장 모듈을 사용한 단독 실행 및 플러그인 설치 스크립트 실행용)

### 1. 저장소 클론 및 플러그인 자동 설치

```bash
git clone https://github.com/joy4166/Agent-Crossing.git
cd Agent-Crossing
npm run install-plugin
```

`npm run install-plugin`을 실행하면 현재 사용자의 `~/.gemini/config/plugins/agent-village` 경로(Windows: `%USERPROFILE%\.gemini\config\plugins\agent-village`)에 플러그인 파일이 자동 복사됩니다.

> **Windows 참고**: Antigravity 플러그인 스캐너는 Directory Junction(심볼릭 연결)을 건너뛰므로, 수동 설치 시에도 반드시 실제 폴더 형태로 복사해 주세요.

### 2. 실행 방법
1. Antigravity의 **Customizations / Plugins** 목록에서 **에이전트의 숲 (Agent Crossing)** 이 활성화되었는지 확인합니다.
2. 우측 보조 패널에서 **에이전트의 숲** 뷰를 열거나, 에이전트 채팅에서 아래와 같이 요청해 바로 열 수 있습니다.
   * `"에이전트의 숲 사이드카 패널 열어줘"`
   * `"지금 모든 프로젝트에서 에이전트들이 뭘 하고 있는지 보여줘"`

### 3. 단독 웹 서버로 실행하기 (선택)

사이드카 환경 밖에서 브라우저(`http://127.0.0.1:4777`)로 단독 실행해 확인할 수도 있습니다.

```bash
npm start
# 또는 포트 변경: PORT=4800 npm start
```

---

## ⌨️ 조작 및 단축키

| 입력 / 단축키 | 동작 |
| :--- | :--- |
| 드래그 / 방향키(캔버스 포커스) | 마을 화면 이동 (패닝) |
| 마우스 휠 / `+` / `−` | 화면 확대·축소 |
| `R` / 캔버스 더블클릭 / 우측 하단 `맞춤` | 전체 마을 화면 자동 맞춤 |
| `F` | `활발한 섬`(최근 15분 이내 작업) ↔ `전체 섬` 전환 |
| `/` 또는 `Ctrl+K` (`Cmd+K`) | 섬 · 주민 빠른 검색 목록 열기 (`↑`/`↓` 이동, `Enter` 선택) |
| `[` / `]` | 현재 보이는 섬 순회 선택 |
| `Esc` | 열린 안내·목록 시트 또는 상세 카드 순서대로 닫기 |

---

## 📁 폴더 구조

```text
Agent-Crossing/
├── plugin.json                        # Antigravity 플러그인 매니페스트
├── package.json                       # 단독 실행(npm start) 및 설치(install-plugin) 스크립트
├── PRODUCT.md                         # 제품 원칙 및 설계 범위
├── README.md
├── assets/
│   └── logo.svg                       # 플러그인 아이콘
├── skills/
│   └── open-agent-village/
│       └── SKILL.md                   # 사이드카 패널 열기 에이전트 스킬
└── sidecars/
    └── village/
        ├── package.json               # 사이드카 ESM 모듈 설정
        ├── sidecar.json               # Antigravity AUX_PANE & restart_policy 설정
        ├── main.mjs                   # 로컬 SQLite·transcript.jsonl 읽기 전용 백엔드 & 팝아웃 실행
        ├── index.html                 # 2D 마을 HUD·오버레이·인스펙터 마크업
        ├── styles.css                 # 반응형 사이드카(380px) · 팝아웃(960px) 스타일
        └── village.js                 # HTML5 2D 캔버스 렌더러·카메라·실시간 동기화
```

---

## 🔒 개인정보 및 안전 설계

* 로컬 Antigravity 데이터 디렉터리(`ANTIGRAVITY_EXECUTABLE_DATA_DIR` 또는 `~/.gemini/antigravity*`)를 동적으로 탐색하며, 개인 경로나 API 키가 코드에 포함되지 않습니다.
* 백엔드(`main.mjs`)는 SQLite DB(`readOnly: true`)와 `transcript.jsonl` 끝부분(`TAIL_BYTES`)만 읽으며 사용자 대화나 코드 파일을 수정하지 않습니다.
