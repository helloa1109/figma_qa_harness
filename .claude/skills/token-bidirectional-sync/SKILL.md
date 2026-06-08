---
name: token-bidirectional-sync
description: Compute the diff between Figma Variables (read via MCP) and local src/tokens/*.css, classify into match/figma-only/code-only/conflict categories, then guide the user through conflict resolution. Use when /ds-token runs or when ds-token-syncer agent is invoked.
---

# Token Bidirectional Sync

Figma Variables와 로컬 CSS 토큰 사이의 양방향 diff. **자동 머지하지 않음** — 사용자에게 명시적 의사결정 요청.

## 언제 사용하나

- `/ds-token` 커맨드 실행 시
- `ds-token-syncer` 에이전트가 호출
- Figma Variables 변경 의심 시 일관성 검증

## 입력

- **Figma 측**: `mcp__plugin_figma_figma__get_variable_defs`의 출력
- **로컬 측**: `src/tokens/*.css` 파일들

## 출력

`docs/qa-reports/Token-Sync-{YYYY-MM-DD-HHMM}.md` 리포트.

## 알고리즘

### 1. 토큰 정규화

양쪽을 동일한 형식으로 변환해서 비교 가능하게:

```js
{
  name: "--color-brand-500",      // CSS 변수명 형식으로 통일
  category: "color",                // color | typography | spacing | radius | motion | semantic
  value: "oklch(0.58 0.19 260)",   // CSS 표기 형식
  source: "figma" | "code",
  rawValue: { L: 0.58, C: 0.19, H: 260 }  // 비교용 raw
}
```

Figma Variable 이름 정규화 규칙:
- `Color/Brand/500` → `--color-brand-500`
- `Spacing/4` → `--space-4`
- `Typography/Font Size/sm` → `--font-size-sm`
- 슬래시 → 하이픈, 공백 제거, 소문자화

### 2. 4분류 카테고리

각 토큰 이름에 대해:

| 카테고리 | 조건 | 액션 |
|---|---|---|
| ✅ MATCH | 양쪽에 있음, 값 동일 (오차 0.001 이내) | 무시 |
| ➕ FIGMA_ONLY | Figma에만 있음 | 코드에 추가 제안 |
| ➖ CODE_ONLY | 코드에만 있음 | 사용자에게 확인 (deprecated인지 미반영인지) |
| ⚠️ CONFLICT | 양쪽에 있는데 값이 다름 | 충돌 해결 필요 |

### 3. 컬러 값 비교 방법

OKLCH로 변환 후 ΔE 거리 계산:

```
ΔL = |L1 - L2|
ΔC = |C1 - C2|
ΔH = min(|H1-H2|, 360-|H1-H2|) / 360
거리 = sqrt(ΔL² + ΔC² + (ΔH*0.5)²)
```

- 거리 < 0.005 → MATCH
- 거리 < 0.02 → MINOR_DRIFT (경고만)
- 거리 ≥ 0.02 → CONFLICT

### 4. 충돌 해결 UX

각 충돌마다 사용자에게:

```
⚠️ 충돌: --color-brand-500
   Figma:  oklch(0.58 0.20 260)
   코드:    oklch(0.60 0.22 260)
   거리:    0.024 (ΔL=0.02, ΔC=0.02)

   어느 쪽이 정답인가요?
   [F] Figma → 코드로 (Figma가 진실의 원천)
   [C] 코드 → Figma로 (코드가 진실의 원천. 단, Figma는 read-only — 디자이너에게 수동 변경 요청 안내 출력)
   [N] 새 값 직접 입력
   [S] 건너뛰기 (다음 동기화로 미룸)
```

자세한 절차는 `conflict-resolution.md` 참조.

### 5. WCAG AA 사전 검증

토큰 변경이 끝나기 전에:
- `--color-neutral-0` on `--color-brand-500` — 대비 4.5:1 이상?
- `--color-neutral-900` on `--color-neutral-0` — 대비 7:1 이상? (AAA 권장)
- `--color-neutral-0` on `--color-danger-500` — 대비 4.5:1 이상?

위반 시 강한 경고. 사용자가 강제로 진행하면 리포트에 명시.

### 6. 리포트 템플릿

```markdown
# Token Sync Report — 2026-06-07 11:30

## Summary
- 일치: 47개
- Figma에만: 2개 (코드에 추가 권장)
- 코드에만: 3개 (수동 확인 필요)
- 값 충돌: 1개 → 해결 완료
- WCAG 위반: 0개

## Changes Applied (Code Updated)

### Figma → 코드로 반영
| 토큰 | 이전 (코드) | 이후 (Figma) |
|---|---|---|
| --color-brand-500 | oklch(0.60 0.22 260) | oklch(0.58 0.20 260) |

### 새로 추가 (Figma에 있던 것)
- --color-brand-150 = oklch(0.91 0.06 260)
- --color-accent-500 = oklch(0.65 0.18 320)

## Manual Action Required (Figma에 추가해야 함)
> Figma MCP는 read-only라 자동 추가 불가. 디자이너에게 요청:
- (코드에 있는데 Figma에 없음) `--space-128 = 8rem` — Figma에서 Spacing/128 추가 필요

## Unresolved Conflicts
없음.

## WCAG Audit
| 페어 | 대비 | 상태 |
|---|---|---|
| neutral-0 on brand-500 | 4.78:1 | ✅ AA pass |
| neutral-900 on neutral-0 | 16.2:1 | ✅ AAA pass |
```

## 절대 금지

- ❌ 충돌을 자동 해결 (반드시 사용자 확인)
- ❌ 백업 없이 토큰 파일 일괄 덮어쓰기 (작업 전 `cp -r src/tokens src/tokens.backup`)
- ❌ WCAG 검증 누락
- ❌ Figma read-only를 무시하고 "Figma에 자동 동기화" 같은 거짓 보고
