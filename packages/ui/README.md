# @flowtop/ui

Shared design tokens, Tailwind v3 preset, and component kit for Flowtop.
Owned by **Dev C**. Imported by `frontend/` and `admin/` (Dev D).

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

Tailwind's default scale has been **completely replaced**. Only Flowtop token classes exist. Arbitrary hex codes, arbitrary pixel brackets (`p-[18px]`), and default colors (`bg-red-500`) will not compile.

### 1. Colours

| Utility | Token Property | Description |
|---|---|---|
| `bg-purple-deep`, `text-purple-deep` | `--color-purple-deep` (`#5B2A86`) | Flowtop primary deep purple |
| `bg-purple-light`, `text-purple-light` | `--color-purple-light` (`#9B6FC4`) | Accent / focus ring purple |
| `bg-purple-pale`, `text-purple-pale` | `--color-purple-pale` (`#F4EEFA`) | Pale purple tint |
| `bg-ink`, `text-ink` | `--color-ink` (`#16121C`) | Dark text & surface-inverse |
| `bg-white`, `text-white` | `--color-white` (`#FFFFFF`) | Pure white |
| `bg-grey-50` ... `bg-grey-900` | `--color-grey-50`...`900` | Purple-tinted neutral grey scale |
| `bg-primary`, `text-primary` | Role tokens | Primary brand action colour |
| `bg-surface`, `bg-surface-solid` | Role tokens | Page background vs Card background |
| `text-primary`, `text-muted` | Role tokens | `#16121C` (ink) vs `#635A73` (grey-600) |
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

### 6. Special Component Classes & Utilities

- `.container-page`: Standard page container with responsive gutters and max-width (`1440px`).
- `.container-wide`: Wide layout container (`1680px`) for wide sections.
- `.focus-ring`: Accessible 2px focus ring using `--focus-ring` with 2px offset on `:focus-visible`.
- `.touch-target`: Enforces 44px min-width and min-height for mobile accessibility.
