---
name: shadcn-wrapper
description: Convert a freshly installed shadcn/ui component into a design-system wrapper using cva, mapping shadcn tokens to project semantic alias (--color-primary, --color-danger, etc.). Use when /ds-component runs. Auto-validates WCAG contrast for all cva variants after generation (v0.2).
---

# shadcn → 디자인시스템 래퍼 변환 (v0.2)

shadcn 원본을 손대지 않고, 그 위에 **cva 기반 래퍼 + Storybook 스토리 + index export**를 생성. **마지막에 자동 WCAG 검증** (v0.2 신규).

## v0.2 변경점

- **시맨틱 alias 우선**: raw 스케일(`--color-brand-500`) 대신 alias(`--color-primary`) 사용 강제
- **생성 후 자동 a11y 검증**: cva variant 페어 추출 → contrast-checker 자동 실행
- **다크모드 검증 포함**: `--check-dark-parity`로 라이트/다크 둘 다 PASS 확인
- **CRITICAL 발견 시 차단**: WCAG FAIL이면 사용자에게 보고 후 변환 롤백 또는 사용자 결정 대기

## 언제 사용하나

- `/ds-component <Name>` 커맨드 실행 후
- `ds-component-implementer` 에이전트가 호출

## 입력

- `componentName` — 예: "Button"
- `shadcnComponentFile` — `src/components/ui/{name-kebab}.tsx`

## 출력 (3개 파일)

```
src/components/{ComponentName}/
├── {ComponentName}.tsx          ← 래퍼
├── {ComponentName}.stories.tsx  ← Storybook
└── index.ts
```

## 변환 규칙

### 1. 시맨틱 alias 우선 매핑 (v0.2)

shadcn 토큰 → 프로젝트 **alias** (raw 스케일 아님). 자세한 표는 `mapping-table.md` 참조.

| shadcn | 프로젝트 alias | 비고 |
|---|---|---|
| `bg-primary` | `bg-[var(--color-primary)]` | raw 스케일(--color-brand-500) 아님 |
| `text-primary-foreground` | `text-[var(--color-text-on-brand)]` | |
| `hover:bg-primary/90` | `hover:bg-[var(--color-primary-hover)]` | |
| `bg-destructive` | `bg-[var(--color-danger)]` | --color-danger-500 아님 |
| `text-destructive-foreground` | `text-[var(--color-text-on-danger)]` | |
| `bg-secondary` | `bg-[var(--color-bg-muted)]` | |
| `text-secondary-foreground` | `text-[var(--color-text)]` | |
| `border-input` | `border-[var(--color-border-interactive)]` | **v0.2**: decorative 아닌 interactive (3:1 보장) |
| `ring-ring` | `ring-[var(--focus-ring-color)]` | |

**raw 스케일은 마지막 수단**. alias가 없을 때만 사용하고, 그 경우 변환 직후 a11y 검증에서 잡힘.

### 2. cva 구조

