#!/usr/bin/env node
/**
 * Color Scale Builder (v0.2)
 *
 * 입력: hex 컬러 1개 + 컬러 이름
 * 출력: OKLCH 기반 11단계 (50, 100, 200, ..., 950) CSS 변수
 *       + WCAG 자동 검증 결과 (어느 단계가 white/black 텍스트와 4.5:1 PASS인지)
 *
 * v0.2 신규: --recommend 모드 — 흰/검정 텍스트와 PASS하는 단계만 출력
 *
 * 사용:
 *   node generate.mjs "#3b82f6" "brand"
 *   node generate.mjs "#3b82f6" "brand" --recommend
 *   node generate.mjs neutral
 */

// ──────────────────────────────────────────────────
// 색공간 변환
// ──────────────────────────────────────────────────

function hexToLinearRGB(hex) {
  hex = hex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split("").map((c) => c + c).join("");
  }
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const toLin = (c) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [toLin(r), toLin(g), toLin(b)];
}

function linRGBtoOklab([r, g, b]) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

function oklabToOklch([L, a, b]) {
  const C = Math.sqrt(a * a + b * b);
  let H = (Math.atan2(b, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

function hexToOklch(hex) {
  return oklabToOklch(linRGBtoOklab(hexToLinearRGB(hex)));
}

// OKLCH → linear RGB (역변환)
function oklchToLinRGB([L, C, H]) {
  const Hrad = (H * Math.PI) / 180;
  const a = C * Math.cos(Hrad);
  const b = C * Math.sin(Hrad);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const lCub = l_ * l_ * l_;
  const mCub = m_ * m_ * m_;
  const sCub = s_ * s_ * s_;
  return [
    4.0767416621 * lCub - 3.3077115913 * mCub + 0.2309699292 * sCub,
    -1.2684380046 * lCub + 2.6097574011 * mCub - 0.3413193965 * sCub,
    -0.0041960863 * lCub - 0.7034186147 * mCub + 1.707614701 * sCub,
  ];
}

// linear RGB → relative luminance (WCAG)
function relLum([r, g, b]) {
  const clamp = (c) => Math.max(0, Math.min(1, c));
  return 0.2126 * clamp(r) + 0.7152 * clamp(g) + 0.0722 * clamp(b);
}

function contrastRatio(L1, L2) {
  const light = Math.max(L1, L2);
  const dark = Math.min(L1, L2);
  return (light + 0.05) / (dark + 0.05);
}

// ──────────────────────────────────────────────────
// 스케일 생성
// ──────────────────────────────────────────────────

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const L_RAMP = [0.97, 0.93, 0.85, 0.76, 0.67, 0.58, 0.5, 0.42, 0.33, 0.25, 0.15];
const C_RATIO = [0.1, 0.25, 0.5, 0.75, 0.9, 1.0, 0.95, 0.85, 0.65, 0.5, 0.3];

// WCAG 사전계산: 흰색(linear 1,1,1)과 거의 검정(neutral-900 = L 0.2) luminance
const LUM_WHITE = relLum([1, 1, 1]); // 1.0
const LUM_NEAR_BLACK = relLum(oklchToLinRGB([0.2, 0, 0])); // neutral-900 기준

function wcagCheckShade(L, C, H) {
  const linRGB = oklchToLinRGB([L, C, H]);
  const lum = relLum(linRGB);
  return {
    onWhite: contrastRatio(lum, LUM_WHITE),     // 이 색을 흰 배경에 텍스트로 썼을 때
    whiteOn: contrastRatio(LUM_WHITE, lum),     // 흰 텍스트를 이 색 위에 썼을 때
    blackOn: contrastRatio(LUM_NEAR_BLACK, lum), // 거의 검정 텍스트를 이 색 위에 썼을 때
  };
}

function buildColorScale(hex, colorName, opts = {}) {
  const [, C_in, H_in] = hexToOklch(hex);

  if (C_in < 0.02) {
    process.stderr.write(
      `⚠️  입력 컬러(${hex})의 chroma가 ${C_in.toFixed(3)}로 매우 낮음. ` +
        `회색이면 --color-neutral-*을 사용하세요.\n`,
    );
  }

  // 각 단계별 WCAG 검증
  const shades = STEPS.map((step, i) => {
    const L = L_RAMP[i];
    let C = C_in * C_RATIO[i];
    if (C > 0.37) C = 0.37;
    const checks = wcagCheckShade(L, C, H_in);
    return { step, L, C, H: H_in, ...checks };
  });

  // 흰 텍스트 PASS 첫 단계 (어둡게 가면서 4.5:1 처음 만족)
  const firstWhiteOnPass = shades.find((s) => s.whiteOn >= 4.5);
  // 검정 텍스트 PASS 마지막 단계 (밝게 가면서 4.5:1 처음 부족해지기 전까지)
  const lastBlackOnPass = [...shades]
    .reverse()
    .find((s) => s.blackOn >= 4.5);

  if (opts.recommend) {
    // 추천만 출력
    console.log(`/* ${colorName} WCAG-safe 단계 추천 */`);
    console.log(`/* 흰 텍스트 (text on color): ${firstWhiteOnPass ? firstWhiteOnPass.step : "없음 — 모든 단계 미달"}부터 PASS */`);
    console.log(`/* 검정 텍스트 (text on color): ${lastBlackOnPass ? lastBlackOnPass.step : "없음"}까지 PASS */`);
    return null;
  }

  // 메인 출력
  const lines = [`  /* ${colorName} (base: ${hex}) */`];
  shades.forEach((s) => {
    lines.push(
      `  --color-${colorName}-${s.step}: oklch(${s.L.toFixed(3)} ${s.C.toFixed(3)} ${s.H.toFixed(1)});`,
    );
  });

  // WCAG 검증 결과 주석 (이게 v0.2의 핵심)
  lines.push(``);
  lines.push(`  /* WCAG 2.2 AA 검증 (${colorName}):`);
  lines.push(`     - 흰 텍스트(neutral-0) PASS 단계: ${firstWhiteOnPass ? firstWhiteOnPass.step : "❌ 없음"}부터`);
  lines.push(`     - 검정 텍스트(neutral-900) PASS 단계: 50~${lastBlackOnPass ? lastBlackOnPass.step : "?"}`);
  if (firstWhiteOnPass && firstWhiteOnPass.step > 500) {
    lines.push(`     ⚠️  주의: 500은 흰 텍스트 4.5:1 미달 (${shades[5].whiteOn.toFixed(2)}:1).`);
    lines.push(`        시맨틱 alias로 --color-${colorName}: var(--color-${colorName}-${firstWhiteOnPass.step}) 권장.`);
  }
  lines.push(`  */`);

  return lines.join("\n");
}

function buildNeutralScale() {
  const NEUTRAL_L = [1.0, 0.985, 0.96, 0.92, 0.86, 0.7, 0.55, 0.44, 0.37, 0.27, 0.2, 0.13, 0];
  const NEUTRAL_STEPS = [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950, 1000];
  const lines = [`  /* neutral (chroma 0) */`];
  NEUTRAL_STEPS.forEach((step, i) => {
    lines.push(`  --color-neutral-${step}: oklch(${NEUTRAL_L[i].toFixed(3)} 0 0);`);
  });
  return lines.join("\n");
}

// ──────────────────────────────────────────────────
// CLI
// ──────────────────────────────────────────────────

const args = process.argv.slice(2);
const opts = { recommend: args.includes("--recommend") };
const positional = args.filter((a) => !a.startsWith("--"));
const [inputHex, colorName] = positional;

if (!inputHex || inputHex === "neutral") {
  console.log(buildNeutralScale());
  process.exit(0);
}

if (!/^#?[0-9a-fA-F]{3,6}$/.test(inputHex)) {
  console.error(`❌ 유효하지 않은 hex: ${inputHex}`);
  console.error(`사용법: node generate.mjs "#3b82f6" "brand" [--recommend]`);
  process.exit(1);
}

if (!colorName) {
  console.error(`❌ 컬러 이름이 필요합니다.`);
  process.exit(1);
}

const out = buildColorScale(inputHex, colorName, opts);
if (out) console.log(out);
