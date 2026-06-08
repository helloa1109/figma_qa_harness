---
name: wireframe-grayscale
description: Generate grayscale-only wireframe patterns for common UI elements (forms, lists, cards, navigation) using only neutral color tokens. Use when wireframe-builder agent needs concrete patterns to compose a screen. Output is paste-ready JSX with proper token usage.
---

# Wireframe Grayscale Patterns

회색 5단계로 만드는 UI 패턴 라이브러리. 화면 구성 시 컴포넌트처럼 가져다 사용.

## 사용 가능 토큰 (이 5개만)

```css
--color-neutral-0     /* 흰색, 배경 */
--color-neutral-100   /* 카드 배경, 구분선 hover */
--color-neutral-300   /* 비활성, placeholder */
--color-neutral-500   /* 보조 텍스트 */
--color-neutral-900   /* 제목, 본문, 강조 버튼 */
```

## 패턴 1: 폼 입력 필드

```tsx
<div>
  <label className="block text-[length:var(--font-size-sm)] font-medium mb-2">
    라벨
  </label>
  <input
    type="text"
    placeholder="플레이스홀더"
    className="w-full px-4 py-3 rounded-[var(--radius-md)]
               border border-[var(--color-neutral-300)]
               bg-[var(--color-neutral-0)]
               placeholder:text-[var(--color-neutral-300)]
               focus:outline-none focus:border-[var(--color-neutral-900)]"
  />
  {/* 도움말 텍스트 */}
  <p className="mt-1.5 text-[length:var(--font-size-xs)] text-[var(--color-neutral-500)]">
    도움말
  </p>
</div>
```

## 패턴 2: 버튼

### Primary (강조)
```tsx
<button className="px-4 py-3 rounded-[var(--radius-md)]
                   bg-[var(--color-neutral-900)] text-[var(--color-neutral-0)]
                   font-semibold">
  강조 액션
</button>
```

### Secondary (보통)
```tsx
<button className="px-4 py-3 rounded-[var(--radius-md)]
                   bg-[var(--color-neutral-100)] text-[var(--color-neutral-900)]
                   font-medium
                   border border-[var(--color-neutral-300)]">
  보통 액션
</button>
```

### Ghost (가벼움)
```tsx
<button className="px-4 py-3 rounded-[var(--radius-md)]
                   text-[var(--color-neutral-500)]
                   underline-offset-2 hover:underline">
  가벼운 액션
</button>
```

## 패턴 3: 카드

```tsx
<article className="rounded-[var(--radius-lg)] border border-[var(--color-neutral-300)]
                    bg-[var(--color-neutral-0)] p-6">
  <h3 className="text-[length:var(--font-size-lg)] font-semibold mb-2">
    카드 제목
  </h3>
  <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-500)] mb-4">
    카드 본문 또는 설명. 보조 정보는 neutral-500으로.
  </p>
  <button className="text-[length:var(--font-size-sm)] font-medium">
    더보기 →
  </button>
</article>
```

## 패턴 4: 리스트 아이템

```tsx
<ul className="divide-y divide-[var(--color-neutral-300)]">
  <li className="flex items-center justify-between py-4">
    <div>
      <p className="font-medium">아이템 제목</p>
      <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-500)]">
        보조 정보
      </p>
    </div>
    <span className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-500)]">
      →
    </span>
  </li>
</ul>
```

## 패턴 5: 네비게이션 (탑바)

```tsx
<nav className="flex items-center justify-between
                px-6 py-4 border-b border-[var(--color-neutral-300)]
                bg-[var(--color-neutral-0)]">
  <button aria-label="뒤로가기" className="-ml-2 p-2">←</button>
  <h1 className="font-semibold">화면 제목</h1>
  <button aria-label="메뉴" className="-mr-2 p-2">⋯</button>
</nav>
```

## 패턴 6: 모바일 하단 CTA (sticky)

```tsx
<div className="fixed bottom-0 inset-x-0
                bg-[var(--color-neutral-0)]
                border-t border-[var(--color-neutral-300)]
                px-6 py-4 pb-8">  {/* pb-8: 홈 인디케이터 */}
  <button className="w-full py-3 rounded-[var(--radius-md)]
                     bg-[var(--color-neutral-900)] text-[var(--color-neutral-0)]
                     font-semibold">
    다음
  </button>
</div>
```

