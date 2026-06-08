#!/usr/bin/env node
/**
 * hook-regression.mjs — 훅을 실제 Claude Code 입력 shape로 먹여보는 회귀 테스트.
 *
 * 왜: v0.3.2까지 훅이 Edit의 new_string을 안 읽어(new_str만 읽음) 모든 Edit 수정이
 *     가드를 통과하는 silent no-op 버그가 있었다. fixture가 토큰 파서를 지키듯,
 *     이 테스트가 훅을 지킨다. CI/`pnpm test:hooks`로 돌린다.
 *
 * 통과 기준: 위반 입력은 deny(또는 경고), 정상 입력은 통과. 도구 shape(Write/Edit/MultiEdit)에
 *     관계없이 동일하게 동작해야 한다.
 *
 * 추가(v0.3.3): 훅을 직접 호출하는 위 테스트는 settings.json의 matcher 게이트를 건너뛴다.
 *     그래서 "훅 코드는 Edit를 읽는데 matcher가 Write만 잡아 실제론 안 도는" 불일치를 못 본다
 *     (거짓 안심). 아래 SETTINGS WIRING 블록이 settings.json 배선까지 검증해 그 구멍을 막는다.
 */

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HOOKS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".claude", "hooks");

function runHookCaptureErr(file, payload) {
  const r = spawnSync("node", [path.join(HOOKS, file)], {
    input: JSON.stringify(payload), encoding: "utf8",
  });
  return { exit: r.status ?? 0, out: r.stdout || "", err: r.stderr || "" };
}

// PreToolUse 차단 판정: stdout에 permissionDecision":"deny"
const denied = (r) => /"permissionDecision"\s*:\s*"deny"/.test(r.out);
// PostToolUse 경고 판정: stderr에 경고 마커
const warned = (r) => /a11y 경고/.test(r.err);

const shapes = (file, content) => [
  { name: "Write(content)", payload: { tool_name: "Write", tool_input: { file_path: file, content } } },
  { name: "Edit(new_string)", payload: { tool_name: "Edit", tool_input: { file_path: file, new_string: content } } },
  { name: "MultiEdit(edits)", payload: { tool_name: "MultiEdit", tool_input: { file_path: file, edits: [{ new_string: content }] } } },
];

const cases = [];

// detect-hardcoded: 컴포넌트에 hex/색상클래스/px → 모든 shape에서 deny
for (const s of shapes("src/components/B/B.tsx", "className=\"bg-[#ff0000]\"")) {
  cases.push({ hook: "detect-hardcoded.mjs", ...s, expect: "deny" });
}
// detect-hardcoded: 정상 토큰 사용 → 통과
cases.push({
  hook: "detect-hardcoded.mjs", name: "정상(토큰)",
  payload: { tool_name: "Edit", tool_input: { file_path: "src/components/B/B.tsx", new_string: "bg-[var(--color-primary)]" } },
  expect: "pass",
});
// enforce-grayscale: 와이어프레임에 시맨틱색 → 모든 shape deny
for (const s of shapes("src/wireframes/L/L.tsx", "bg-[var(--color-brand-500)]")) {
  cases.push({ hook: "enforce-grayscale.mjs", ...s, expect: "deny" });
}
// enforce-grayscale: 회색만 → 통과
cases.push({
  hook: "enforce-grayscale.mjs", name: "정상(neutral)",
  payload: { tool_name: "Edit", tool_input: { file_path: "src/wireframes/L/L.tsx", new_string: "bg-[var(--color-neutral-0)]" } },
  expect: "pass",
});
// protect-files: 보호경로 deny / 유사경로 통과
cases.push({ hook: "protect-files.mjs", name: "src/tokens/ 차단",
  payload: { tool_name: "Write", tool_input: { file_path: "src/tokens/colors.css" } }, expect: "deny" });
cases.push({ hook: "protect-files.mjs", name: "tokens-backup 오탐없음",
  payload: { tool_name: "Write", tool_input: { file_path: "src/tokens-backup/x.css" } }, expect: "pass" });
cases.push({ hook: "protect-files.mjs", name: "docs/src/tokens 오탐없음",
  payload: { tool_name: "Write", tool_input: { file_path: "docs/src/tokens/x.md" } }, expect: "pass" });
// check-a11y-attrs (PostToolUse 경고): img no alt → 모든 shape에서 경고
for (const s of shapes("src/components/B/B.tsx", "<img src=\"x.png\" />")) {
  cases.push({ hook: "check-a11y-attrs.mjs", ...s, expect: "warn" });
}

let pass = 0, fail = 0;
const fails = [];
for (const c of cases) {
  const r = runHookCaptureErr(c.hook, c.payload);
  let ok;
  if (c.expect === "deny") ok = denied(r);
  else if (c.expect === "warn") ok = warned(r);
  else ok = !denied(r) && !warned(r);
  if (ok) pass++;
  else { fail++; fails.push(`${c.hook} [${c.name}] expect=${c.expect}`); }
}

// ── SETTINGS WIRING: settings.json matcher가 쓰기 계열 도구 셋을 다 잡는지 ──
// 쓰기 입력(Write/Edit/MultiEdit)을 검사하는 훅은 셋 모두에 매칭되는 matcher에 걸려야 한다.
// 하나라도 빠지면 그 도구로 한 수정은 가드를 통째로 우회한다(예: PostToolUse "Write"는 Edit를 놓침).
const WRITE_TOOLS = ["Write", "Edit", "MultiEdit"];
const WRITE_EDIT_HOOKS = [
  "protect-files.mjs", "detect-hardcoded.mjs", "enforce-grayscale.mjs", "check-a11y-attrs.mjs",
];
try {
  const settings = JSON.parse(readFileSync(path.join(HOOKS, "..", "settings.json"), "utf8"));
  for (const event of ["PreToolUse", "PostToolUse"]) {
    for (const entry of settings.hooks?.[event] || []) {
      const re = new RegExp(entry.matcher || ".*");
      for (const h of entry.hooks || []) {
        const file = (h.command || "").split("/").pop();
        if (!WRITE_EDIT_HOOKS.includes(file)) continue;
        for (const tool of WRITE_TOOLS) {
          if (re.test(tool)) pass++;
          else { fail++; fails.push(`settings ${event} matcher "${entry.matcher}" 가 ${tool}를 안 잡음 → ${file} 무력화`); }
        }
      }
    }
  }
} catch (err) {
  fail++; fails.push(`settings.json 배선 검증 실패: ${err.message}`);
}

console.log(`\n  hook-regression: ${pass} pass, ${fail} fail`);
for (const f of fails) console.log(`   ❌ ${f}`);
console.log("");
process.exit(fail > 0 ? 1 : 0);
