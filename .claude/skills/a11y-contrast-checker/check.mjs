#!/usr/bin/env node
/**
 * WCAG 2.2 Contrast Checker (v0.2)
 *
 * v0.2 신규:
 *   --check-dark-parity   :root와 .dark의 alias가 둘 다 PASS인지 검증
 *   --component <path>    컴포넌트 .tsx 파일의 cva variant 페어 자동 추출 + 검증
 *
 * 사용:
 *   node check.mjs --fg "#ffffff" --bg "#3b82f6"
 *   node check.mjs --tokens src/tokens/colors.css
 *   node check.mjs --tokens src/tokens/colors.css --check-dark-parity
 *   node check.mjs --tokens src/tokens/colors.css --component src/components/Button/Button.tsx
 */

import { readFileSync } from "node:fs";

// ──────────────────────────────────────────────────
// 색공간 변환 (v0.1과 동일)
// ──────────────────────────────────────────────────

function hexToSRGB(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
  return [
    parseInt(hex.slice(0, 2), 16) / 255,
    parseInt(hex.slice(2, 4), 16) / 255,
    parseInt(hex.slice(4, 6), 16) / 255,
  ];
}

function sRGBtoLinear([r, g, b]) {
  const conv = (c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [conv(r), conv(g), conv(b)];
}

function relativeLuminance([rLin, gLin, bLin]) {
  return 0.2126 * rLin + 0.7152 * gLin + 0.0722 * bLin;
}

function oklchToSRGB([L, C, H]) {
  const Hrad = (H * Math.PI) / 180;
  const a = C * Math.cos(Hrad);
  const b = C * Math.sin(Hrad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lCub = l_ * l_ * l_;
  const mCub = m_ * m_ * m_;
  const sCub = s_ * s_ * s_;
  let r = 4.0767416621 * lCub - 3.3077115913 * mCub + 0.2309699292 * sCub;
  let g = -1.2684380046 * lCub + 2.6097574011 * mCub - 0.3413193965 * sCub;
  let bb = -0.0041960863 * lCub - 0.7034186147 * mCub + 1.707614701 * sCub;
  const gamma = (c) => {
    c = Math.max(0, Math.min(1, c));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  };
  return [gamma(r), gamma(g), gamma(bb)];
}

function parseColor(input) {
  input = input.trim();
  if (input.startsWith("#")) return sRGBtoLinear(hexToSRGB(input));
  const m = input.match(/oklch\(\s*([\d.]+)%?\s+([\d.]+)\s+([\d.-]+)\s*\)/i);
  if (m) {
    let L = parseFloat(m[1]);
    if (input.includes("%")) L /= 100;
    return sRGBtoLinear(oklchToSRGB([L, parseFloat(m[2]), parseFloat(m[3])]));
  }
  throw new Error(`알 수 없는 컬러 형식: ${input}`);
}

function contrastRatio(fg, bg) {
  const L1 = relativeLuminance(parseColor(fg));
  const L2 = relativeLuminance(parseColor(bg));
  return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
}

function gradeContrast(ratio) {
  return {
    ratio: Math.round(ratio * 100) / 100,
    aa_normal: ratio >= 4.5,
    aa_large: ratio >= 3,
    aaa_normal: ratio >= 7,
    aaa_large: ratio >= 4.5,
    ui: ratio >= 3,
  };
}

// ──────────────────────────────────────────────────
// 토큰 파일 파싱 — v0.2: 라이트/다크 분리
// ──────────────────────────────────────────────────

// CSS 주석(/* ... */) 제거. 주석 안의 '}' 가 블록 추출을 깨뜨리는 것을 방지.
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

// selector(예: ":root", ".dark", "@theme")의 { ... } 블록을 중괄호 균형으로 추출.
// 정규식 [^}]+ 와 달리 블록 내부에 '}' 가 있어도(중첩 등) 안전하게 끝까지 읽는다.
// 같은 selector가 여러 번 나오면 모두 합쳐 반환.
function extractBlocks(src, selector) {
  const out = [];
  let idx = 0;
  while (true) {
    const at = src.indexOf(selector, idx);
    if (at === -1) break;
    // selector 다음의 첫 '{' 찾기 (사이에 공백만 허용)
    let i = at + selector.length;
    while (i < src.length && /\s/.test(src[i])) i++;
    if (src[i] !== "{") { idx = at + selector.length; continue; }
    // 중괄호 균형 맞추기
    let depth = 0, start = i + 1, j = i;
    for (; j < src.length; j++) {
      if (src[j] === "{") depth++;
      else if (src[j] === "}") { depth--; if (depth === 0) break; }
    }
    out.push(src.slice(start, j));
    idx = j + 1;
  }
  return out;
}

function parseTokenFile(path) {
  const content = stripCssComments(readFileSync(path, "utf-8"));

  const lightVars = {};
  const darkVars = {};

  // @theme + :root 는 라이트로 취급. .dark 는 다크 오버라이드.
  // 각 selector가 여러 번 등장해도 모두 파싱.
  for (const block of extractBlocks(content, "@theme")) parseVarBlock(block, lightVars);
  for (const block of extractBlocks(content, ":root")) parseVarBlock(block, lightVars);
  for (const block of extractBlocks(content, ".dark")) parseVarBlock(block, darkVars);

  // 다크 블록은 라이트 위에 덮어쓰는 형태
  const darkResolved = { ...lightVars, ...darkVars };

  // var() 참조 해석 (3단계까지 재귀)
  resolveRefs(lightVars, lightVars);
  resolveRefs(darkResolved, darkResolved);

  return { light: lightVars, dark: darkResolved, darkOverrides: darkVars };
}

function parseVarBlock(block, target) {
  const re = /--([\w-]+):\s*([^;]+);/g;
  let m;
  while ((m = re.exec(block)) !== null) {
    target[m[1]] = m[2].trim();
  }
}

function resolveRefs(vars, ctx, depth = 0) {
  if (depth > 5) return;
  for (const [k, v] of Object.entries(vars)) {
    const refMatch = v.match(/var\(--([\w-]+)\)/);
    if (refMatch && ctx[refMatch[1]]) {
      vars[k] = ctx[refMatch[1]];
    }
  }
  // 2회차로 transitive 처리
  if (depth < 2) resolveRefs(vars, ctx, depth + 1);
}

// ──────────────────────────────────────────────────
// 자동 페어 생성
// ──────────────────────────────────────────────────

function generateAutoPairs(tokens, mode = "light") {
  const pairs = [];

  // semantic alias 기반 페어 (있으면 우선)
  const semanticPairs = [
    ["text-on-brand", "primary", "primary 버튼"],
    ["text-on-brand", "primary-hover", "primary hover"],
    ["text-on-danger", "danger", "danger 버튼"],
    ["text-on-danger", "danger-hover", "danger hover"],
    ["text-on-success", "success", "success badge"],
    ["text-on-warning", "warning", "warning badge"],
    ["text-on-info", "info", "info badge"],
    ["text", "bg", "본문 (text on bg)"],
    ["text", "surface", "본문 (text on surface)"],
    ["text-muted", "bg", "보조 텍스트"],
    ["text-subtle", "bg", "옅은 텍스트 (≥18px 권장)"],
  ];

  for (const [fg, bg, label] of semanticPairs) {
    if (tokens[`color-${fg}`] && tokens[`color-${bg}`]) {
      pairs.push({
        fg: `color-${fg}`,
        bg: `color-${bg}`,
        label,
        category: "semantic",
        mode,
      });
    }
  }

  // border vs surface (UI 3:1 강제)
  const borderPairs = [
    ["border-interactive", "surface", "input/button 테두리"],
    ["border-strong", "surface", "강조 테두리"],
  ];
  for (const [fg, bg, label] of borderPairs) {
    if (tokens[`color-${fg}`] && tokens[`color-${bg}`]) {
      pairs.push({
        fg: `color-${fg}`,
        bg: `color-${bg}`,
        label,
        category: "ui",
        mode,
      });
    }
  }

  // raw 스케일 기반 페어 (semantic alias가 없을 때 폴백)
  if (pairs.length === 0) {
    const names = Object.keys(tokens);
    const semantics = ["brand", "primary", "secondary", "success", "warning", "danger", "info", "accent"];
    for (const name of names) {
      const sem = semantics.find((s) => name.startsWith(`color-${s}-`));
      if (!sem) continue;
      if (tokens["color-neutral-0"]) pairs.push({ fg: "color-neutral-0", bg: name, mode });
      if (tokens["color-neutral-900"]) pairs.push({ fg: "color-neutral-900", bg: name, mode });
    }
  }

  return pairs;
}

function evaluatePairs(pairs, tokens) {
  return pairs.map((p) => {
    const fgVal = tokens[p.fg];
    const bgVal = tokens[p.bg];
    if (!fgVal || !bgVal) {
      return { ...p, error: `토큰 미정의: ${!fgVal ? p.fg : p.bg}` };
    }
    try {
      const ratio = contrastRatio(fgVal, bgVal);
      const grade = gradeContrast(ratio);
      // category에 따라 required 기준 다름
      const required =
        p.category === "ui" ? 3 : grade.ratio >= 4.5 ? "AA normal" : "AA large";
      const pass = p.category === "ui" ? grade.ui : grade.aa_normal;
      return { ...p, fgVal, bgVal, ...grade, pass, required };
    } catch (err) {
      return { ...p, error: err.message };
    }
  });
}

// ──────────────────────────────────────────────────
// 컴포넌트 cva variant 추출 (v0.2 신규)
// ──────────────────────────────────────────────────

function extractCvaPairs(componentPath) {
  const content = readFileSync(componentPath, "utf-8");
  const pairs = [];
  // bg-[var(--color-X)] + text-[var(--color-Y)] 페어 추출 (라인 단위)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const bgMatch = line.match(/bg-\[var\(--(color-[\w-]+)\)\]/);
    const textMatch = line.match(/text-\[var\(--(color-[\w-]+)\)\]/);
    if (bgMatch && textMatch) {
      pairs.push({
        fg: textMatch[1],
        bg: bgMatch[1],
        label: `${componentPath}:${i + 1}`,
        category: "semantic",
        source: "cva",
      });
    }
  }
  return pairs;
}

// ──────────────────────────────────────────────────
// CLI
// ──────────────────────────────────────────────────

function parseArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

function formatPair(r) {
  if (r.error) return `❌ ${r.fg} on ${r.bg}: ${r.error}`;
  const icon = r.pass ? "✅" : "❌";
  const label = r.label ? ` (${r.label})` : "";
  const mode = r.mode ? `[${r.mode}] ` : "";
  return `${icon} ${mode}${r.fg} on ${r.bg} = ${r.ratio}:1${label}`;
}

const args = parseArgs();

// 모드 1: 단일 페어
if (args.fg && args.bg) {
  try {
    const ratio = contrastRatio(args.fg, args.bg);
    const grade = gradeContrast(ratio);
    if (args.json) {
      console.log(JSON.stringify({ fg: args.fg, bg: args.bg, ...grade }, null, 2));
    } else {
      const passIcon = (b) => (b ? "✅" : "❌");
      console.log(`${args.fg} on ${args.bg}
  Ratio: ${grade.ratio}:1
  ${passIcon(grade.aa_normal)} AA normal (≥4.5)    ${passIcon(grade.aaa_normal)} AAA normal (≥7)
  ${passIcon(grade.aa_large)} AA large (≥3)       ${passIcon(grade.aaa_large)} AAA large (≥4.5)
  ${passIcon(grade.ui)} UI components (≥3)`);
    }
    process.exit(grade.aa_normal ? 0 : 1);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(2);
  }
}

// 모드 2: 토큰 파일 검사
if (args.tokens) {
  try {
    const { light, dark, darkOverrides } = parseTokenFile(args.tokens);

    // --pair "fg,bg" : 토큰 이름 한 쌍만 검사 (SKILL.md에 문서화된 옵션)
    if (typeof args.pair === "string") {
      const [fgRaw, bgRaw] = args.pair.split(",").map((s) => s.trim());
      const norm = (n) => (n.startsWith("color-") || n.startsWith("--") ? n.replace(/^--/, "") : `color-${n}`);
      const fg = norm(fgRaw);
      const bg = norm(bgRaw);
      const [res] = evaluatePairs([{ fg, bg, label: args.pair, category: "semantic", mode: "light" }], light);
      if (args.json) {
        console.log(JSON.stringify({ summary: { total: 1, pass: res.pass ? 1 : 0, fail: res.pass ? 0 : 1 }, pairs: [res], parityViolations: [] }, null, 2));
      } else {
        console.log(formatPair(res));
      }
      process.exit(res.error ? 2 : res.pass ? 0 : 1);
    }

    let allResults = [];

    // 라이트 검증
    const lightPairs = generateAutoPairs(light, "light");
    const lightResults = evaluatePairs(lightPairs, light);
    allResults.push(...lightResults);

    let darkResults = [];
    let parityViolations = [];

    // 다크 검증 (--check-dark-parity 모드)
    if (args["check-dark-parity"] && Object.keys(darkOverrides).length > 0) {
      const darkPairs = generateAutoPairs(dark, "dark");
      darkResults = evaluatePairs(darkPairs, dark);
      allResults.push(...darkResults);

      // 동등성 검증
      for (const lp of lightResults) {
        const matching = darkResults.find(
          (dp) => dp.fg === lp.fg && dp.bg === lp.bg,
        );
        if (matching && lp.pass !== matching.pass) {
          parityViolations.push({
            fg: lp.fg,
            bg: lp.bg,
            light: { ratio: lp.ratio, pass: lp.pass },
            dark: { ratio: matching.ratio, pass: matching.pass },
          });
        }
      }
    }

    // 컴포넌트 검증 (--component)
    if (args.component) {
      const cvaPairs = extractCvaPairs(args.component);
      const cvaLightResults = evaluatePairs(cvaPairs, light);
      const cvaDarkResults = args["check-dark-parity"]
        ? evaluatePairs(cvaPairs.map((p) => ({ ...p, mode: "dark" })), dark)
        : [];
      allResults.push(...cvaLightResults, ...cvaDarkResults);
    }

    const passCount = allResults.filter((r) => r.pass).length;
    const failCount = allResults.length - passCount;

    if (args.json) {
      console.log(
        JSON.stringify(
          {
            summary: { total: allResults.length, pass: passCount, fail: failCount },
            pairs: allResults,
            parityViolations,
          },
          null,
          2,
        ),
      );
    } else {
      console.log(`총 페어: ${allResults.length}, PASS: ${passCount}, FAIL: ${failCount}\n`);
      for (const r of allResults) console.log(formatPair(r));

      if (parityViolations.length > 0) {
        console.log(`\n⚠️  다크모드 동등성 위반 ${parityViolations.length}건:`);
        for (const v of parityViolations) {
          console.log(
            `   ${v.fg} on ${v.bg}: 라이트 ${v.light.ratio}:1 (${v.light.pass ? "PASS" : "FAIL"}) ↔ 다크 ${v.dark.ratio}:1 (${v.dark.pass ? "PASS" : "FAIL"})`,
          );
        }
      }
    }

    process.exit(failCount === 0 && parityViolations.length === 0 ? 0 : 1);
  } catch (err) {
    console.error(`❌ ${err.message}`);
    process.exit(2);
  }
}

// 도움말
console.log(`WCAG Contrast Checker (v0.2)

사용:
  node check.mjs --fg "#ffffff" --bg "#3b82f6"
  node check.mjs --tokens src/tokens/colors.css
  node check.mjs --tokens src/tokens/colors.css --check-dark-parity
  node check.mjs --tokens src/tokens/colors.css --component src/components/Button/Button.tsx
  node check.mjs --tokens src/tokens/colors.css --check-dark-parity --json

옵션:
  --fg <color>          foreground (hex 또는 oklch)
  --bg <color>          background
  --tokens <path>       토큰 CSS 파일 (자동 페어링)
  --check-dark-parity   :root와 .dark의 동등성 검증
  --component <path>    컴포넌트 .tsx의 cva variant 자동 검증
  --json                JSON 출력
`);
process.exit(0);