shadcn 원본의 `cva()` variant 구조 유지 + 토큰을 alias로 교체 + variant 이름 정규화:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-[length:var(--focus-ring-width)] focus-visible:ring-offset-[length:var(--focus-ring-offset)] focus-visible:ring-[var(--focus-ring-color)]",
  {
    variants: {
      intent: {
        primary:
          "bg-[var(--color-primary)] text-[var(--color-text-on-brand)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-active)]",
        secondary:
          "bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-interactive)] hover:bg-[var(--color-surface-hover)]",
        ghost:
          "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-hover)]",
        danger:
          "bg-[var(--color-danger)] text-[var(--color-text-on-danger)] hover:bg-[var(--color-danger-hover)]",
      },
      size: {
        sm: "h-8 px-3 text-[length:var(--font-size-sm)] rounded-[var(--radius-md)]",
        md: "h-10 px-4 text-[length:var(--font-size-base)] rounded-[var(--radius-md)]",
        lg: "h-12 px-6 text-[length:var(--font-size-lg)] rounded-[var(--radius-lg)]",
      },
      fullWidth: { true: "w-full", false: "" },
    },
    defaultVariants: { intent: "primary", size: "md", fullWidth: false },
  },
);
```

### 3. forwardRef + displayName (필수)

```tsx
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, fullWidth, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}  // form 안에서 의도치 않은 submit 방지
      className={cn(buttonVariants({ intent, size, fullWidth }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";
```

### 4. 스토리 템플릿 (v0.2: autodocs 강제)

```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta = {
  title: "Components/Button",
  component: Button,
  parameters: { layout: "centered" },
  tags: ["autodocs"],  // v0.2: 누락 금지
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { children: "Click me" } };

export const Intents: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button intent="primary">Primary</Button>
      <Button intent="secondary">Secondary</Button>
      <Button intent="ghost">Ghost</Button>
      <Button intent="danger">Danger</Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};

export const States: Story = {
  render: () => (
    <div className="flex gap-2">
      <Button>Normal</Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const Matrix: Story = {
  render: () => {
    const intents = ["primary", "secondary", "ghost", "danger"] as const;
    const sizes = ["sm", "md", "lg"] as const;
    return (
      <div className="grid grid-cols-3 gap-4">
        {intents.flatMap((intent) =>
          sizes.map((size) => (
            <Button key={`${intent}-${size}`} intent={intent} size={size}>
              {intent} {size}
            </Button>
          )),
        )}
      </div>
    );
  },
};
```

### 5. **자동 WCAG 검증 (v0.2 핵심 신규)**

래퍼·스토리·index 생성 직후, **반드시** 실행:

```bash
node .claude/skills/a11y-contrast-checker/check.mjs \
  --tokens src/tokens/colors.css \
  --component src/components/{Name}/{Name}.tsx \
  --check-dark-parity \
  --json > /tmp/{Name}-a11y.json
```

결과 분석:
- 모든 페어 PASS + 동등성 OK → 변환 완료, 사용자에게 보고
- **FAIL 또는 동등성 위반 발견** → **사용자에게 즉시 보고**, 결정 요청:

```
⚠️ {Name} 컴포넌트에 WCAG 이슈 발견:

❌ intent=danger: --color-text-on-danger on --color-danger = 3.82:1 (라이트)
   → AA normal 4.5:1 미달

⚠️ intent=primary 다크모드 동등성 위반:
   라이트 4.57:1 PASS ↔ 다크 3.16:1 FAIL

원인: --color-danger가 raw 스케일을 가리키거나, semantic alias 미정의.

해결 옵션:
[A] 이대로 진행 (위험. 추후 /qa-a11y에서 다시 잡힘)
[B] colors.css의 semantic alias 수정 (--color-danger를 600 단계로) 후 재변환
[C] 변환 롤백 (Button 폴더 삭제, 토큰 먼저 수정 후 다시 /ds-component)

추천: B
```

### 6. index.ts

```ts
export { Button } from "./Button";
export type { ButtonProps } from "./Button";
```

## 변환 체크리스트 (v0.2)

- [ ] 3개 파일 생성됨
- [ ] **shadcn 토큰이 시맨틱 alias로 100% 교체됨** (raw 스케일 직접 참조 없음)
- [ ] `forwardRef` + `displayName`
- [ ] cva variant 이름 정규화 (intent/size 등)
- [ ] `tags: ["autodocs"]` 누락 없음
- [ ] **`a11y-contrast-checker --check-dark-parity --component` 자동 실행 + PASS**
- [ ] `src/components/ui/{name}.tsx` 손대지 않음
- [ ] `pnpm typecheck` 통과

## 자주 빠지는 함정 (v0.2 강화)

1. **raw 스케일 직접 참조** (`bg-[var(--color-brand-500)]`) → alias 사용 강제 (`--color-primary`)
2. **border-input → border-decorative** 매핑 실수 → 반드시 `border-interactive` 사용
3. **autodocs 태그 누락** → Storybook Autodocs 자동 생성 안 됨
4. **자동 a11y 검증 생략** → /qa에서 뒤늦게 발견. 처음부터 강제
