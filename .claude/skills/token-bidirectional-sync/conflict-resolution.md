# Token Conflict Resolution Workflow

> SKILL.md의 4단계(충돌 해결 UX)를 상세히 설명. 처음 동기화 시 또는 디버깅 시 참조.

## 충돌이 발생하는 경우

1. **디자이너가 Figma에서 토큰 값 수정** → 코드는 옛 값 유지
2. **개발자가 코드에서 토큰 직접 수정** → Figma는 옛 값 유지
3. **양쪽에서 동시에 다른 값으로 수정** — 가장 어려운 케이스
4. **반올림 오차** — 동일한 의도이지만 OKLCH 값이 미세하게 다름

## 우선순위 결정 트리

```
충돌 발견
   ↓
프로젝트의 정책은? (PROJECT.md에 명시되어 있어야 함)
   ↓
   ├─ "Figma가 source of truth" → 자동 F (단, 사용자 컨펌 1회)
   ├─ "Code가 source of truth" → 자동 C
   └─ "케이스별 결정" → 매번 사용자 선택 (기본값)
```

PROJECT.md에 아래 라인 권장:
```markdown
## 토큰 동기화 정책
- 진실의 원천: {Figma | Code | Case-by-case}
```

## 케이스별 해결 가이드

### Case 1: Figma만 새로운 토큰 추가 (FIGMA_ONLY)

가장 흔한 케이스. 디자이너가 새 컬러/사이즈를 정의함.

**기본 액션**: 코드에 자동 추가. 단, 사용자에게 확인:

```
➕ Figma에 새 토큰 발견 (코드에는 없음):
   --color-accent-500 = oklch(0.65 0.18 320)

   [Y] 코드에 추가
   [N] 무시 (다음 동기화에서 다시 물음)
   [I] 영구 무시 (.claude/.token-ignore에 추가)
```

### Case 2: 코드만 토큰 보유 (CODE_ONLY)

두 가지 가능성:
- (a) 개발자가 임시로 추가했고 Figma에 반영 안 됨 → Figma에 추가 요청
- (b) Deprecated된 토큰 → 코드에서 삭제 필요

판별 방법: 그 토큰이 코드베이스에서 **사용되고 있는지** 확인:

```bash
grep -rE "var\(--color-old-deprecated-500\)" src/components/ src/wireframes/
```

- 사용 중 → (a) Figma에 추가 요청
- 사용 안 함 → (b) 삭제 제안

```
➖ 코드에만 있는 토큰: --color-old-deprecated-500
   사용처: 0개 발견

   [D] 삭제 (코드에서 제거)
   [M] Figma에 추가 요청 메모 (manual action 섹션에 기록)
   [S] 건너뛰기
```

### Case 3: 값 충돌 (CONFLICT)

가장 신중하게 처리.

```
⚠️ 값 충돌: --color-brand-500
   Figma:  oklch(0.58 0.20 260)
   코드:    oklch(0.60 0.22 260)
   거리:    0.024

   언제 마지막 수정?
   - Figma: (MCP가 timestamp 제공하면 표시)
   - 코드: (git blame으로 확인)

   [F] Figma 채택 → 코드를 Figma 값으로 갱신
   [C] 코드 채택 → 디자이너에게 Figma 수동 변경 요청 메모
   [N] 새 값 직접 입력 (예: oklch(0.59 0.21 260))
   [S] 건너뛰기 (다음 동기화로 미룸 — 충돌은 그대로 남음)
```

### Case 4: 미세 오차 (MINOR_DRIFT, 거리 < 0.02)

자동 처리 가능하지만 그래도 알림:

```
💡 미세 차이: --color-brand-500
   Figma:  oklch(0.580 0.190 260.0)
   코드:    oklch(0.581 0.190 260.0)
   거리:    0.001 (반올림 오차 추정)

   [Y] Figma 값으로 통일 (권장)
   [S] 건너뛰기
```

기본값은 Y. 사용자가 따로 응답 안 하면 자동 진행.

## Bulk 처리

충돌이 5개 이상이면 일괄 모드 권장:

```
충돌 5개 발견. 일괄 처리 옵션:
   [FA] 모두 Figma 채택
   [CA] 모두 코드 채택
   [IN] 한 건씩 확인 (기본)
```

단, 일괄 모드 사용 시 리포트에 반드시 명시.

## 백업 정책

토큰 파일을 수정하기 전 항상 백업:

```bash
mkdir -p .claude/.backups
cp -r src/tokens .claude/.backups/tokens-$(date +%Y%m%d-%H%M%S)
```

`.claude/.backups/`는 `.gitignore`에 포함되어야 함.

## 실패 시 롤백

```bash
# 최근 백업 복원
LATEST=$(ls -t .claude/.backups/ | head -1)
node -e "require('fs').rmSync('src/tokens',{recursive:true,force:true})"  # rm 금지 → node
cp -r .claude/.backups/$LATEST src/tokens
```

## 디자이너 커뮤니케이션

코드 → Figma 방향이 필요할 때, 자동 처리 불가하므로 안내문 출력:

```
📋 디자이너에게 전달할 변경사항

다음을 Figma Variables에서 수동으로 변경해주세요:

1. Color/Brand/500
   현재: oklch(0.58 0.20 260) (= #3b82f6)
   변경: oklch(0.60 0.22 260) (= #3b87fb)

2. Spacing/128 (새 토큰 추가)
   값: 8rem (128px)

변경 후 /ds-token을 다시 실행해주세요.
```
