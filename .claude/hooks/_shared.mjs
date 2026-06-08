// _shared.mjs — 훅과 Eval이 공유하는 단일 진실 공급원.
// 색상/px/폰트 패턴이 훅·eval·에이전트에서 제각각 drift 하던 문제(유형 C)와,
// 훅이 Edit 입력(new_string)을 못 읽어 silent no-op 되던 문제(유형 A)를 한 곳에서 차단.

// Tailwind 색상 팔레트 — 한 곳에서만 정의. 훅·eval 모두 여기서 가져다 쓴다.
export const TW_COLORS = [
  "red", "blue", "green", "gray", "grey", "slate", "zinc", "neutral", "stone",
  "orange", "amber", "yellow", "lime", "emerald", "teal", "cyan", "sky",
  "indigo", "violet", "purple", "fuchsia", "pink", "rose",
];

// 와이어프레임에서 금지되는 "유채색"만 (neutral/gray/zinc/slate/stone 같은 회색 계열은 허용).
export const TW_CHROMATIC = TW_COLORS.filter(
  (c) => !["gray", "grey", "slate", "zinc", "neutral", "stone"].includes(c),
);

const COLOR_UTILS = "(bg|text|border|ring|from|to|via|fill|stroke|outline|divide|placeholder|caret|accent|decoration|shadow)";

// 하드코딩 패턴 (컴포넌트용). 훅·eval 공통.
export function hexRe() { return /#[0-9a-fA-F]{3,8}\b/g; }
export function twColorRe() {
  return new RegExp(`\\b${COLOR_UTILS}-(${TW_COLORS.join("|")})-\\d{2,3}\\b`, "g");
}
export function twChromaticRe() {
  return new RegExp(`\\b${COLOR_UTILS}-(${TW_CHROMATIC.join("|")})-\\d{2,3}\\b`, "g");
}
export function twFontSizeRe() {
  return /\b(text|leading)-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)\b/g;
}
// px: 콜론 뒤(CSS), Tailwind arbitrary([..px]), 따옴표 안('12px') 모두 포착.
export function pxRe() { return /\b\d+(\.\d+)?px\b/g; }

// 시맨틱 색 토큰 (와이어프레임 금지 대상)
export function semanticTokenRe() {
  return /--color-(brand|primary|secondary|accent|success|warning|danger|error|info)\b/i;
}

// ── 핵심: 도구 입력에서 "쓰여질 내용"과 경로를 정확히 추출 ──
// Claude Code 실제 필드: Write={content}, Edit={old_string,new_string},
// MultiEdit={edits:[{new_string}]}. 과거 호환(new_str/file_text)도 함께 본다.
export function extractContent(toolInput = {}) {
  const parts = [];
  if (typeof toolInput.content === "string") parts.push(toolInput.content);
  if (typeof toolInput.new_string === "string") parts.push(toolInput.new_string);
  if (typeof toolInput.new_str === "string") parts.push(toolInput.new_str);
  if (typeof toolInput.file_text === "string") parts.push(toolInput.file_text);
  if (Array.isArray(toolInput.edits)) {
    for (const e of toolInput.edits) {
      if (e && typeof e.new_string === "string") parts.push(e.new_string);
      if (e && typeof e.new_str === "string") parts.push(e.new_str);
    }
  }
  return parts.join("\n");
}

export function extractPath(toolInput = {}) {
  return toolInput.file_path || toolInput.path || "";
}

// PreToolUse 차단 출력 — 공식 stdout 프로토콜(hookSpecificOutput) 사용.
// 과거엔 stderr로 raw JSON을 뱉어 Claude에게 그대로 노출됐다(유형 D).
export function blockDecision(reason) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0); // hookSpecificOutput는 exit 0과 함께 쓴다.
}

// 도구가 파일 쓰기 계열인지 (Write/Edit/MultiEdit)
export function isWriteEdit(toolName) {
  return ["Write", "Edit", "MultiEdit"].includes(toolName);
}
