# shadcn Token Mapping Table (v0.2)

> shadcn/ui 시맨틱 토큰 → 디자인시스템 **semantic alias** 매핑.
> v0.2: raw 스케일(`--color-brand-500`) 대신 alias(`--color-primary`) 우선 사용.

## 핵심 원칙

| 우선순위 | 토큰 | 예시 |
|---|---|---|
| 1 (최우선) | semantic alias | `--color-primary`, `--color-danger`, `--color-text-on-brand` |
| 2 (alias 없을 때) | raw 스케일 | `--color-brand-500` |
| 3 (절대 금지) | hex 직접 | `#3b82f6` (훅이 차단) |

## 색상 매핑

### Background (배경)

| shadcn 클래스 | 프로젝트 alias | raw 폴백 |
|---|---|---|
| `bg-background` | `bg-[var(--color-bg)]` | `bg-[var(--color-neutral-0)]` |
| `bg-foreground` | `bg-[var(--color-text)]` | `bg-[var(--color-neutral-900)]` |
| `bg-primary` | `bg-[var(--color-primary)]` | — |
| `hover:bg-primary/90` | `hover:bg-[var(--color-primary-hover)]` | — |
| `active:bg-primary/80` | `active:bg-[var(--color-primary-active)]` | — |
| `bg-secondary` | `bg-[var(--color-bg-muted)]` 또는 `bg-[var(--color-surface)]` | — |
| `bg-muted` | `bg-[var(--color-bg-muted)]` | — |
| `bg-accent` | `bg-[var(--color-surface-hover)]` | — |
| `bg-destructive` | `bg-[var(--color-danger)]` | — |
| `hover:bg-destructive/90` | `hover:bg-[var(--color-danger-hover)]` | — |
| `bg-card` | `bg-[var(--color-surface)]` | — |
| `bg-popover` | `bg-[var(--color-surface)]` | — |

### Text (텍스트)

| shadcn 클래스 | 프로젝트 alias |
|---|---|
| `text-foreground` | `text-[var(--color-text)]` |
| `text-primary` | `text-[var(--color-primary)]` |
| `text-primary-foreground` | `text-[var(--color-text-on-brand)]` |
| `text-secondary-foreground` | `text-[var(--color-text)]` |
| `text-muted-foreground` | `text-[var(--color-text-muted)]` |
| `text-destructive` | `text-[var(--color-danger)]` |
| `text-destructive-foreground` | `text-[var(--color-text-on-danger)]` |
| `text-card-foreground` | `text-[var(--color-text)]` |

### Border / Ring (v0.2 핵심 변경)

| shadcn 클래스 | 프로젝트 alias | 비고 |
|---|---|---|
| `border-input` | `border-[var(--color-border-interactive)]` | **3:1 보장** (input, button) |
| `border-border` | `border-[var(--color-border-decorative)]` | 카드 분리선 등 |
| `border` (강조) | `border-[var(--color-border-strong)]` | |
| `ring-ring` | `ring-[var(--focus-ring-color)]` | |
| `ring-offset-background` | `ring-offset-[var(--color-bg)]` | |

> 🚨 **v0.2 새 규칙**: input과 button 테두리는 **반드시** `--color-border-interactive` 사용. `--color-border-decorative`를 쓰면 WCAG 1.4.11 위반 (3:1 미달).

## 타이포

### Font Size

| shadcn 클래스 | 프로젝트 alias |
|---|---|
| `text-xs` | `text-[length:var(--font-size-xs)]` |
| `text-sm` | `text-[length:var(--font-size-sm)]` |
| `text-base` | `text-[length:var(--font-size-base)]` |
| `text-lg` | `text-[length:var(--font-size-lg)]` |
| `text-xl` | `text-[length:var(--font-size-xl)]` |
| `text-2xl` | `text-[length:var(--font-size-2xl)]` |
| `text-3xl` | `text-[length:var(--font-size-3xl)]` |
| `text-4xl` | `text-[length:var(--font-size-4xl)]` |

### Line Height

| shadcn 클래스 | 프로젝트 alias |
|---|---|
| `leading-none` | `leading-[var(--line-height-none)]` |
| `leading-tight` | `leading-[var(--line-height-tight)]` |
| `leading-normal` | `leading-[var(--line-height-normal)]` |
| `leading-relaxed` | `leading-[var(--line-height-relaxed)]` |

## 라디우스

| shadcn 클래스 | 프로젝트 alias |
|---|---|
| `rounded-sm` | `rounded-[var(--radius-sm)]` |
| `rounded-md` | `rounded-[var(--radius-md)]` |
| `rounded-lg` | `rounded-[var(--radius-lg)]` |
| `rounded-xl` | `rounded-[var(--radius-xl)]` |
| `rounded-full` | `rounded-[var(--radius-full)]` |

## 그림자 (PROJECT.md에 따라 가용)

| shadcn 클래스 | 프로젝트 alias |
|---|---|
| `shadow-sm` | `shadow-[var(--shadow-sm)]` (있을 때만) |
| `shadow-md` | `shadow-[var(--shadow-md)]` |
| `shadow-lg` | `shadow-[var(--shadow-lg)]` |

> ⚠️ PROJECT.md에 "그림자 최소화"가 적혀있으면 shadow 토큰이 아예 없을 수 있음. 그 경우 shadow 사용 자체를 회피하고 border로 분리.

## Focus Ring (v0.2)

```tsx
// 권장 패턴
"focus-visible:outline-none
 focus-visible:ring-[length:var(--focus-ring-width)]
 focus-visible:ring-offset-[length:var(--focus-ring-offset)]
 focus-visible:ring-[var(--focus-ring-color)]"
```

## variant 이름 정규화

| shadcn variant 이름 | 권장 |
|---|---|
| `variant: default` | `intent: primary` |
| `variant: destructive` | `intent: danger` |
| `variant: outline` | `intent: secondary` |
| `variant: secondary` | `intent: secondary` |
| `variant: ghost` | `intent: ghost` |
| `variant: link` | `intent: link` |
| `size: default` | `size: md` |
| `size: sm`/`lg`/`icon` | 동일 유지 |

## 변환 검증 (v0.2)

```bash
# raw 스케일 직접 참조 검출 (있으면 안 됨)
grep -rE "var\(--color-(brand|success|warning|danger|info|accent|primary|secondary)-[0-9]+\)" \
  src/components/{Name}/ --include="*.tsx" --exclude-dir=ui
# → 결과 0개여야 함

# shadcn 토큰이 남아있는지 검출
grep -rE "(bg|text|border)-(primary|secondary|destructive|muted|accent|card|popover|foreground)\b" \
  src/components/{Name}/ --include="*.tsx" --exclude-dir=ui
# → 결과 0개여야 함
```

위 두 검사가 모두 0개 + a11y-contrast-checker가 PASS이면 변환 완료.
