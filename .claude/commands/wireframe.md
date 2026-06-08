---
description: 그레이스케일 와이어프레임 화면 생성. 회색 5단계만 사용, 강조는 typography로만.
argument-hint: <ScreenName> [구체 명세]
---

# /wireframe — 와이어프레임 생성

`src/wireframes/{Name}/`에 회색 화면 생성.

## 사용법

```
/wireframe Login
/wireframe Onboarding 3단계, 첫 화면 환영, 두 번째 기능 소개, 세 번째 권한 요청
/wireframe Dashboard 상단 검색바 + 카드 그리드 + 하단 nav
```

## 위임

`wireframe-builder` 에이전트에게 위임.

## 자동 처리 흐름

1. **화면 이름 추출** (예: "Login")
2. **명세 확인** — 인자에 명세 있으면 사용, 없으면 한 번 질문
3. **PROJECT.md 읽기** — 플랫폼 (mobile/web/both) 확인
4. **DESIGN.md 읽기** — 사용 가능한 컴포넌트 확인
5. **파일 생성**:
   - `src/wireframes/{Name}/{Name}.tsx`
   - `src/wireframes/{Name}/{Name}.stories.tsx`
   - `src/wireframes/{Name}/README.md`
6. **DESIGN.md 갱신** — 와이어프레임 카탈로그 섹션에 추가
7. **`enforce-grayscale` 훅이 색 사용 자동 차단**

## 사용 예시

```
사용자: /wireframe Login

Claude: Login 화면 생성합니다.
        PROJECT.md 확인: 플랫폼 = mobile

        간단한 명세 부탁드립니다:
        - 이메일/비밀번호 입력만? 아니면 소셜 로그인 포함?
        - 회원가입 링크 위치?

사용자: 이메일/비번 + 카카오 소셜 + 하단에 회원가입 링크

Claude: 명세 확인. 화면 구성:
        - Header: 서비스 이름 + 한 줄 설명
        - Form: 이메일, 비밀번호, 로그인 버튼
        - Divider: "또는"
        - Social: 카카오 로그인 버튼 (회색)
        - Footer: "계정이 없으신가요? 회원가입"

        생성 중...
        ✓ src/wireframes/Login/Login.tsx
        ✓ src/wireframes/Login/Login.stories.tsx
        ✓ src/wireframes/Login/README.md
        ✓ DESIGN.md 갱신

        확인: pnpm storybook → Wireframes/Login

        다음:
        /qa Login        # 와이어 QA
        디자인 단계로 가려면 → 색 정책 정해진 후 .tsx 복사해서 작업
```

## 절대 실행하지 말 것

- 색상 사용 (회색 5단계 외)
- 명세 안 묻고 멋대로 생성
- DESIGN.md 갱신 누락
