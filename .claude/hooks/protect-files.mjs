#!/usr/bin/env node
/**
 * PreToolUse 훅: 보호된 경로 직접 수정 차단
 *
 * 보호 경로 (경계 매칭 — 부분 문자열 오탐 방지):
 *   - src/tokens/              ← /ds-token 으로만 (sentinel 우회)
 *   - .claude/agents/, .claude/hooks/, .claude/settings.json ← 수동만
 *
 * 주의: src/components/ui/ 는 settings.json의 deny(Write/Edit) 가 전담한다.
 *   shadcn 원본은 `pnpm dlx`(Bash)로 설치되어 Write/Edit 훅을 거치지 않으므로,
 *   여기서 sentinel로 열어주려 해도 의미가 없어 분기를 제거했다. (v0.3.3)
 *
 * sentinel(.claude/.ds-token-active)이 5분 이내면 src/tokens/ 우회 허용.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { extractPath, isWriteEdit } from "./_shared.mjs";

const PROTECTED = [
  { path: "src/tokens/",          sentinel: ".claude/.ds-token-active" },
  { path: ".claude/agents/",      sentinel: null },
  { path: ".claude/hooks/",       sentinel: null },
  { path: ".claude/settings.json", sentinel: null },
];

const SENTINEL_TTL_MS = 5 * 60 * 1000;

function sentinelFresh(p) {
  if (!p || !existsSync(p)) return false;
  return Date.now() - statSync(p).mtimeMs < SENTINEL_TTL_MS;
}

// 경계 매칭: 경로 세그먼트 단위로 prefix 포함 여부 확인.
// "docs/src/tokens/x"는 src/tokens/ 로 시작하지 않으므로 오탐 안 함.
// "src/tokens-backup/"도 "src/tokens/" 와 세그먼트가 달라 오탐 안 함.
function pathMatches(filePath, protectedPath) {
  // 선행 ./ 제거 후 정규화
  const norm = filePath.replace(/^\.\//, "");
  if (protectedPath.endsWith("/")) {
    return norm === protectedPath.slice(0, -1) || norm.startsWith(protectedPath);
  }
  return norm === protectedPath;
}

try {
  const input = JSON.parse(readFileSync(0, "utf-8"));
  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};
  const filePath = extractPath(toolInput);

  if (!isWriteEdit(toolName)) process.exit(0);

  for (const { path: pp, sentinel } of PROTECTED) {
    if (!pathMatches(filePath, pp)) continue;
    if (sentinel && sentinelFresh(sentinel)) process.exit(0); // 우회 허용

    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason:
          `🚫 보호된 경로(${pp})는 직접 수정할 수 없습니다.\n` +
          (sentinel
            ? `→ 전용 커맨드(/ds-token)로만 수정 가능합니다.`
            : `→ 사용자가 수동으로 수정해야 합니다.`),
      },
    }));
    process.exit(0);
  }
  process.exit(0);
} catch (err) {
  console.error(`[protect-files] hook error: ${err.message}`);
  process.exit(0);
}
