---
description: Figma에 디자인 토큰(Variables) 실제 생성 (ds-figma-token-builder 위임). write-capable Figma MCP 필요.
---

`ds-figma-token-builder` 에이전트를 호출하여 Figma에 디자인 토큰(Variables)을 생성하세요.

## 전제
- **write-capable Figma plugin MCP(`use_figma`)가 연결돼 있어야 합니다.**
- 없으면: 코드↔Figma 비교는 `/ds-token`, 브랜드색→CSS 생성은 `/init`으로 안내하세요.

## core 토큰 명령 구분 (헷갈리지 말 것)
| 명령 | 방향 | 담당 에이전트 |
|---|---|---|
| `/init` | 브랜드색 → **코드** `src/tokens/*.css` 생성 | ds-token-builder |
| `/ds-token` | 코드 ↔ Figma **양방향 비교(read-only)** | ds-token-syncer |
| **`/figma-tokens`** | **Figma에 Variables write 생성** | ds-figma-token-builder |

## 사용법
```
/figma-tokens [컬러|타이포|스페이싱|라디우스|전체] [Figma 파일/페이지]
```
### 예시
- `/figma-tokens 전체` — Colors/Typography/Spacing/Radius 컬렉션 생성
- `/figma-tokens 컬러` — 컬러 컬렉션만 (brand 50~900 + neutral + semantic)

## 작업 절차 (에이전트가 수행)
1. DESIGN.md/PROJECT.md 읽기 + (권장) `src/tokens/*.css` 읽어 명명 일치
2. 기존 컬렉션·변수 조회 (중복은 수정)
3. use_figma로 변수 생성 (컬렉션 1개=1종류, 모드 묶음, ~24개씩)
4. swatch/preview frame 생성 (Dark면 비교 frame + Dark 강제)
5. screenshot 시각 검증
6. 컬렉션·변수 표로 보고

## 다음 단계 (체이닝)
- `/ds-token` → 코드(`src/tokens/*.css`)와 양방향 동기화
- `/qa-a11y` → 생성 컬러쌍 WCAG/다크 동등성 검사
