#!/usr/bin/env bash
set -euo pipefail

# ============================================================
#  Harness Core — Mac/Linux 자동 셋업 스크립트
#
#  하는 일:
#    1. pnpm 없으면 설치
#    2. pnpm install (모든 의존성)
#    3. Playwright 브라우저 설치
#    4. 셋업 완료 안내
#
#  사용법: bash INSTALL.sh
# ============================================================

# 색상 코드
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
RESET='\033[0m'

info()    { echo -e "${BLUE}ℹ${RESET}  $1"; }
success() { echo -e "${GREEN}✓${RESET}  $1"; }
warn()    { echo -e "${YELLOW}⚠${RESET}  $1"; }
error()   { echo -e "${RED}✗${RESET}  $1" >&2; }

# ──────────────────────────────────────────────────
# Step 0: 사전 체크
# ──────────────────────────────────────────────────
info "환경 체크 중..."

# Node.js 체크 (>= 20)
if ! command -v node &> /dev/null; then
  error "Node.js가 설치돼 있지 않습니다. https://nodejs.org 에서 v20+ 설치 후 다시 실행하세요."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Node.js v20 이상이 필요합니다. 현재: $(node -v)"
  exit 1
fi
success "Node.js $(node -v) 확인"

# ──────────────────────────────────────────────────
# Step 1: pnpm 설치
# ──────────────────────────────────────────────────
if ! command -v pnpm &> /dev/null; then
  info "pnpm이 없습니다. 설치 중..."
  npm install -g pnpm
  success "pnpm 설치 완료"
else
  success "pnpm $(pnpm -v) 확인"
fi

# ──────────────────────────────────────────────────
# Step 2: 의존성 설치
# ──────────────────────────────────────────────────
info "pnpm install 실행 중... (1~3분 소요)"
pnpm install
success "의존성 설치 완료"

# ──────────────────────────────────────────────────
# Step 3: Playwright 브라우저 설치 (e2e 테스트용)
# ──────────────────────────────────────────────────
info "Playwright 브라우저 설치 중..."
pnpm exec playwright install --with-deps chromium 2>/dev/null || {
  warn "Playwright 브라우저 설치 실패 — 나중에 'pnpm exec playwright install' 수동 실행하세요."
}

# ──────────────────────────────────────────────────
# Step 4: 안내
# ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo -e "${GREEN}  🎉 Harness Core 셋업 완료${RESET}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${RESET}"
echo ""
echo "다음 단계:"
echo ""
echo -e "  ${YELLOW}1.${RESET} ${BLUE}PROJECT.md${RESET} 를 열어 본인 프로젝트 정보로 채우세요"
echo -e "     (브랜드 컬러, 폰트, 톤 등 — 5분이면 충분)"
echo ""
echo -e "  ${YELLOW}2.${RESET} Claude Code 대화창에서 ${BLUE}/mcp${RESET} 입력 → Figma MCP 인증"
echo -e "     (선택. Figma 없이도 코드 작업은 가능합니다)"
echo ""
echo -e "  ${YELLOW}3.${RESET} Claude Code에서 ${BLUE}/init${RESET} 실행"
echo -e "     → 토큰 자동 생성, DESIGN.md 자동 작성"
echo -e "     (Step 2부터 사용 가능. Step 1 = 골격까지)"
echo ""
echo -e "  ${YELLOW}4.${RESET} ${BLUE}pnpm dev${RESET} 로 개발 서버 실행, ${BLUE}pnpm storybook${RESET} 으로 컴포넌트 카탈로그"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${RESET}"
