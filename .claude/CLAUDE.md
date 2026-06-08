# Constitution

디자인 시스템 자동화 하네스. Figma MCP + shadcn.

## Rules
- 작업 전 `PROJECT.md` + `DESIGN.md` 읽기
- shadcn 원본(`src/components/ui/`) 손대지 말 것
- 노출 컴포넌트는 `src/components/{Name}/`
- 토큰·하드코딩은 훅이 자동 차단
- QA 결과는 `docs/qa-reports/`
- 완료 선언 전 `pnpm eval` 통과 확인 (self-check 스킬)
- 큰 작업은 agents 위임
- 임시파일·sentinel 정리는 항상 `node`로 (`rm` 금지 — settings가 `Bash(rm:*)` deny)
- 에이전트 완료 보고의 "다음 단계"는 커맨드 .md의 고정 메뉴만 제시 (임의 명령 생성 금지)
