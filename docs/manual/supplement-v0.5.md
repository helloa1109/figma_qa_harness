# Harness Core 매뉴얼 보충 — v0.4 ~ v0.5

> 이 문서는 **v0.3.3 사용 매뉴얼**에 추가되는 보충판이다.
> v0.3.3 이후 바뀐 것(가드 정합성 수정 + **write-capable Figma 빌더** + **Figma QA**)과
> 그에 따른 **프로세스**를 다룬다. 본문 04장(일상 사용법)·06장(구조)·07장(한계)을 보강한다.
>
> 적용 버전: **v0.5.0** (2026-06-08) · 이전 매뉴얼: v0.3.3

---

## 0. 한눈에 — 무엇이 바뀌었나

| 버전 | 핵심 | 한 줄 |
|---|---|---|
| **v0.3.3** | 가드 정합성 수정 | 훅이 Edit에서 안 돌던 배선 누락(matcher) 수정 + 훅 회귀 테스트 14→26 |
| **v0.4.0** | write-capable Figma 빌더 | Figma에 컴포넌트·토큰을 **실제로 생성**(MCP write) |
| **v0.5.0** | Figma QA 커버리지 | Figma **화면(와이어) 리뷰** + Figma↔코드 **스크린샷 비교** |

### 구성 변화 (FIG 0 갱신)

```
v0.3.3              →   v0.5.0
8 에이전트              11 에이전트   (+ds-figma-component-builder, +ds-figma-token-builder, +qa-figma-wireframe)
6 커맨드               9 커맨드     (+/build-component, +/figma-tokens, +/qa-figma-wireframe)
5 훅                  5 훅        (변화 없음 — 배선만 수정)
6 스킬                6 스킬       (변화 없음)
```

> **KEY INSIGHT**
> v0.3.3까지 core의 전제는 "Figma MCP는 **read-only**"였다. v0.4부터 이 전제가 **조건부**로 바뀐다 —
> write 가능한 Figma 플러그인 MCP(`use_figma`)가 붙어 있으면 Figma에 **직접 생성**하고, 없으면 기존 read-only
> 동작(스펙시트·비교)으로 **폴백**한다. 같은 하네스가 두 환경 모두를 커버한다.

---

## 1. 두 갈래 트랙 모델 (핵심 개념)

v0.4부터 작업은 **코드 트랙**과 **Figma 트랙**으로 나뉜다. 둘은 `/ds-token`에서 만난다.

```
                         PROJECT.md (브랜드색·폰트·Figma키·톤)
                                      │
                                  /init  → src/tokens/*.css + DESIGN.md
                                      │
        ┌─────────────────────────────┴─────────────────────────────┐
   [코드 트랙]                                                   [Figma 트랙]  ※write MCP 필요
   코드가 출발                                                    Figma가 출발/타깃
        │                                                             │
  /ds-component <이름>                                          /figma-tokens [종류]
   → shadcn 설치 + cva 래퍼 + 스토리                              → Figma Variables 생성 + swatch 검증
        │                                                       /build-component <이름>
        │                                                       → Component Set + Property Table 생성
        └─────────────────────────────┬─────────────────────────────┘
                                      │
                               /ds-token  (코드 ↔ Figma 양방향 동기화)
                                      │
                            /qa · /qa-a11y · /qa-figma-wireframe
                                      │
                          self-check → pnpm eval (하네스 회귀 점검)
```

> **FIG 1 · TWO-TRACK MODEL**
> 코드에서 시작하든(/ds-component) Figma에서 시작하든(/build-component) 결국 `/ds-token`이 둘을 맞춘다.
> 어느 트랙이 "진실의 원천"인지는 프로젝트가 정한다.

---

## 2. 명령어 표 갱신 (본문 04장 보강)

