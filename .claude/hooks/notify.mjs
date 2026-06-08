#!/usr/bin/env node
/**
 * Notification 훅: 작업 완료/대기 시 데스크탑 알림
 *
 * macOS: osascript / Linux: notify-send / 그 외: skip.
 * execFileSync + 인자 배열을 써서 셸 인젝션 여지를 제거 (v0.3.3).
 */

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { platform } from "node:os";

try {
  const input = JSON.parse(readFileSync(0, "utf-8"));
  const message = String(input.message || "Claude Code: 작업 완료 또는 입력 대기 중");
  const title = "Harness Core";
  const os = platform();

  if (os === "darwin") {
    // AppleScript 문자열 리터럴 안의 " 와 \ 만 이스케이프하면 안전.
    const esc = (s) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const script = `display notification "${esc(message)}" with title "${esc(title)}"`;
    execFileSync("osascript", ["-e", script], { stdio: "ignore" });
  } else if (os === "linux") {
    try {
      execFileSync("notify-send", [title, message], { stdio: "ignore" });
    } catch {
      // notify-send 없음 — 무시
    }
  }
  process.exit(0);
} catch {
  process.exit(0);
}
