# Harness Core

> Figma MCP + shadcn/ui 기반 **디자인 시스템 자동화 하네스**.
> 새 프로젝트마다 다시 만들 필요 없는, 재사용 가능한 메타 프레임워크.
> [📖 전체 사용 매뉴얼 (PDF)](docs/manual/harness-core-manual-v0.6.0.pdf)
> **v0.6** (2026-06-08): 화면설계서(`/screen-spec`) 추가 — 회색 와이어 다음 단계로 인터랙션 명세(흐름 + 콜아웃 + Screen ID + Description 표)를 Figma에 생성. (v0.5: Figma QA · v0.4: Figma 빌더) [CHANGELOG.md](./CHANGELOG.md) 참조.


---

## 🎯 무엇을 위한 것인가

세 가지 일을 자동화합니다:

1. **디자인 시스템 구축** — Figma Variables ↔ CSS 토큰 양방향 동기화
2. **와이어프레임 생성** — 그레이스케일 화면 자동 생성 (색은 디자인 단계에서)
3. **품질 검증** — 토큰 정합성 + WCAG AA 접근성 자동 검사

디자이너 없이 혼자 일하는 개발자, 또는 디자인 시스템 정립이 우선인 작은 팀을 위해.

---

## ⚡️ 5분 안에 시작하기

### 1) 셋업

```bash
bash INSTALL.sh
```

자동으로:
- Node.js 20+ 확인
- pnpm 설치 (없으면)
- 모든 의존성 설치
- Playwright 브라우저 설치

### 2) 프로젝트 정의

`PROJECT.md`를 열어서 채우세요. 채울 것:

- 프로젝트 이름 / 한 줄 설명
- 브랜드 컬러 1개 (hex)
- 폰트 1개
- Figma 파일 키 (선택)
- 톤 3-5개

> 5분이면 충분합니다. 한 번 작성하면 이후 거의 안 바뀝니다.

### 3) Claude Code에서 부트스트랩

Claude Code 대화창에서:

```
/init
```

자동으로 일어나는 일:
- `PROJECT.md`의 브랜드 컬러 → 50~900 스케일 자동 생성
- `src/tokens/*.css` 초기 토큰 생성
- `DESIGN.md` 카탈로그 자동 작성
- (Figma 키 있으면) Foundations 페이지에 토큰 swatch 생성

### 4) 사용 시작

```bash
pnpm dev        # 개발 서버
pnpm storybook  # 컴포넌트 카탈로그
```

---

## 🧩 핵심 워크플로우

### 컴포넌트 추가

```
/ds-component Button
```

자동으로:
1. `pnpm dlx shadcn@latest add button` 실행
2. shadcn 원본을 `src/components/ui/button.tsx`에 받음 (손대지 마)
3. 사용자용 래퍼를 `src/components/Button/Button.tsx`에 생성 (cva 사용)
4. Storybook 스토리 자동 생성
5. `DESIGN.md` 카탈로그 갱신

### 와이어프레임 생성

```
/wireframe Login
```

- `src/wireframes/Login/Login.tsx` 생성
- **회색 5단계만 허용** (훅이 자동 차단)
- 강조는 typography weight/size로만

### 화면설계서 생성 (인터랙션 명세) — v0.6

회색 와이어(정보구조) 다음 단계. **무엇을 누르면 어떻게 동작하는가**를 Figma에 명세서로.

```
/screen-spec 상품옵션선택
```

- 화면 흐름 + 오렌지 콜아웃 + `Screen ID`(예: `PRD-MO-1-PG-001`) + `Num|Description` 표
- 양식·색·ID 포맷은 `screen-spec-template` 스킬에 고정 — **이번 화면 플로우만** 1회 확인
- 목업은 회색(DS 컴포넌트 재사용), 콜아웃·화살표·참조주만 색 (write Figma MCP 필요)

### 토큰 동기화

```
/ds-token
```

- Figma Variables ↔ `src/tokens/*.css` 양방향 diff
- WCAG AA 대비비 자동 검증
- 충돌 시 리포트 → `docs/qa-reports/`

### Figma에 직접 빌드 (write-capable MCP 필요)

write-capable Figma plugin MCP(`use_figma`)가 연결돼 있으면, Figma에 컴포넌트·토큰을 **실제로 생성**합니다.

```
/build-component Badge      # Figma에 Component Set + Property Table 생성
/figma-tokens 전체          # Figma에 Variables(Colors/Typography/Spacing/Radius) 생성
```

