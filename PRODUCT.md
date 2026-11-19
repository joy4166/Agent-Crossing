# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

여러 Antigravity(AGY) 프로젝트·워크스페이스를 동시에 오가며 메인 에이전트와 서브에이전트 작업을 병렬로 실행하는 개발자 및 메이커. 특정 개인 PC 전용에 그치지 않고, 다른 Antigravity 사용자도 자신의 로컬 환경에 설치해 바로 사용할 수 있는 공유·배포 가능한 Antigravity 사이드카 플러그인을 지향한다.

## Product Purpose

컴퓨터 내 모든 Antigravity 프로젝트에서 작동 중인 메인 에이전트와 서브에이전트들이 실제로 어떤 작업을 수행 중인지 한눈에 관전·파악하게 해 준다. 안전한 읽기 전용 실시간 시각화를 기본으로 하되, 섬·주민을 통한 해당 프로젝트 폴더 및 대화 빠른 열기와 작업 완료·오류 알림을 지원해 멀티 프로젝트 작업 흐름을 놓치지 않게 돕는다.

## Positioning

- **추가 토큰 소모 `0`개 · 에이전트 지연 `0%`**: 별도 LLM 호출이나 외부 MCP 없이, Antigravity가 로컬에 기본 기록하는 `conversation_summaries.db`(읽기 전용)와 `transcript.jsonl` 실시간 스텝·도구 로그만 비동기로 테일링해 상태를 매핑한다.
- 단일 워크스페이스 내부 패널에 갇히지 않고 머신 전체의 모든 Antigravity 프로젝트를 한 화면에서 동시에 추적한다.

## Operating Context

- **Antigravity 사이드카 플러그인 (`SIDECAR_UI_ENTRYPOINT_AUX_PANE`)** 으로 동작하며, `sidecar.json`의 `"restart_policy": "always"` 정책을 통해 별도의 수동 서버 실행이나 `.bat` 스크립트 없이 Antigravity가 백엔드를 자동 기동·유지한다.
- 평소에는 우측 보조 패널에서 세로/좁은 폭에 맞춘 마을 뷰를 확인하고, 다른 창을 오갈 때는 **`📌 미니창 팝아웃`**(Document PiP 또는 팝업 미니 창)으로 바깥에 떼어내어 사용한다.
- 로컬 Node.js 내장 모듈(`node:http`, `node:sqlite`, `node:fs`, `node:crypto`, `node:child_process`) 및 `sidecar_sdk` 기반 백엔드(`sidecars/village/main.mjs`)가 `ANTIGRAVITY_EXECUTABLE_DATA_DIR`(또는 단독 실행 시 `~/.gemini/antigravity*`)를 동적으로 탐색해 `projects/*.json`, `conversation_summaries.db`, `brain/<conversationId>/.system_generated/logs/transcript.jsonl`을 읽는다.

## Capabilities and Constraints

- **표현 방식 고정**: 3D로 확장하지 않고 가볍고 쾌적한 **2D** 화면으로 유지하며, 좁은 보조 패널 폭과 넓은 팝아웃 미니 창 모두에 자동 적응하는 섬 그리드를 제공한다.
- **공간 및 상태 분리**: 각 프로젝트는 독립된 '섬'으로 구성하고, 각 에이전트(메인 '촌장' 및 서브에이전트 '보조 주민')는 섬 상단 주거 구역에 자신의 **개별 집(`home`)**을 가진다. 대기·휴식 중에는 중앙에 겹치지 않고 각자 집에서 쉬며, 실제 도구 실행·추론 시에만 하단 작업 광장(문서 책장, 작전 게시판, DIY 작업대, 터미널 발전기, 외부 탐색 부두)으로 이동한다.
- **안전한 관전과 빠른 연결**: 프롬프트 전송이나 실행 중 대화 강제 조작·중단 기능은 두지 않고(읽기 전용 안전성 유지), 대신 **`💬 이 대화 열기`**(`window.sidecar.ui.toggleConversation`), **`📂 폴더 열기`**(OS 파일 탐색기 연동), **`🔔 알림`**(작업 완료·오류 전환 감지 알림)만 제공한다.
- **범용 배포 호환성**: 하드코딩된 개인 경로나 특정 프로젝트명에 의존하지 않고 `ANTIGRAVITY_EXECUTABLE_DATA_DIR` 및 `os.homedir()` 기반 동적 탐색으로 다른 Antigravity 사용자의 Windows·macOS·Linux 환경에서도 즉시 동작해야 한다.
- **미결정 사항 (Open Decisions)**:
  - 향후 마켓플레이스·외부 배포 채널(Git 저장소 vs Antigravity 마켓플레이스 등록 형태)

## Brand Commitments

- **제품명**: 에이전트의 숲 (Agent Crossing)
- **핵심 메타포 및 어조**: '동물의 숲' 마을처럼 프로젝트별 섬, 에이전트별 집, 공동 작업 광장으로 에이전트 생태계를 친근하고 직관적인 한국어 레이블로 표현한다.

## Evidence on Hand

- 실행 가능한 사이드카 플러그인 및 2D 캔버스 UI 코드베이스: `plugin.json`, `assets/logo.svg`, `skills/open-agent-village/SKILL.md`, `sidecars/village/sidecar.json`, `sidecars/village/main.mjs`, `sidecars/village/index.html`, `sidecars/village/styles.css`, `sidecars/village/village.js`, `README.md`.
- 실제 Antigravity 로컬 SQLite(`conversation_summaries.db`) 및 `transcript.jsonl` 로그 연동·스트리밍 검증 완료.
- 부재 항목(임의 생성 금지): 외부 사용자 후기, 성능 벤치마크 수치, 공식 라이선스 문구, 외부 배포 URL은 아직 없다.

## Product Principles

1. **제로 오버헤드 관전**: 시각화는 추가 LLM 토큰을 절대 소모하지 않으며 에이전트 실행 속도에 영향을 주지 않는다.
2. **겹침 없는 공간 가독성**: 좁은 사이드카 패널과 작은 미니 창에서도 누가 쉬고 누가 일하는지 즉시 읽히도록 개별 집(휴식)과 작업 광장(활성)을 분리한다.
3. **안전한 관전과 빠른 연결**: 세션을 임의로 제어·변경하지 않으면서, 필요한 순간 해당 프로젝트·대화로 빠르게 이어지고 완료·오류만 명확히 알린다.
4. **설치 부담 없는 범용성**: 외부 유료 도구·MCP·무거운 의존성 없이 플러그인 설치만으로 Windows·macOS·Linux 환경에서 바로 동작해야 한다.