| 명령 | 트랙 | 역할 | 전제 |
|---|---|---|---|
| `/init` | 코드 | 프로젝트 부트스트랩 — 브랜드색 → 토큰 생성 (한 번만) | — |
| `/ds-component <이름>` | 코드 | shadcn 받아서 디자인시스템 래퍼(cva) 생성 | — |
| `/wireframe <이름>` | 코드 | 회색 5단계 와이어프레임 화면 생성 | — |
| **`/build-component <이름>`** 🆕 | **Figma** | **Figma에 Component Set + Property Table 생성** | write Figma MCP |
| **`/figma-tokens [종류]`** 🆕 | **Figma** | **Figma에 Variables(멀티모드) 생성** | write Figma MCP |
| `/ds-token` | 동기화 | Figma Variables ↔ 코드 토큰 양방향 비교·해결 | read Figma MCP |
| `/qa` | 검증 | 전체 QA (디자인시스템 + a11y + 코드 와이어) | — (Figma 키 있으면 스크린샷 비교 추가) |
| `/qa-a11y` | 검증 | 접근성만 단독 — 더 빠름 | — |
| **`/qa-figma-wireframe <화면>`** 🆕 | **검증** | **Figma 화면 frame 검증** | read Figma MCP |
| `pnpm eval` | 회귀 | 하네스 회귀 추적 — 기준선 대비 점수 변화 | — |
| `pnpm test:hooks` | 회귀 | 훅 가드 회귀 테스트 — **26 케이스(v0.5)** | — |

---

## 3. Figma 토큰 생성 — `/figma-tokens` (신규)

코드 토큰을 Figma Variables로 **실제로 만든다.** 담당 에이전트: `ds-figma-token-builder`.

> ⚠️ **core의 토큰 명령 3종 구분** — 방향이 다르다.
> - `/init` : 브랜드색 → **코드** `src/tokens/*.css` (ds-token-builder)
> - `/ds-token` : 코드 ↔ Figma **양방향 비교(read)** (ds-token-syncer)
> - **`/figma-tokens` : Figma에 Variables **write 생성** (ds-figma-token-builder)

### 프로세스

```
/figma-tokens 전체
 1  DESIGN.md/PROJECT.md 읽기 + (권장) src/tokens/*.css 읽어 명명 일치
 2  whoami 인증·플랜 확인 (Starter=모드1개, Pro+=multi-mode)
 3  기존 컬렉션·변수 조회 (같은 이름은 수정, 중복 생성 금지)
 4  use_figma로 변수 생성 (컬렉션 1개=1종류, 모드 묶음, ~24개씩 분할)
 5  swatch/preview frame 생성 (Dark면 비교 frame + Dark 강제)
 6  get_screenshot 시각 검증
 7  컬렉션·변수 표로 보고 → 다음: /ds-token, /qa-a11y
```

### Figma Variable 명명 = 코드 CSS와 1:1

| 코드 (CSS) | Figma Variable | 비고 |
|---|---|---|
| `--color-brand-500` | `brand/500` | 스케일 50~900 |
| `--color-neutral-100` | `neutral/100` | 0~900 |
| `--color-primary` / `--color-danger` | `primary` / `danger` | **시맨틱 alias 우선** |
| `--space-md` | `space/md` | gap/padding |
| `--radius-md` | `radius/md` | corner |
| `--font-size-base` | `font-size/base` | |
| `--font-sans` | `font/sans` | |

- 컬렉션: `Colors` / `Typography` / `Spacing` / `Radius` (1컬렉션 = 1종류)
- 스코프 명시 필수 (`ALL_SCOPES` 금지) — 컬러 `["ALL_FILLS","STROKE_COLOR","EFFECT_COLOR"]` 등
- 모드: Brand는 Light/Dark 동일, Neutral은 반전, Semantic은 한 단계 밝게

---

## 4. Figma 컴포넌트 생성 — `/build-component` (신규)

Figma에 Component Set과 Property Table 문서까지 **실제로 만든다.** 담당: `ds-figma-component-builder`.

### 산출물 (항상 2개 함께)
1. **Component Set** — 개발자가 instance로 쓰는 본체 (variants 격자)
2. **`<Name> — Documentation` frame** — 축 라벨 + 점선 격자 + 셀별 instance + Ready-made examples

### 프로세스