## 패턴 7: 빈 상태 (Empty State)

```tsx
<div className="flex flex-col items-center justify-center py-16 px-6 text-center">
  <div className="w-16 h-16 rounded-full bg-[var(--color-neutral-100)] mb-4
                  flex items-center justify-center text-2xl">
    {/* 아이콘 자리. lucide 사용 시 회색만 stroke */}
    ?
  </div>
  <h3 className="font-semibold mb-1">아직 없습니다</h3>
  <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-500)] mb-6 max-w-xs">
    뭔가를 만들어보세요. 추가하면 이곳에 표시됩니다.
  </p>
  <button className="px-4 py-2 rounded-[var(--radius-md)]
                     bg-[var(--color-neutral-900)] text-[var(--color-neutral-0)]
                     text-[length:var(--font-size-sm)] font-medium">
    추가하기
  </button>
</div>
```

## 패턴 8: Tabs

```tsx
<div role="tablist" className="border-b border-[var(--color-neutral-300)]">
  <button
    role="tab"
    aria-selected="true"
    className="px-4 py-3 font-medium border-b-2 border-[var(--color-neutral-900)]"
  >
    탭 1
  </button>
  <button
    role="tab"
    aria-selected="false"
    className="px-4 py-3 text-[var(--color-neutral-500)] border-b-2 border-transparent"
  >
    탭 2
  </button>
</div>
```

## 패턴 9: 체크리스트

```tsx
<ul className="space-y-3">
  <li className="flex items-start gap-3">
    <input
      type="checkbox"
      checked
      readOnly
      className="mt-1 w-4 h-4 accent-[var(--color-neutral-900)]"
    />
    <div className="flex-1">
      <p className="font-medium line-through text-[var(--color-neutral-500)]">
        완료된 항목
      </p>
    </div>
  </li>
  <li className="flex items-start gap-3">
    <input
      type="checkbox"
      className="mt-1 w-4 h-4 accent-[var(--color-neutral-900)]"
    />
    <div className="flex-1">
      <p className="font-medium">남은 항목</p>
    </div>
  </li>
</ul>
```

## 패턴 10: 모달 / 시트

```tsx
<div className="fixed inset-0 bg-[var(--color-neutral-900)]/40 z-50
                flex items-end sm:items-center justify-center"
     role="dialog" aria-labelledby="modal-title">
  <div className="w-full sm:max-w-md bg-[var(--color-neutral-0)]
                  rounded-t-[var(--radius-xl)] sm:rounded-[var(--radius-xl)]
                  p-6">
    <h2 id="modal-title" className="text-[length:var(--font-size-lg)] font-semibold mb-2">
      모달 제목
    </h2>
    <p className="text-[length:var(--font-size-sm)] text-[var(--color-neutral-500)] mb-6">
      모달 본문 설명.
    </p>
    <div className="flex gap-2 justify-end">
      <button className="px-4 py-2 rounded-[var(--radius-md)] text-[var(--color-neutral-500)]">
        취소
      </button>
      <button className="px-4 py-2 rounded-[var(--radius-md)]
                         bg-[var(--color-neutral-900)] text-[var(--color-neutral-0)]
                         font-medium">
        확인
      </button>
    </div>
  </div>
</div>
```

## 패턴 합성 가이드

여러 패턴을 한 화면에 조합할 때:

1. **시각 단계 3개 이상**: 제목(2xl) → 섹션 제목(lg) → 본문(base) → 보조(sm)
2. **회색 4단계 모두 사용**: 0(배경), 100(카드), 300(구분), 500(보조), 900(주요)
3. **간격 일관성**: 8px 그리드 (`--space-2`, `--space-4`, `--space-6`)
4. **One screen one CTA**: 강조 버튼은 화면당 1개. 다른 액션은 secondary/ghost로

## 안티 패턴 (절대 하지 마세요)

❌ 색으로 강조: `bg-[var(--color-brand-500)]` — 회색 무시
❌ 그림자 강조: 와이어에선 border만, shadow 금지
❌ 라운드 과다: `rounded-3xl`처럼 과한 라운드. `--radius-md`나 `--radius-lg`만
❌ 회색에 H/C 추가: `oklch(0.5 0.1 260)` — 회색이 아님. chroma 0이어야 함
