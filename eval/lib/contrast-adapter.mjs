// contrast-adapter.mjs — 대비(WCAG) 검사를 기존 엔진에 위임
// harness-core는 이미 .claude/skills/a11y-contrast-checker/check.mjs 라는
// 검증된 대비 계산 엔진을 갖고 있다. Eval은 색 계산을 다시 구현하지 않고
// 이 엔진을 --json 모드로 호출해 결과만 받는다. (단일 진실 공급원 유지)

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// checker는 "하네스 자신의 도구"다. 채점 대상(projectRoot)이 아니라
// 하네스 루트(eval/lib 기준 ../../) 에서 찾아야 fixture·신규설치에서도 산다.
const HARNESS_ROOT = path.resolve(__dirname, "../..");
const CHECKER = path.join(HARNESS_ROOT, ".claude/skills/a11y-contrast-checker/check.mjs");

// 토큰 CSS 경로 탐색 (colors.css 우선, 없으면 tokens 폴더의 첫 css)
function findTokenFile(root) {
  const tokensDir = path.join(root, "src/tokens");
  if (!fs.existsSync(tokensDir)) return null;
  const colors = path.join(tokensDir, "colors.css");
  if (fs.existsSync(colors)) return colors;
  const css = fs.readdirSync(tokensDir).find((f) => f.endsWith(".css"));
  return css ? path.join(tokensDir, css) : null;
}

// 대비 검사 실행. dark-parity까지 한 번에 검증.
// 반환: { rule, violations, count, checked }
export function wcagContrast(root, { checkDarkParity = true } = {}) {
  const checkerPath = CHECKER;            // 하네스 루트 기준 고정
  const tokenFile = findTokenFile(root);  // 토큰만 채점 대상(root) 기준

  if (!fs.existsSync(checkerPath)) {
    return { rule: "wcag-contrast", violations: [], count: 0, checked: 0, skipped: "checker 엔진 없음" };
  }
  if (!tokenFile) {
    return { rule: "wcag-contrast", violations: [], count: 0, checked: 0, skipped: "토큰 파일 없음 (/init 전이거나 src/tokens 부재)" };
  }

  const args = [checkerPath, "--tokens", tokenFile, "--json"];
  if (checkDarkParity) args.push("--check-dark-parity");

  let out;
  try {
    out = execFileSync("node", args, { cwd: root, encoding: "utf8" });
  } catch (e) {
    // checker는 FAIL 시 exit 1 — stdout에 JSON은 그대로 담겨 나온다
    out = e.stdout || "";
  }

  let data;
  try {
    data = JSON.parse(out);
  } catch {
    return { rule: "wcag-contrast", violations: [], count: 0, checked: 0, skipped: "JSON 파싱 실패" };
  }

  const violations = [];
  for (const p of data.pairs || []) {
    if (p.error) continue;
    if (p.pass === false) {
      violations.push({
        pair: `${p.fg} on ${p.bg}`,
        ratio: p.ratio,
        required: p.required,
        type: "contrast-fail",
      });
    }
  }
  for (const v of data.parityViolations || []) {
    violations.push({
      pair: `${v.fg} on ${v.bg} (dark-parity)`,
      ratio: `light ${v.light.ratio} / dark ${v.dark.ratio}`,
      type: "dark-parity-fail",
    });
  }

  return {
    rule: "wcag-contrast",
    violations,
    count: violations.length,
    checked: (data.summary && data.summary.total) || 0,
  };
}