```
/build-component Badge
 1  DESIGN.md/PROJECT.md 읽기 (페이지 ID·토큰·컨벤션)
 2  use_figma 호출 시 skillNames "figma-use,figma-generate-library" 로드
 3  기존 컴포넌트·변수 조회 (같은 이름 있으면 수정 모드)
 4  (선택) src/components/{Name}/ 의 cva variants 참조 → Figma variant 이름 일치
 5  incremental 빌드: default 1개 → clone로 variants → combineAsVariants
 6  토큰 alias 바인딩 (setBoundVariableForPaint / setBoundVariable) — raw 값 금지
 7  Property Table documentation frame 생성
 8  get_screenshot 시각 검증 (Set + Documentation 둘 다)
 9  노드 ID + 토큰 매핑표 보고 → 다음: /ds-component(코드 구현), /qa
```

### 안전·정밀 규칙 (포팅 시 보존된 것)
- **좌표 충돌 방지**: 신규 frame은 기존 frame들의 `max(x+width) + 200`에 배치
- **line-height 함정**: Figma number variable은 PIXELS 해석 → lineHeight는 변수 바인딩 금지, `{unit:"PERCENT", value:120/150/175}` 직접 입력
- **페이지 분리**: Component Set은 `Components` 페이지, 문서는 `Documentation` 페이지
- **코드(`src/`)·`.claude/` 절대 안 건드림** — Figma만 write

> **KEY INSIGHT**
> `/build-component`는 Figma를 만들고, `/ds-component`는 코드를 만든다. 보통
> `/build-component Badge` → (디자인 확인) → `/ds-component Badge` 순으로 이어
> Figma 본과 코드 래퍼의 variant 이름을 일치시킨다.

---

## 5. Figma 화면 QA — `/qa-figma-wireframe` (신규)

core는 그동안 **코드** 와이어(`src/wireframes/`)만 검증했다. v0.5부터 **Figma에 그려진 화면 frame**도 검증한다. 담당: `qa-figma-wireframe`.

> ⚠️ **대상 구분**
> - `/qa wireframe` : **코드** `src/wireframes/{Name}/` (React, grep, 그레이스케일 강제)
> - **`/qa-figma-wireframe`** : **Figma** 화면 frame (read-only MCP, 레이아웃·SafeArea·CTA)

### 프로세스

```
/qa-figma-wireframe Login
 1  DESIGN.md/PROJECT.md 읽기 (토큰·컨벤션·Wireframes 페이지 ID)  ※상대경로
 2  frame get_metadata + get_design_context + get_screenshot 수집
 3  Critical/High/Medium/Low 체크리스트 검증
 4  docs/qa-reports/QA-Figma-Wireframe-{화면}-{날짜}.md 작성
 5  대화창엔 요약 + 리포트 경로 (CRITICAL 우선)
```

### 체크리스트 (요약)
- **Critical**: 레이아웃 깨짐 없음 · line-height PERCENT · 모바일 SafeArea(top~44/bottom~34) · 모든 child가 frame 안
- **High**: CTA 1개 명확 · 1화면 1메시지 · 타이포 위계 · 아이콘 버튼 접근 이름
- **Medium**: instance variant 적절 · 간격 토큰(`space/*`) · 카피 톤 · 비표준 컴포넌트 X
- **Low**: 다크모드 · 여백 균형 · placeholder

---

## 6. `/qa` 보강 — Figma↔코드 스크린샷 비교 (v0.5)

`qa-design-system`의 Figma 정합성 단계가 **노드 이름 매칭 → 실제 렌더 비교**로 깊어졌다.

```
/qa  (Figma 키가 PROJECT.md에 있을 때)
 …
 5    Figma 컴포넌트 노드 목록 ↔ 코드 컴포넌트 목록 1:1 매칭
 5-b  [신규] Figma 원본 get_screenshot ↔ 코드 렌더(Storybook 캡처) 나란히 비교
       → 컬러·간격·라운드·그림자·정렬의 실제 차이를 리포트에 "Figma vs 코드" 표 + 스크린샷 2장
 …
```

Figma 키/MCP 없으면 5·5-b 모두 skip하고 코드 구조 검사만 진행한다.

---

## 7. 가드 정합성 수정 (v0.3.3, 이 빌드에 포함)

### 무엇이 문제였나
훅 코드는 Edit/MultiEdit를 읽도록 고쳤지만, `settings.json`의 **PostToolUse matcher가 `"Write"`뿐**이라
컴포넌트를 **Edit으로 수정할 때 a11y 가드가 통째로 우회**됐다. 회귀 테스트는 훅을 직접 호출(matcher 게이트 우회)해
통과해버려 "거짓 안심"을 줬다.

