---
description: PROJECT.md를 읽어 초기 토큰 파일 생성 + DESIGN.md 초기화. 신규 프로젝트에서 한 번만 실행.
---

# /init — 프로젝트 부트스트랩

`PROJECT.md`를 채운 직후 한 번만 실행. 다음을 자동으로 수행:

1. PROJECT.md 파싱 → 브랜드 컬러, 폰트, 다크모드 여부 등 확인
2. `color-scale-builder` 스킬로 브랜드 컬러 → 50~950 스케일 생성
3. neutral 스케일 생성 (chroma 0)
4. 시맨틱 컬러 4개 (success/warning/danger/info) 기본값 생성
5. `src/tokens/*.css` 7개 파일 작성:
   - `colors.css`, `typography.css`, `spacing.css`, `radius.css`, `motion.css`, `semantic.css`, `index.css`
6. `src/styles.css`에서 `@import "./tokens/index.css";` 주석 해제
7. `DESIGN.md` 카탈로그 초안 작성

## 위임

이 커맨드는 `ds-token-builder` 에이전트에게 작업 위임. Claude는 다음을 수행:

1. PROJECT.md가 존재하는지 확인. 없으면 안내 후 종료.
2. PROJECT.md의 `{...}` placeholder가 모두 채워졌는지 검증. 채워지지 않은 필수 필드(이름, 브랜드 컬러)가 있으면 사용자에게 알리고 종료.
3. `src/tokens/*.css`가 이미 존재하면 사용자에게 확인:
   - "기존 토큰 파일이 발견되었습니다. 백업 후 재생성할까요?"
4. 확인 받으면 `ds-token-builder` 에이전트 호출.

## 사용 예시

```
사용자: /init

Claude: PROJECT.md를 검증하는 중...
        ✓ 이름: "MyApp"
        ✓ 브랜드 컬러: #3b82f6
        ✓ 폰트: Pretendard
        ✓ 다크모드: yes

        토큰 파일을 생성합니다. (ds-token-builder 위임)
        ...
        ✓ src/tokens/colors.css (브랜드 12단계 + neutral 13단계 + 시맨틱 4×12단계)
        ✓ src/tokens/typography.css (사이즈 8단계, weight 6단계)
        ✓ src/tokens/spacing.css (4px 그리드 17단계)
        ✓ src/tokens/radius.css (5단계)
        ✓ src/tokens/motion.css (duration 3, easing 4)
        ✓ src/tokens/semantic.css (focus-ring, shadow, z-index)
        ✓ src/tokens/index.css (통합 import)
        ✓ src/styles.css 갱신 (토큰 import 활성화)
        ✓ DESIGN.md 카탈로그 초안 작성

        ✓ sentinel(.ds-token-active) node로 자동 제거 — 보호 복구됨

        다음 단계:
        - (Figma 키 있으면) /figma-tokens 전체 — 토큰을 Figma에 생성
        - (없으면) /ds-component Button — 첫 컴포넌트
        - pnpm eval:baseline — 회귀 추적 기준선
        - pnpm dev — 화면 확인
```

## 절대 실행하지 말 것

- PROJECT.md가 비어있는데 진행
- 기존 src/tokens/* 백업 없이 덮어쓰기
- 사용자 확인 없이 강제 진행
- `rm`으로 sentinel 제거 (반드시 node로)
- 다음 단계로 고정 메뉴 밖의 임의 명령 제시
