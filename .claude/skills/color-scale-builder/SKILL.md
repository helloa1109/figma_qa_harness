---
name: color-scale-builder
description: Generate a perceptually uniform 50-950 color scale (11 shades) from a single hex brand color, using OKLCH. Use when /init runs, when PROJECT.md brand color changes, or when adding a new semantic color (success, warning, danger). Tailwind v4 compatible output.
---

# Color Scale Builder

브랜드 컬러 hex 1개 → OKLCH 기반 11단계 스케일 (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950) 생성.

## 언제 사용하나

- `/init` 실행 시: PROJECT.md의 브랜드 컬러 hex → 11단계 스케일
- 새 시맨틱 컬러 추가 시: success/warning/danger hex → 각각 11단계
- 사용자가 "이 색으로 스케일 만들어줘" 요청 시

## 입력

- `inputHex` — `#3b82f6` 형식 1개
- `colorName` — `brand` / `success` / `warning` / `danger` 등
- `outputPath` — 보통 `src/tokens/colors.css`

## 출력

`@theme { ... }` 블록에 추가/갱신될 CSS 변수 11개:

```css
@theme {
  --color-brand-50:  oklch(0.97 0.02 264);
  --color-brand-100: oklch(0.93 0.05 263);
  --color-brand-200: oklch(0.85 0.10 263);
  --color-brand-300: oklch(0.76 0.16 263);
  --color-brand-400: oklch(0.67 0.20 263);
  --color-brand-500: oklch(0.58 0.22 263); /* base — 입력 hex */
  --color-brand-600: oklch(0.50 0.21 263);
  --color-brand-700: oklch(0.42 0.18 263);
  --color-brand-800: oklch(0.33 0.14 263);
  --color-brand-900: oklch(0.25 0.10 263);
  --color-brand-950: oklch(0.15 0.05 263);
}
```

## 알고리즘 (요약)

1. 입력 hex → sRGB → OKLCH 변환
2. 입력 컬러의 H(hue), C(chroma) 추출
3. 11단계에 대해 **L(lightness) 램프 적용**:
   ```
   L = [0.97, 0.93, 0.85, 0.76, 0.67, 0.58, 0.50, 0.42, 0.33, 0.25, 0.15]
   ```
4. C(chroma)는 **베이스(500)에서 최대, 양끝으로 갈수록 감소**:
   ```
   C ratio = [0.10, 0.25, 0.50, 0.75, 0.90, 1.00, 0.95, 0.85, 0.65, 0.50, 0.30]
   C_step = inputC * C_ratio[step]
   ```
5. H(hue)는 모든 단계 동일

자세한 알고리즘은 `algorithm.md` 참조.

## 실행 방법

이 스킬은 **결정론적 변환**이므로 Node 스크립트로 실행:

```bash
node -e "$(cat <<'EOF'
// hex → OKLCH 변환 + 11단계 생성
const inputHex = process.argv[1] || '#3b82f6';
const colorName = process.argv[2] || 'brand';

// 1. hex → linear sRGB
function hexToLinearRGB(hex) {
  const r = parseInt(hex.slice(1,3), 16) / 255;
  const g = parseInt(hex.slice(3,5), 16) / 255;
  const b = parseInt(hex.slice(5,7), 16) / 255;
  const toLin = (c) => c <= 0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
  return [toLin(r), toLin(g), toLin(b)];
}

// 2. linear sRGB → OKLab → OKLCH (Björn Ottosson 공식)
function linRGBtoOklab([r, g, b]) {
  const l = 0.4122214708*r + 0.5363325363*g + 0.0514459929*b;
  const m = 0.2119034982*r + 0.6806995451*g + 0.1073969566*b;
  const s = 0.0883024619*r + 0.2817188376*g + 0.6299787005*b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return [
    0.2104542553*l_ + 0.7936177850*m_ - 0.0040720468*s_,
    1.9779984951*l_ - 2.4285922050*m_ + 0.4505937099*s_,
    0.0259040371*l_ + 0.7827717662*m_ - 0.8086757660*s_,
  ];
}
function oklabToOklch([L, a, b]) {
  const C = Math.sqrt(a*a + b*b);
  let H = Math.atan2(b, a) * 180 / Math.PI;
  if (H < 0) H += 360;
  return [L, C, H];
}

const [L_in, C_in, H_in] = oklabToOklch(linRGBtoOklab(hexToLinearRGB(inputHex)));

// 3. L 램프 + C 비율
const L_ramp = [0.97, 0.93, 0.85, 0.76, 0.67, 0.58, 0.50, 0.42, 0.33, 0.25, 0.15];
const C_ratio = [0.10, 0.25, 0.50, 0.75, 0.90, 1.00, 0.95, 0.85, 0.65, 0.50, 0.30];
const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

// 4. 출력
console.log(`  /* ${colorName} (base: ${inputHex}) */`);
steps.forEach((s, i) => {
  const L = L_ramp[i].toFixed(3);
  const C = (C_in * C_ratio[i]).toFixed(3);
  const H = H_in.toFixed(1);
  console.log(`  --color-${colorName}-${s}: oklch(${L} ${C} ${H});`);
});
EOF
)" "#3b82f6" "brand"
```

## 사용 예시

```bash
# /init 단계에서 ds-token-builder가 호출
node .claude/skills/color-scale-builder/generate.mjs "#3b82f6" "brand"
node .claude/skills/color-scale-builder/generate.mjs "#10b981" "success"
node .claude/skills/color-scale-builder/generate.mjs "#f59e0b" "warning"
node .claude/skills/color-scale-builder/generate.mjs "#ef4444" "danger"
```

## 주의사항

- **out-of-gamut 컬러**: 매우 채도 높은 hex를 입력하면 일부 단계가 sRGB 영역 밖으로 나갈 수 있음. 그 경우 자동 클램프 (C 값 줄임).
- **이미 회색에 가까운 입력**: C 값이 0.02 미만이면 neutral 스케일로 취급, 모든 단계 chroma 0.
- **neutral 스케일은 별도**: brand가 아닌 `--color-neutral-*`는 별도 함수로 생성 (chroma 0, hue 무관).

## Neutral 스케일 (브랜드 hue 따라가지 않음, 순회색)

```css
@theme {
  --color-neutral-0:   oklch(1.000 0 0);
  --color-neutral-50:  oklch(0.985 0 0);
  --color-neutral-100: oklch(0.960 0 0);
  --color-neutral-200: oklch(0.920 0 0);
  --color-neutral-300: oklch(0.860 0 0);
  --color-neutral-400: oklch(0.700 0 0);
  --color-neutral-500: oklch(0.550 0 0);
  --color-neutral-600: oklch(0.440 0 0);
  --color-neutral-700: oklch(0.370 0 0);
  --color-neutral-800: oklch(0.270 0 0);
  --color-neutral-900: oklch(0.200 0 0);
  --color-neutral-950: oklch(0.130 0 0);
  --color-neutral-1000: oklch(0 0 0);
}
```
