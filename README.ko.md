<p align="center">
  <img src="./assets/logo.svg" alt="에이전트의 숲 (Agent Crossing) 로고" width="76" />
</p>

# 에이전트의 숲 (Agent Crossing)

> [English](./README.md) | **한국어**

**Google Antigravity**의 메인 에이전트와 서브 에이전트들이 지금 각 프로젝트에서 무슨 작업을 하고 있는지 **추가 토큰 소모 `0`개**로 실시간 관전하는 2.5D *동물의 숲* 디오라마 감독 플러그인 & 단독 앱입니다.

---

## 빠른 설치 및 실행 (`npx`)

> **Node.js 22.5 이상** 필요 (`node:sqlite` 내장 모듈 사용, 외부 무거운 의존성 없음)

### 1. Antigravity 사이드카 플러그인으로 설치 (추천)

```bash
npx agent-crossing install
```

실행하면 `~/.gemini/config/plugins/agent-village` 경로에 플러그인 파일이 자동 복사됩니다.  
설치 후 Antigravity 사이드카 패널에서 `[에이전트의 숲](sidecar://agent-village/village/)`을 열어 바로 사용할 수 있습니다.  
*(Windows 환경에서는 디렉터리 정션 대신 실제 파일 복사가 필요해 `npx agent-crossing install`이 자동으로 안전하게 복사합니다.)*

### 2. 설치 없이 미니 창으로 바로 실행해보기

```bash
npx agent-crossing --open
```

`http://127.0.0.1:4777`로 전용 창이 열리며, 상단 **`미니창 고정`** 버튼으로 PiP/독립 창 전환이 가능합니다.

---

## 주요 특징

- **Antigravity 무토큰 실시간 감독 (추가 토큰 `0` · 지연 `0%`)**
  - 별도 LLM 호출 없이 로컬에 기록되는 Antigravity 로그만 읽기 전용(`readOnly: true` SQLite 및 캐시된 head/tail JSONL)으로 탐색합니다.
    - `conversation_summaries.db` + `brain/<id>/.system_generated/logs/transcript.jsonl` + `projects/*.json`
  - *(참고: Claude Code · Cursor · Codex용 실험적 어댑터 코드는 `sidecars/village/adapters.mjs`에 보관되어 있으며, `--experimental-adapters` 옵션으로 켤 수 있습니다.)*
- **2.5D 모동숲 섬 디오라마 & 시간대 조명**
  - 다층 각진 바위·흙 절벽 단면, 2단 폭포, 아치형 통나무 다리, 안내소 시계 광장 천막, 우체통·울타리가 있는 입체 코티지, 5대 작업 광장 스테이션을 `2x` 프리베이크드 캔버스로 렌더링합니다.
  - 상단 버튼으로 **현실 시간 자동(낮·노을·밤 창문 불빛 & 반딧불이)** 을 지원합니다.
- **영어·한국어 (`EN / KO`) 실시간 전환**
  - 글로벌 배포를 위한 **영어 기본 UI**와, 상단 바·설정 시트에서 새로고침 없이 즉시 전환되는 **한국어 모드**(`촌장 보리`, `학예 모카` 등)를 지원합니다.
- **감독 편의 디테일**
  - **행동 기준 필터 버튼**: 활발한 섬만 보는 중에는 **`전체 섬 보기`**를, 전체 섬을 보는 중에는 **`활발한 섬만`**을 표시해 클릭 시 동작이 직관적입니다.
  - **한 섬 집중 보기 (`Z`)**: 원하는 프로젝트 섬 하나만 캔버스에 크게 띄워 모든 에이전트 동선을 집중 관전할 수 있습니다.
  - **원치 않는 섬 숨기기·복원**: 테스트용·임시 섬을 **이 섬 숨기기**로 제외하고, 명부 하단 **숨긴 섬 관리** 아코디언에서 언제든 복원할 수 있습니다.

---

## 로컬 개발 및 테스트

```bash
git clone https://github.com/joy4166/Agent-Crossing.git
cd Agent-Crossing
npm run open           # 로컬 서버 + 창 실행
npm run install-plugin # 로컬 소스를 Antigravity 플러그인 폴더에 설치
npm test               # 어댑터 통합 테스트 실행
```
