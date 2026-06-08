---
description: shadcn 컴포넌트 1개 추가 + 디자인시스템 래퍼 자동 생성 (cva + 스토리 + index). 인자로 컴포넌트 이름 받음.
argument-hint: <ComponentName> [figma-url]
---

# /ds-component — 컴포넌트 추가

shadcn에서 컴포넌트를 받아 디자인시스템에 통합.

## 사용법

```
/ds-component Button
/ds-component Dialog
/ds-component Card

# Figma node 시안과 함께
/ds-component Button https://figma.com/file/.../node-id=123:456
```

## 위임

`ds-component-implementer` 에이전트에게 위임.

## 자동 처리 흐름

1. **컴포넌트 이름 추출** (예: "Button")
2. **shadcn 매핑 확인** (kebab-case로 변환: "Button" → "button")
3. **이미 만들어졌는지 검증** (`src/components/Button/` 존재 시 사용자 확인)
4. **Sentinel 생성** → `src/components/ui/` 쓰기 허용
5. **shadcn 설치**: `pnpm dlx shadcn@latest add button --yes`
6. **래퍼 생성** (shadcn-wrapper 스킬에 위임):
   - `src/components/Button/Button.tsx`
   - `src/components/Button/Button.stories.tsx`
   - `src/components/Button/index.ts`
7. **Sentinel 제거**
8. **TypeScript 검증**: `pnpm typecheck`
9. **Eval 검증**: `pnpm eval` 실행 — CRITICAL 0건 + 기준선 대비 하락 없음 확인. CRITICAL이 있으면 완료 선언하지 말고 먼저 수정 (self-check 스킬과 동일 기준).
10. **DESIGN.md 갱신**

## 사용 예시

```
사용자: /ds-component Button

Claude: 컴포넌트 이름: "Button" 확인.
        shadcn 명: "button"

        기존 컴포넌트 확인...
        ✓ src/components/Button/ 없음 — 신규 생성 진행

        shadcn 원본 설치 중...
        ✓ src/components/ui/button.tsx 생성됨

        래퍼 생성 중 (shadcn-wrapper 스킬)...
        ✓ src/components/Button/Button.tsx (cva, 3 intents, 3 sizes)
        ✓ src/components/Button/Button.stories.tsx (5 stories)
        ✓ src/components/Button/index.ts

        TypeScript 검증 중...
        ✓ 에러 0개

        DESIGN.md 갱신 중...
        ✓ Button 카탈로그 항목 추가

        Storybook으로 확인하세요:
        pnpm storybook
        → http://localhost:6006/?path=/story/components-button

        다음 추천:
        /qa Button       # 디자인 시스템 QA
        /qa-a11y Button  # 접근성 검증
```

## Figma URL 함께 줄 때

`get_design_context`로 시안을 읽어 variant 자동 매핑.
시안에 있는 size/variant가 shadcn 원본에 없으면 새로 추가.

## 절대 실행하지 말 것

- `src/components/ui/*` 직접 수정 (shadcn 원본은 손대지 마)
- TypeScript 에러 남긴 채 종료
- DESIGN.md 갱신 누락
- Sentinel 제거 누락