### 수정
- Pre/PostToolUse matcher를 모두 **`"Write|Edit|MultiEdit"`**로 명시
- **훅 회귀 테스트가 `settings.json` 배선까지 검증** → "훅 코드는 Edit를 읽는데 matcher는 Write뿐" 같은 불일치를 잡음
- 케이스 **14 → 26**

```
pnpm test:hooks      # 26 pass — 훅 동작 + settings.json matcher 배선 검증
```

> **왜 중요한가**
> 하네스의 본질은 "가드레일이 실수를 원천 차단"이다. 그 가드 중 하나가 수정 작업에서 안 도는데
> 테스트는 green이면 신뢰할 수 없다. 이제 테스트가 **코드와 배선의 불일치**까지 잡는다.

---

## 8. 한계 갱신 (본문 07장 대체)

### ~~Figma MCP는 read-only~~ → **read-only가 기본, write는 조건부**
v0.4부터 write-capable Figma 플러그인 MCP(`use_figma`)가 연결돼 있으면 Figma에 컴포넌트·토큰을 직접 생성한다.
연결돼 있지 않으면 기존처럼 read-only로 폴백한다.

| 환경 | 컴포넌트 | 토큰 | Figma 화면 QA |
|---|---|---|---|
| **write MCP 있음** | `/build-component` (실제 생성) | `/figma-tokens` (실제 생성) | `/qa-figma-wireframe` |
| **read MCP만** | `ds-component-builder` (스펙시트) | `/ds-token` (비교) | `/qa-figma-wireframe` (가능) |
| **Figma 없음** | 코드만 (`/ds-component`) | 코드만 (`/init`) | `/qa wireframe` (코드) |

### 여전히 남은 한계
- **와이어 → 디자인 자동 변환은 없음** (의도적, 사람 판단 영역)
- **Eval은 가벼운 정적 채점** (확률적 성공률 미측정)
- **APCA 미지원** (WCAG 2.2만)
- **Windows 미지원** (WSL 권장)
- **검증 범위 밖**: write Figma MCP 실연결 시의 라이브 생성은 사용자 환경(Figma 유료 + 플러그인)에서 확인 필요. 파일 정합성·eval·hook-regression은 자동 검증됨.

---

## 9. Figma 트랙을 쓰기 위한 전제 (체크리스트)

`/build-component`·`/figma-tokens`·`/qa-figma-wireframe`를 실제로 돌리려면:

- [ ] **Figma 유료 계정** (MCP 인증에 필요)
- [ ] **write-capable Figma 플러그인 MCP(`use_figma`) 연결** (부록 A-2 절차)
- [ ] **PROJECT.md 작성** — 특히 `Figma 파일 키` + 페이지 ID(Foundations/Components/Documentation/Wireframes)
- [ ] read 전용 작업(`/ds-token`, `/qa-figma-wireframe`)은 read MCP만 있어도 동작

이 중 하나라도 없으면 에이전트는 안내 메시지를 출력하고 **폴백 경로**로 돌린다 (스펙시트·비교·코드 검증).

---

## 10. 갱신된 일상 흐름 예시 (Figma 트랙 포함)

```
1  PROJECT.md 작성 (브랜드색·폰트·Figma키·톤)        ← 프로젝트마다 1회
2  /init                  토큰 + DESIGN.md
3  /figma-tokens 전체       Figma에 Variables 생성        (write MCP)
4  /build-component Badge   Figma에 컴포넌트 + 문서 생성    (write MCP)
5  /ds-component Badge      코드 래퍼(cva) + 스토리
6  /ds-token               코드 ↔ Figma 동기화
7  /qa  ·  /qa-figma-wireframe Login   검증
8  self-check → pnpm eval   하네스 회귀 점검
```

> 이 매뉴얼 보충판은 **v0.5.0** 기준이다. 전체 변경 이력은 `CHANGELOG.md`,
> 에이전트·커맨드 정의는 `.claude/agents/`·`.claude/commands/`에서 확인한다.
