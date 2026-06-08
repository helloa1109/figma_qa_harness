#!/usr/bin/env node
// run-eval.mjs — harness-core 가벼운 Eval 채점기 (v0.3)
//
// 무엇인가:
//   /qa 가 "이 컴포넌트가 잘 만들어졌나"를 보는 것이라면,
//   이 Eval 은 "하네스 자체가 잘 작동하나, 퇴화하지 않았나"를 점수로 본다.
//   매뉴얼 23장 "징후 3: Eval 없는 운영"을 메우는 모듈.
//
// 원리:
//   에이전트를 재호출하지 않고(=API 비용 0) 산출물(src/tokens, src/components,
//   src/wireframes)을 정적 스캔/검사해 채점한다. 디자인 토큰·대비·하드코딩은
//   결정론적이라 정적 검사만으로 충분하다.
//   대비 검사는 기존 a11y-contrast-checker 엔진을 재사용한다.
//
// 사용법:
//   pnpm eval               현재 프로젝트 채점
//   pnpm eval:baseline      지금 상태를 "정상" 기준선으로 저장
//   node eval/run-eval.mjs <경로>   특정 경로 채점
//   node eval/run-eval.mjs --no-parity   다크 동등성 검사 생략

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { SCAN_RULES } from "./lib/scan-rules.mjs";
import { wcagContrast } from "./lib/contrast-adapter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- 인자 ----
const args = process.argv.slice(2);
const saveBaseline = args.includes("--baseline");
const noParity = args.includes("--no-parity");
const projectRoot = path.resolve(args.find((a) => !a.startsWith("--")) || ".");

// ---- 태스크 로드 ----
const { tasks, version } = JSON.parse(
  fs.readFileSync(path.join(__dirname, "tasks", "design-system.tasks.json"), "utf8"),
);

// ---- 채점 ----
const results = [];
for (const task of tasks) {
  let r;
  if (task.id === "T1-contrast") {
    r = wcagContrast(projectRoot, { checkDarkParity: !noParity });
  } else if (task.id === "T2-no-hardcoding") {
    r = SCAN_RULES.noHardcoding(projectRoot);
  } else if (task.id === "T3-semantic-alias") {
    r = SCAN_RULES.usesSemanticAlias(projectRoot);
  } else if (task.id === "T4-wireframe-gray") {
    r = SCAN_RULES.wireframeGrayscale(projectRoot);
  } else if (task.id === "T5-a11y-attrs") {
    r = SCAN_RULES.a11yAttrs(projectRoot);
  } else {
    results.push({ id: task.id, title: task.title, weight: task.weight, status: "SKIP" });
    continue;
  }
  const skipped = r.skipped;
  const pass = !skipped && r.count === 0;
  results.push({
    id: task.id,
    title: task.title,
    weight: task.weight,
    status: skipped ? "SKIP" : pass ? "PASS" : "FAIL",
    reason: skipped,
    violationCount: r.count,
    violations: r.violations,
    checked: r.checked,
  });
}

// ---- 점수 (가중치) ----
const W = { high: 3, medium: 2, low: 1 };
let earned = 0;
let total = 0;
for (const r of results) {
  if (r.status === "SKIP") continue;
  const w = W[r.weight] || 1;
  total += w;
  if (r.status === "PASS") earned += w;
}
const score = total ? Math.round((earned / total) * 100) : 0;
const critical = results.filter((r) => r.status === "FAIL" && r.weight === "high");
// high-weight 태스크가 SKIP이면 결과가 불완전하다 — 만점이어도 신뢰할 수 없다.
const highSkipped = results.filter((r) => r.status === "SKIP" && r.weight === "high");

// ---- 콘솔 리포트 ----
const tag = { PASS: "✅", FAIL: "❌", SKIP: "⚪" };
console.log(`\n  harness-core Eval v${version}`);
console.log(`  대상: ${projectRoot}`);
console.log(`  ${"─".repeat(50)}`);
for (const r of results) {
  console.log(`  ${tag[r.status]} ${r.id.padEnd(18)} ${r.title}`);
  if (r.status === "SKIP") {
    console.log(`       └ skip: ${r.reason}`);
  } else if (r.status === "FAIL") {
    for (const v of r.violations.slice(0, 5)) {
      const detail = v.pair
        ? `${v.pair} → ${v.ratio}${v.required ? ` (기준 ${v.required})` : ""}`
        : `${v.file} [${v.type}] ${(v.samples || []).join(", ")}`;
      console.log(`       └ ${detail}`);
    }
    if (r.violations.length > 5) console.log(`       └ … 외 ${r.violations.length - 5}건`);
  }
}
console.log(`  ${"─".repeat(50)}`);
const incompleteTag = highSkipped.length ? `  ⚠️ 결과 불완전 — ${highSkipped.map((r) => r.id).join(", ")} 미검증` : "";
console.log(`  점수: ${score}/100   (가중 ${earned}/${total})${incompleteTag}`);
if (critical.length) {
  console.log(`  🔴 CRITICAL ${critical.length}건 — 배포 차단 권장: ${critical.map((c) => c.id).join(", ")}`);
} else if (highSkipped.length) {
  // 핵심 검사를 못 돌렸으면 "0건"이라고 안심시키지 않는다.
  console.log(`  ⚪ 핵심 검사(${highSkipped.map((r) => r.id).join(", ")}) 미검증 — "CRITICAL 0건"으로 단정 불가`);
} else {
  console.log(`  🟢 CRITICAL 0건`);
}
console.log("");

// ---- 결과 저장 + 기준선 비교 ----
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const summary = { version, projectRoot, timestamp: stamp, score, earned, total, results };
const resultsDir = path.join(__dirname, "results");
fs.mkdirSync(resultsDir, { recursive: true });
const baselinePath = path.join(resultsDir, "baseline.json");

if (saveBaseline) {
  fs.writeFileSync(baselinePath, JSON.stringify(summary, null, 2));
  console.log(`  📌 기준선 저장: eval/results/baseline.json (점수 ${score})\n`);
} else {
  fs.writeFileSync(path.join(resultsDir, `eval-${stamp}.json`), JSON.stringify(summary, null, 2));
  if (fs.existsSync(baselinePath)) {
    const base = JSON.parse(fs.readFileSync(baselinePath, "utf8"));
    const diff = score - base.score;
    const arrow = diff > 0 ? `▲ +${diff}` : diff < 0 ? `▼ ${diff}` : "= 동일";
    console.log(`  📊 기준선(${base.score}) 대비: ${arrow}`);
    console.log(diff < 0 ? `  ⚠️  점수 하락 — 이번 변경이 하네스를 퇴화시켰을 수 있음\n` : "");
  }
}

// ---- CI 연동: CRITICAL 있으면 exit 1 ----
process.exit(critical.length > 0 ? 1 : 0);
