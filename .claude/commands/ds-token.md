---
description: Figma Variables와 src/tokens/*.css 양방향 비교 + 충돌 해결. 안전하게 사용자 확인 거침.
---

# /ds-token — 토큰 동기화

Figma Variables와 로컬 CSS 토큰 사이의 정합성을 검증하고, 차이를 해결.

## 사용 시점

- 디자이너가 Figma Variables를 수정한 뒤
- 신규 토큰 추가가 필요할 때
- 정기 정합성 체크 (예: 주 1회)

## 위임

`ds-token-syncer` 에이전트에게 위임.

## 사용 예시

```
사용자: /ds-token

Claude: PROJECT.md에서 Figma 파일 키 확인 중...
        ✓ 파일 키: B138LEBl3Li7yNGdSpIuq6

        Figma Variables 읽는 중...
        로컬 src/tokens/*.css 파싱 중...

        Diff 계산:
        - 일치:        47개
        - Figma에만:   2개
        - 코드에만:    3개
        - 값 충돌:     1개

        충돌 1개 해결을 시작합니다...
        ⚠️ --color-brand-500
           Figma: oklch(0.58 0.20 260)
           코드:  oklch(0.60 0.22 260)
           어느 쪽이 정답인가요? [F/C/N/S]
사용자: F

Claude: ✓ Figma 값 채택. 코드 갱신.
        ...
        ✓ 리포트: docs/qa-reports/Token-Sync-2026-06-07-1130.md
        ✓ DESIGN.md 갱신

        다음 단계:
        - pnpm dev로 시각 변경 확인
        - 필요하면 컴포넌트 영향 검증 (/qa)
```

## 옵션 (인자 없이)

기본 동작: 양방향 diff + 한 건씩 충돌 확인.

## 절대 실행하지 말 것

- 충돌 자동 해결 (반드시 사용자 확인)
- 백업 없이 토큰 일괄 덮어쓰기
- Figma에 자동 쓰기 시도 (read-only)
