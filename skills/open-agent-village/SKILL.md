---
name: open-agent-village
description: 에이전트의 숲(Agent Crossing) 사이드카 패널을 열어 모든 Antigravity 프로젝트의 에이전트 활동을 실시간으로 확인합니다.
---

# 에이전트의 숲 (Agent Crossing)

사용자가 프로젝트 전체 에이전트 현황을 보거나 **에이전트의 숲** 시각화 패널을 열어달라고 요청하면, 우측 보조 패널을 바로 열 수 있는 사이드카 링크를 안내하세요.

- 보조 패널 열기: `[에이전트의 숲](sidecar://agent-village/village/)`
- 플러그인 관리 페이지: `[에이전트의 숲 (Agent Crossing)](customization://agent-village)`

이 사이드카는 추가 LLM 토큰을 소모하지 않고 로컬 SQLite 및 `transcript.jsonl` 로그만 읽기 전용으로 감시합니다.