- 토큰 alias 바인딩 + variant property + swatch/Documentation frame + screenshot 시각 검증까지 자동
- Figma Variable 이름은 코드 CSS와 1:1 (`--color-brand-500` ↔ `brand/500`)
- **write MCP가 없으면** read-only 폴백: 컴포넌트는 `ds-component-builder`(스펙시트), 토큰은 `/ds-token`(비교)·`/init`(브랜드색→CSS)

> 방향 정리: `/init`·`/ds-component`(코드 생성) → `/build-component`·`/figma-tokens`(Figma 생성) → `/ds-token`(코드↔Figma 동기화) → `/qa`(검증)

### QA

```
/qa                   # 전체 QA (디자인 시스템 + a11y + 코드 와이어)
/qa-a11y              # 접근성만
/qa-figma-wireframe   # Figma에 그려진 화면 frame 검증 (read Figma MCP 필요)
```

- 코드 와이어는 `/qa wireframe`, **Figma 화면**은 `/qa-figma-wireframe`로 구분
- Figma 키가 있으면 `/qa`의 디자인시스템 감사가 **Figma↔코드 스크린샷 시각 비교**까지 수행

### Eval — 하네스 회귀 추적

`/qa`가 "이 컴포넌트가 잘 만들어졌나"를 본다면, Eval은 "하네스 자체가 잘 작동하나·퇴화하지 않았나"를 점수로 본다.

```bash
pnpm eval:baseline   # 정상 상태를 기준선으로 저장 (최초 1회)
pnpm eval            # 채점 → 기준선 대비 ▲/▼ 변화 표시
```

에이전트를 재호출하지 않아 API 비용 0. CRITICAL 발생 시 exit 1 (CI 빌드 차단). 완료 선언 전 self-check 스킬이 자동으로 이를 돌린다.

---

## 📁 폴더 구조

```
harness-core/
├── PROJECT.md         ← 사람이 채움 (1회)
├── DESIGN.md          ← 에이전트가 자동 갱신
├── .claude/
│   ├── CLAUDE.md      ← 도메인 의존성 없는 헌법
│   ├── agents/        ← 12개 전문 에이전트 (Figma 빌더 + Figma QA + 화면설계서 포함)
│   ├── commands/      ← /init, /ds-component, /build-component 등
│   ├── hooks/         ← 시스템 가드레일 (보호·차단·경고)
│   └── skills/        ← 재사용 절차 라이브러리 (self-check 포함)
├── eval/              ← 하네스 회귀 추적 (Eval 채점기 + 기준선)
├── docs/
│   ├── qa-reports/    ← QA 결과 자동 저장
│   └── decisions/     ← ADR (수동)
└── src/
    ├── tokens/        ← 디자인 토큰 (보호됨)
    ├── components/
    │   ├── ui/        ← shadcn 원본 (손대지 마)
    │   └── {Name}/    ← 사용자용 래퍼
    └── wireframes/    ← 회색만 허용
```

---

## 🛡️ 자동 가드레일

훅 4개가 백그라운드에서 작동합니다:

| 훅 | 역할 |
|---|---|
| `protect-files.mjs` | 토큰·shadcn 원본·`.claude/` 직접 수정 차단 |
| `detect-hardcoded.mjs` | hex 컬러, Tailwind 단축 클래스, px 단위 차단 |
| `enforce-grayscale.mjs` | 와이어프레임에서 색상 토큰 사용 차단 |
| `check-a11y-attrs.mjs` | aria-label, alt 누락 경고 (차단 X) |

훅을 우회해야 하는 정당한 경우(예: 새 토큰 추가)는 전용 커맨드가 sentinel을 만들어 5분간 우회 허용.

---

## 🔧 요구사항

- Node.js 20+
- macOS 또는 Linux (Windows는 WSL 권장)
- (선택) Figma 계정 + MCP 인증 — Figma 연동 시

---

## 📚 더 알아보기

- `CHANGELOG.md` — 버전별 변경 이력
- `docs/manual/harness-core-manual-v0.6.0.pdf` — 전체 사용 매뉴얼 (PDF)
- `docs/manual/walkthrough.md` — 실전 워크스루 (/init부터 첫 컴포넌트까지)
- `.claude/agents/` — 에이전트 12종 정의 (역할·절차, Figma 빌더 + Figma QA + 화면설계서 포함)
- `.claude/skills/` — 스킬 7종 (재사용 절차 라이브러리)
- `.claude/commands/` — 커맨드 10종 레퍼런스
- `.claude/CLAUDE.md` — 프로젝트 헌법 (모든 에이전트가 읽음)

---

## 라이선스

MIT
