---
description: Figma에 디자인 시스템 컴포넌트 실제 생성 (ds-figma-component-builder 위임). write-capable Figma MCP 필요.
---

`ds-figma-component-builder` 에이전트를 호출하여 Figma에 디자인 시스템 컴포넌트(Component Set + Property Table)를 생성하세요.

## 전제
- **write-capable Figma plugin MCP(`use_figma`)가 연결돼 있어야 합니다.**
- 없으면 read-only인 `ds-component-builder`(코드→Figma 스펙시트)로 폴백하라고 안내하세요.

## 사용법
```
/build-component <컴포넌트명> [스펙 또는 Figma 노드 링크]
```
### 예시
- `/build-component Badge` — 기본 스펙으로 생성
- `/build-component Switch with on/off state and size variants` — 자유 스펙
- `/build-component IconButton https://figma.com/...` — Figma 시안 참고

## 작업 절차 (에이전트가 수행)
1. DESIGN.md/PROJECT.md 읽기 (페이지 ID·토큰·컨벤션)
2. 기존 컴포넌트 + 변수 조회 (중복 방지)
3. 컴포넌트 빌드 (auto-layout + 자식 노드 + 토큰 alias 바인딩)
4. variants 생성 + Component Set 결합
5. Property Table documentation frame 생성
6. screenshot 시각 검증
7. 노드 ID + 토큰 매핑표 반환

## 다음 단계 (체이닝)
- `/ds-component <Name>` → React + cva 코드 래퍼 + 스토리 + DESIGN.md 갱신
- `/qa <Name>` → QA 리포트로 사이클 닫기

## 인자가 부족하면
- 컴포넌트명 없으면 사용자에게 요청
- PROJECT.md에 Figma 키/페이지 ID가 비어 있으면 채워달라고 안내 후 중단
