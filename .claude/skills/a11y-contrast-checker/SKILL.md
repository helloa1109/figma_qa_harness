---
name: a11y-contrast-checker
description: Compute WCAG 2.2 contrast ratios between color pairs (typically token combinations from src/tokens/colors.css). Returns pass/fail for AA (4.5:1 normal, 3:1 large) and AAA (7:1 normal, 4.5:1 large). Use when qa-a11y agent runs, or when validating a single specific color combination.
---

# WCAG Contrast Checker

WCAG 2.2 색상 대비비 계산.

## 언제 사용하나

- `qa-a11y` 에이전트가 모든 토큰 페어 검증할 때
- 사용자가 "이 두 색 대비 괜찮아?" 물을 때
- `/ds-token` 동기화 시 신규 토큰 추가 후 자동 검증
- 컴포넌트 추가 시 cva variant의 bg+text 페어 검증

## 입력 옵션

```bash
# 옵션 1: 두 hex 직접 비교
node check.mjs --fg "#ffffff" --bg "#3b82f6"

# 옵션 2: OKLCH 직접 비교
node check.mjs --fg "oklch(1 0 0)" --bg "oklch(0.58 0.19 260)"

# 옵션 3: 토큰 파일에서 페어 자동 추출 후 일괄 검사
node check.mjs --tokens src/tokens/colors.css

# 옵션 4: 특정 토큰 이름 페어
node check.mjs --tokens src/tokens/colors.css --pair "neutral-900,neutral-0"
```

## 출력

### 단일 페어
```
foreground: #ffffff (luminance 1.000)
background: #3b82f6 (luminance 0.171)
contrast:   4.78:1

Normal text (16px):  ✅ AA PASS (≥4.5:1)
                     ❌ AAA FAIL (<7:1)
Large text (≥18px):  ✅ AA PASS (≥3:1)
                     ✅ AAA PASS (≥4.5:1)
UI components:       ✅ PASS (≥3:1)
```

### 토큰 파일 일괄
JSON 출력 (qa-a11y가 파싱):
```json
{
  "summary": { "total": 14, "aa_pass": 12, "aa_fail": 2 },
  "pairs": [
    {
      "fg": "neutral-900",
      "bg": "neutral-0",
      "ratio": 16.2,
      "aa_normal": "pass",
      "aaa_normal": "pass"
    }
  ]
}
```

## WCAG 2.2 기준

| 텍스트 | AA | AAA |
|---|---|---|
| 일반 (< 18px, 또는 < 14px bold 아님) | 4.5:1 | 7:1 |
| 큰 (≥ 18px, 또는 ≥ 14px bold) | 3:1 | 4.5:1 |
| UI 컴포넌트 (테두리 등) | 3:1 | — |

## 알고리즘

1. **컬러 → linear RGB**:
   - sRGB 채널 값 (0-1) → linear: `c' = c <= 0.03928 ? c/12.92 : ((c+0.055)/1.055)^2.4`

2. **Relative luminance**:
   - `L = 0.2126 * R_lin + 0.7152 * G_lin + 0.0722 * B_lin`

3. **Contrast ratio**:
   - `ratio = (L1 + 0.05) / (L2 + 0.05)`, L1 = max, L2 = min
   - 최소 1:1 (같은 색), 최대 21:1 (검은색-흰색)

## 자동 페어링 (--tokens 모드)

토큰 파일에서 다음 페어들을 자동 생성:

1. **모든 *-foreground 페어**:
   - `--color-{X}-{n}` + `--color-neutral-0` (X = brand, success, warning, danger, info)
   - `--color-{X}-{n}` + `--color-neutral-900`

2. **시맨틱 표준 페어**:
   - `--color-neutral-900` on `--color-neutral-0` (본문)
   - `--color-neutral-500` on `--color-neutral-0` (보조 텍스트)
   - `--color-neutral-0` on `--color-neutral-900` (다크모드 본문)

3. **각 컴포넌트의 cva variant 페어** (qa-a11y가 컴포넌트 파일 읽어서 추출 후 전달)

## 한계

- **OKLCH 직접 입력 시**: 표준 WCAG는 sRGB 기반이라 OKLCH → sRGB 변환 거침. 변환 과정에서 미세 오차 가능.
- **알파 채널 (rgba)**: 미지원. 알파가 있으면 배경과 합성 후 입력하라고 안내.
- **APCA**: WCAG 3 후보 알고리즘. 아직 표준 아니라 미지원. 필요 시 별도 도구.
