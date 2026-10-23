# @flowtop/ui

Shared design tokens, Tailwind v3 preset, and component kit for Flowtop.
Owned by **Dev C**. Imported by `frontend/` and `admin/` (Dev D).
See [`COMPONENTS.md`](./COMPONENTS.md) for full component specifications, props tables, and verbatim-compilable usage examples.

---

## Guide for Dev D (Importing into `admin/`)

Follow these exact steps to use `@flowtop/ui` in `admin/`:

### 1. Link the package in `admin/package.json`

```json
{
  "dependencies": {
    "@flowtop/ui": "file:../packages/ui"
  }
}
```

Then run `npm install` inside `admin/` (or from workspace root).

### 2. Configure `admin/tailwind.config.js`

Add the Flowtop preset and include `@flowtop/ui` in your `content` paths:

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [
    require('@flowtop/ui/tailwind-preset'),
  ],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
};
```

### 3. Import CSS in `admin/src/app/globals.css` (or main CSS file)

```css
@import "@flowtop/ui/tokens.css";
@import "@flowtop/ui/base.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## Token & Class Cheat Sheet

Tailwind's default scales have been **completely replaced** with Flowtop design tokens. While arbitrary values (such as `bg-[#123456]` or `p-[18px]`) are syntactically supported by Tailwind's engine and are not blocked from compiling, they are strictly banned by project convention and checked by `scripts/check.mjs`. Use only Flowtop token classes.

### 1. Colours

| Utility | Token Property | Description |
|---|---|---|
| `bg-purple-deep`, `text-purple-deep` | `--color-purple-deep` (`#5B2A86`) | Flowtop primary deep purple |
| `bg-purple-light`, `text-purple-light` | `--color-purple-light` (`#9B6FC4`) | Accent / focus ring purple |
| `bg-purple-pale`, `text-purple-pale` | `--color-purple-pale` (`#F4EEFA`) | Pale purple tint |
| `bg-ink`, `text-ink` | `--color-ink` (`#16121C`) | Dark text & surface-inverse |
| `bg-white`, `text-white` | `--color-white` (`#FFFFFF`) | Pure white |
| `bg-grey-50` ... `bg-grey-900` | `--color-grey-50`...`900` | Purple-tinted neutral grey scale |
| `bg-primary`, `text-primary` | Role tokens | Primary brand action & accent colour (`#5B2A86` purple) |
| `text-fg`, `text-fg-muted` | Role tokens | Body text (`#16121C` ink) vs secondary text (`#635A73` grey-600) |
| `bg-surface`, `bg-surface-solid` | Role tokens | Page background vs Card background |
| `border-border`, `border-border-input` | Role tokens | Default card border vs Input field border |
| `bg-success`, `bg-success-tint` | Semantic tokens | Success states |
| `bg-warning`, `bg-warning-tint` | Semantic tokens | Warning states |
| `bg-error`, `bg-error-tint` | Semantic tokens | Error states |
| `bg-info`, `bg-info-tint` | Semantic tokens | Informational states |

### 2. Spacing (4px base)

| Class | Pixel Equivalent | Token |
|---|---|---|
| `p-space-1`, `m-space-1`, `gap-space-1` | `4px` (`0.25rem`) | `--space-1` |
| `p-space-2`, `m-space-2`, `gap-space-2` | `8px` (`0.5rem`) | `--space-2` |
| `p-space-3`, `m-space-3`, `gap-space-3` | `12px` (`0.75rem`) | `--space-3` |
| `p-space-4`, `m-space-4`, `gap-space-4` | `16px` (`1rem`) | `--space-4` |
| `p-space-5`, `m-space-5`, `gap-space-5` | `24px` (`1.5rem`) | `--space-5` |
| `p-space-6`, `m-space-6`, `gap-space-6` | `32px` (`2rem`) | `--space-6` |
| `p-space-7`, `m-space-7`, `gap-space-7` | `48px` (`3rem`) | `--space-7` |
| `p-space-8`, `m-space-8`, `gap-space-8` | `64px` (`4rem`) | `--space-8` |
| `h-touch`, `w-touch` | `44px` (`2.75rem`) | `--size-touch` (Min touch target) |

### 3. Border Radii

