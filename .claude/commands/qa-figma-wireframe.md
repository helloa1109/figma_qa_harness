---
description: Figma에 그려진 화면(와이어프레임) frame 검증 (qa-figma-wireframe 위임). read 가능한 Figma MCP 필요.
---

`qa-figma-wireframe` 에이전트를 호출하여 Figma 화면 frame의 레이아웃·UX·a11y·컨벤션을 검증하세요.

## 전제
- read 가능한 Figma MCP(`get_metadata`/`get_design_context`/`get_screenshot`)가 연결돼 있어야 합니다.
- 없으면: **코드** 와이어 검증인 `/qa wireframe`(qa-wireframe)으로 안내하세요.

## 대상 구분 (헷갈리지 말 것)
| 명령 | 검증 대상 |
|---|---|
| `/qa wireframe` | **코드** `src/wireframes/{Name}/` (React) |
| **`/qa-figma-wireframe`** | **Figma** 화면 frame |

## 사용법
```
/qa-figma-wireframe <화면명 또는 Figma frame ID/URL>
```
### 예시
- `/qa-figma-wireframe Login`
- `/qa-figma-wireframe 224:108`

## 작업 절차 (에이전트가 수행)
1. DESIGN.md/PROJECT.md 읽기 (토큰·컨벤션·Wireframes 페이지 ID)
2. frame `get_metadata` + `get_design_context` + `get_screenshot` 수집
3. Critical/High/Medium/Low 체크리스트 검증
4. `docs/qa-reports/QA-Figma-Wireframe-{화면명}-{날짜}.md` 작성
5. 대화창엔 요약 + 리포트 경로 (CRITICAL 우선)

## 인자가 부족하면
- 화면 ID 없으면 Wireframes 페이지에서 후보를 보여주고 선택 요청
- PROJECT.md에 Figma 키/페이지 ID가 비어 있으면 채워달라고 안내 후 중단
