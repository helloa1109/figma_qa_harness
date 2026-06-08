#!/usr/bin/env node
/**
 * PreToolUse 훅: 와이어프레임(src/wireframes/)에서 회색 외 색상 차단
 *
 * 차단: 시맨틱 색 토큰, 헥스, Tailwind 유채색 단축 클래스.
 * 허용: var(--color-neutral-*) 회색만. 강조는 typography로.
 *
 * Write(content)·Edit(new_string)·MultiEdit 모두 검사. 패턴은 _shared.mjs 단일 소스.
 */

import { readFileSync } from "node:fs";
import {
  extractContent, extractPath, isWriteEdit, blockDecision,
  hexRe, twChromaticRe, semanticTokenRe,
} from "./_shared.mjs";

try {
  const input = JSON.parse(readFileSync(0, "utf-8"));
  const toolName = input.tool_name || "";
  const toolInput = input.tool_input || {};
  const filePath = extractPath(toolInput);

  if (!isWriteEdit(toolName)) process.exit(0);
  if (!filePath.includes("src/wireframes/")) process.exit(0);

  const content = extractContent(toolInput);
  if (!content) process.exit(0);

  const checks = [
    { re: semanticTokenRe(), msg: "와이어프레임에서 시맨틱 컬러 토큰 사용 금지" },
    { re: hexRe(), msg: "와이어프레임에서 헥스 컬러 사용 금지" },
    { re: twChromaticRe(), msg: "와이어프레임에서 Tailwind 유채색 단축 클래스 금지" },
  ];

  for (const { re, msg } of checks) {
    re.lastIndex = 0;
    const match = re.exec(content);
    if (match) {
      blockDecision(
        `⚫ ${msg}\n발견: "${match[0]}"\n` +
        `→ 와이어프레임은 var(--color-neutral-*)만 허용 (0/100/300/500/900).\n` +
        `→ 강조는 typography weight/size로 표현하세요.`,
      );
    }
  }
  process.exit(0);
} catch (err) {
  console.error(`[enforce-grayscale] hook error: ${err.message}`);
  process.exit(0);
}