| Class | Pixel Equivalent | Intended Usage |
|---|---|---|
| `rounded-none` | `0` | Hard edges |
| `rounded-sm` | `12px` (`0.75rem`) | Inputs, select boxes, small badges |
| `rounded-md` | `24px` (`1.5rem`) | Cards, dialogs, modals |
| `rounded-lg` | `40px` (`2.5rem`) | Large hero panels, drawers, banners |
| `rounded-pill` | `9999px` | Buttons, chips, pill badges |

### 4. Shadows (Subtle, Purple-Tinted)

| Class | Description |
|---|---|
| `shadow-none` | No shadow |
| `shadow-sm` | Inputs, dropdown menus |
| `shadow-md` | Cards, popovers |
| `shadow-lg` | Modals, drawers, elevated banners |

### 5. Typography

| Class | Style |
|---|---|
| `text-caption` | 12px / 16px line-height |
| `text-small` | 14px / 20px line-height |
| `text-body` | 16px / 24px line-height |
| `text-title` | Fluid 20px to 26px (clamp) |
| `text-headline` | Fluid 28px to 44px (clamp) |
| `text-display` | Fluid 40px to 72px (clamp) |
| `font-display` | Display typeface (Helvetica Neue / display face) |
| `font-body` | Body typeface (system-ui stack) |
| `font-light` | 300 weight (headings) |
| `font-regular` | 400 weight |
| `font-medium` | 500 weight |
| `font-semibold` | 600 weight |

### 6. Overlay Max Heights

| Class | Value | Token | Intended Usage |
|---|---|---|---|
| `max-h-dialog` | `85vh` | `--max-h-dialog` | Desktop modal dialogs and bottom drawer sheets |
| `max-h-sheet` | `90vh` | `--max-h-sheet` | Mobile bottom sheet modals (preserves 10vh top backdrop) |

### 7. Breakpoints (Single Source of Truth)

Breakpoints are defined once in `packages/ui/src/tokens.css` as the single source of truth:
- `--breakpoint-xs: 360px`
- `--breakpoint-md: 768px`
- `--breakpoint-lg: 1024px`
- `--breakpoint-xl: 1440px`

`packages/ui/tailwind-preset.cjs` parses `tokens.css` directly. If `tokens.css` is missing or any required breakpoint (`xs`, `md`, `lg`, `xl`) is absent, it throws a descriptive error immediately with no silent fallback.
For JavaScript/TypeScript consumers, `packages/ui/src/index.ts` re-exports `BREAKPOINTS` and `Breakpoint` typed helpers, and `packages/ui/scripts/check.mjs` strictly asserts that `index.ts` matches `tokens.css`.

### 8. Special Component Classes & Utilities

- `.container-page`: Standard page container with responsive gutters and max-width (`1440px`).
- `.container-wide`: Wide layout container (`1680px`) for wide sections.
- `.focus-ring`: Accessible 2px focus ring using `--focus-ring` with 2px offset on `:focus-visible`.
- `.touch-target`: Enforces 44px min-width and min-height for mobile accessibility.
- `.scrollbar-none`: Hides scrollbars across WebKit, Firefox, and Edge while retaining scroll capability.
- `transition`, `transition-colors` and the other `transition-*` utilities default to `--duration-fast` and `--ease-standard` (preset `transitionDuration.DEFAULT` / `transitionTimingFunction.DEFAULT`), so a bare `transition-colors` uses the motion tokens rather than Tailwind's built-in 150ms `cubic-bezier(0.4, 0, 0.2, 1)`.
- `.animate-in`, `.fade-in`, `.zoom-in-95`, `.slide-in-from-*`: Preset entry animation utilities utilizing `--duration-base` and `--ease-standard`, honoring `prefers-reduced-motion`.

### 9. Component-Scoped Dimensions & Rationale

A small number of component-internal ergonomic defaults are deliberately maintained as component-scoped properties rather than promoted to global tokens:
- **`Menu` (`min-w-[12rem]` / 192px)**: Intrinsic minimum width for the action dropdown popover. Ensures that menu action items have adequate tap target width and text legibility even if menu item labels are short (e.g. "Edit", "Copy"), preventing awkward narrow dropdowns without imposing a rigid global dimension across unrelated controls.
- **`Textarea` (`min-h-[5rem]` / 80px)**: Initial minimum height for the multiline `<textarea>` control (approx. 3 lines of text with 12px padding). Guarantees an immediate visual distinction from single-line `<Input>` before user vertical resizing (`resize-y`).

