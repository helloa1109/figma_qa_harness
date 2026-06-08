// scan-rules.mjs — 정적 스캔 규칙 (의존성 0)
// 대비(WCAG) 검사는 기존 .claude/skills/a11y-contrast-checker/check.mjs 엔진을
// 그대로 재사용하므로 여기 없다. 이 파일은 나머지 4종 정적 검사만 담당한다.
// 각 규칙은 기존 훅(detect-hardcoded, enforce-grayscale, check-a11y-attrs)의
// 산출물 차원 재검증이다 — 훅이 "막은" 것이 결과물에 새지 않았는지 확인.

import fs from "node:fs";
import path from "node:path";
// 패턴은 훅과 동일한 단일 소스(_shared.mjs)에서 가져온다 → 훅↔eval drift 방지.
import { hexRe, pxRe, twColorRe } from "../../.claude/hooks/_shared.mjs";

function walk(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(p);
  }
  return out;
}

// R2. 하드코딩 금지 — 컴포넌트에 raw hex / px / Tailwind 색상 단축 클래스
export function noHardcoding(root) {
  const files = walk(path.join(root, "src/components"), [".tsx", ".ts", ".jsx", ".css"])
    .filter((f) => !f.includes(`${path.sep}ui${path.sep}`)); // shadcn 원본 제외
  const violations = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const rel = path.relative(root, f);
    for (const [re, label] of [[hexRe(), "raw-hex"], [pxRe(), "px-unit"], [twColorRe(), "tailwind-color-class"]]) {
      const m = src.match(re);
      if (m) violations.push({ file: rel, type: label, samples: [...new Set(m)].slice(0, 3) });
    }
  }
  return { rule: "no-hardcoding", violations, count: violations.length };
}

// R3. semantic alias 사용 — 컴포넌트가 raw scale(brand-500 등)을 직접 참조하지 않는지
export function usesSemanticAlias(root) {
  const files = walk(path.join(root, "src/components"), [".tsx", ".ts", ".css"])
    .filter((f) => !f.includes(`${path.sep}ui${path.sep}`));
  const violations = [];
  // 컴포넌트는 brand/시맨틱 색상의 raw scale(예: brand-500)을 직접 참조하면 안 된다 → alias 경유.
  // neutral/gray는 mapping-table에서 정당한 폴백(neutral-0/900 등)으로 허용되므로 제외.
  const rawScaleRe = /var\(--color-(brand|success|warning|danger|info|accent|primary|secondary|red|blue|green)-(50|100|200|300|400|500|600|700|800|900|950)\)/g;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const m = src.match(rawScaleRe);
    if (m) violations.push({ file: path.relative(root, f), type: "raw-scale-reference", samples: [...new Set(m)].slice(0, 3) });
  }
  return { rule: "uses-semantic-alias", violations, count: violations.length };
}

// R4. 와이어프레임 회색 전용 — wireframes에 시맨틱 색상 토큰이 새어들지 않았는지
export function wireframeGrayscale(root) {
  const files = walk(path.join(root, "src/wireframes"), [".tsx", ".ts", ".css"]);
  const violations = [];
  const colorRe = /var\(--color-(brand|primary|danger|success|warning|info|accent)[a-z0-9-]*\)/g;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const m = src.match(colorRe);
    if (m) violations.push({ file: path.relative(root, f), type: "color-in-wireframe", samples: [...new Set(m)].slice(0, 3) });
  }
  return { rule: "wireframe-grayscale", violations, count: violations.length };
}

// R5. 접근성 속성 — img에 alt 누락 (check-a11y-attrs 훅의 산출물 검증)
export function a11yAttrs(root) {
  const files = walk(path.join(root, "src/components"), [".tsx", ".jsx"])
    .filter((f) => !f.includes(`${path.sep}ui${path.sep}`));
  const violations = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    const rel = path.relative(root, f);
    for (const m of src.matchAll(/<img\b(?![^>]*\balt=)[^>]*>/g)) {
      violations.push({ file: rel, type: "img-without-alt", samples: [m[0].slice(0, 60)] });
    }
  }
  return { rule: "a11y-attrs", violations, count: violations.length };
}

export const SCAN_RULES = { noHardcoding, usesSemanticAlias, wireframeGrayscale, a11yAttrs };
