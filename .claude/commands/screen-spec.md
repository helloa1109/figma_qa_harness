---
description: 화면설계서(인터랙션 명세)를 Figma에 생성 (screen-spec-builder 위임). 회색 와이어 다음 단계. write Figma MCP 필요(없으면 코드/HTML 스펙시트 폴백).
---

`screen-spec-builder` 에이전트를 호출하여 **화면설계서**(인터랙션 명세)를 생성하세요.

## 위치
```
/wireframe <화면>      회색 정보구조 (무엇이 어디에)
      ↓ 다음 단계
/screen-spec <화면>    인터랙션 명세 (무엇을 누르면 어떻게) + 흐름 + Screen ID + Description 표
```

## 전제
- write 가능한 Figma MCP(`use_figma`) 연결 권장. 없으면 코드/HTML 스펙시트로 폴백.
- 양식·색·ID 포맷은 `screen-spec-template` 스킬에 **고정**돼 있음(매번 안 물음).
- (선택) PROJECT.md `## 화면설계서` 섹션에 Screen ID 포맷·Spec 페이지 ID를 채우면 더 정확.

## 사용법
```
/screen-spec <화면명> [플로우/케이스]
```
### 예시
- `/screen-spec 상품옵션선택`
- `/screen-spec 상품옵션선택 "홈>상품상세>바텀시트 옵션선택, 옵션선택→사이즈→담기"`

## 작업 절차 (에이전트가 수행)
1. screen-spec-template 스킬 + DESIGN.md(컴포넌트 카탈로그)·PROJECT.md 로드
2. **이번 화면만 1회 확인** (플로우 스텝·Application to) — 양식은 안 물음
3. Screen ID 생성(추론, 애매하면 1회 질문)
4. 메타 헤더 + 폰 목업 흐름(DS 컴포넌트 재사용) + 오렌지 콜아웃 + Description 표
5. get_screenshot 검증 → 노드 ID 보고

## 색 규칙 (고정)
오렌지=콜아웃·화살표 · 초록=`※`참조주 · 블루=인터랙션점 · 핑크=APP · 탄=MOBILE WEB · 회색=목업.
목업은 회색만, 주석만 색.

## 다음 단계 (체이닝)
- `/ds-component <필요 컴포넌트>` — 명세에 쓴 컴포넌트가 코드에 없을 때
- `/qa-figma-wireframe <화면>` — 화면 레이아웃 검증
