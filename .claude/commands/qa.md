---
description: 전체 디자인 시스템 + 접근성 + 와이어프레임 QA 일괄 실행. 인자 있으면 해당 컴포넌트만, 없으면 전부.
argument-hint: [ComponentName]
---

# /qa — 전체 QA

3개의 QA 에이전트를 순차 실행:
1. `qa-design-system` — 토큰·컴포넌트 정합성
2. `qa-a11y` — WCAG 2.2 AA 접근성
3. `qa-wireframe` — 와이어프레임 (`src/wireframes/`가 존재할 때만)

## 사용법

```
# 전체 검사
/qa

# 특정 컴포넌트만
/qa Button
/qa Dialog
```

## 흐름

```
사용자: /qa

Claude: 전체 QA 시작합니다.

        Step 1/3: 디자인 시스템 QA
        (qa-design-system 위임)
        ✓ 12개 컴포넌트 검사
        ✓ 토큰 준수: 11/12 PASS
        ✗ Dialog: 하드코딩 1개 발견

        Step 2/3: 접근성 QA
        (qa-a11y 위임)
        ✓ 14개 컬러 페어 검증
        ✓ ARIA: 13/14 PASS
        ✗ danger-500 대비비 4.21:1 (AA 미달)

        Step 3/3: 와이어프레임 QA
        ✓ src/wireframes/ 비어있음 — skip

        통합 리포트: docs/qa-reports/QA-All-2026-06-07-1200.md

        주요 이슈 3개:
        1. [CRITICAL] danger-500 대비 부족
        2. [HIGH] Dialog 하드코딩 (#000000)
        3. [MEDIUM] DESIGN.md에 TextField 누락

        수정 후 /qa 재실행 권장.
```

## 통합 리포트

3개 에이전트의 개별 리포트를 모아 통합 요약 추가 생성:
`docs/qa-reports/QA-All-{YYYY-MM-DD-HHMM}.md`

```markdown
# Combined QA Report — 2026-06-07 12:00

## Overall Grade
- 디자인 시스템: B (1 FAIL)
- 접근성: C (1 CRITICAL)
- 와이어프레임: N/A
- **종합: NEEDS WORK** (1 CRITICAL 이슈)

## CRITICAL Issues (즉시 해결 필요)
1. **danger-500 대비비 부족** (qa-a11y)
   - 4.21:1 < 4.5:1 (AA 미달)
   - 영향: Alert, Button intent=danger 등 사용자에게 안 보일 위험
   - 권장: --color-danger-500 → oklch L 값을 0.55에서 0.50으로 조정

## HIGH Issues
2. **Dialog 하드코딩** (qa-design-system) → src/components/Dialog/Dialog.tsx:42
3. **IconButton aria-label 누락** (qa-a11y) → 컴포넌트 props 필수화 권장

## MEDIUM Issues
4. DESIGN.md TextField 누락
5. Menu div onClick → button 변경

## 개별 리포트
- [디자인 시스템](./QA-Design-System-2026-06-07-1200.md)
- [접근성](./QA-A11y-2026-06-07-1200.md)
```

## 절대 실행하지 말 것

- 자동 수정 (리포트만)
- 한 에이전트 실패해도 다른 에이전트 skip 안 함
- 통합 리포트 생성 누락
