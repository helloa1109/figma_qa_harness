---
description: 접근성(WCAG 2.2 AA) 검사만 단독 실행. 컬러 대비 + ARIA + 키보드 + Semantic HTML 전 항목.
argument-hint: [ComponentName]
---

# /qa-a11y — 접근성 QA

`qa-a11y` 에이전트 단독 실행. `/qa`보다 빠르게 접근성만 검증.

## 사용법

```
# 전체 접근성 검사
/qa-a11y

# 특정 컴포넌트만
/qa-a11y Button
/qa-a11y Dialog
```

## 위임

`qa-a11y` 에이전트에게 위임. 결과는 `docs/qa-reports/QA-A11y-{날짜}.md`.

## 검사 항목 (요약)

1. **컬러 대비비**: 모든 토큰 페어 + 컴포넌트별 cva 페어
2. **ARIA**: alt, aria-label, aria-labelledby, role 적절성
3. **키보드**: div onClick 탐지, tabIndex 검토
4. **Focus**: focus-visible 클래스 존재 확인
5. **Semantic HTML**: div가 button이어야 하는 경우 등

## 사용 예시

```
사용자: /qa-a11y Button

Claude: Button 접근성 검사 중...

        Color Contrast (3개 페어):
        ✅ intent=primary: neutral-0 on brand-500 = 4.78:1 (AA pass)
        ✅ intent=ghost hover: neutral-900 on neutral-100 = 14.5:1 (AAA pass)
        ⚠️ intent=secondary disabled: neutral-500 on neutral-100 = 2.8:1 (AA fail, but disabled)

        ARIA:
        ✅ 텍스트 콘텐츠 있음 (children 필수 패턴)
        ✅ asChild prop 사용 시 Slot으로 폴백

        Keyboard:
        ✅ <button> 사용 (div onClick 없음)
        ✅ focus-visible:ring 적용

        결과: PASS (disabled 상태 대비 부족은 일반적 패턴)

        리포트: docs/qa-reports/QA-A11y-Button-2026-06-07-1205.md
```
