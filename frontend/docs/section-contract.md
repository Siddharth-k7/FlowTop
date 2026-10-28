# Flowtop Page Sections Contract & Normalization Specification

> **Status:** Phase 2 Contract Complete. Pending Dev A merge into `shared/types` and Dev D / Dev B alignment meeting.
> **Owner Seam:** Dev C (renders sections), Dev D (builds CMS editor), Dev B (validates and stores in database), Dev A (maintains `shared/types`).

---

## Change Log & Alignment Record

| Date | Author | Seam / Topic | Decisions & Changes Recorded |
|---|---|---|---|
| 2026-10-27 | Dev C | Contract Alignment | Initial specification created for all 6 section types, shared layout block, runtime normalization rules, and fixtures. |
| *Pending* | Dev D, C, B | CMS Editor Seam | Alignment on editor form output vs normalizer input, device preview mechanism (iframe vs viewport override), and reserved slug protection. |

---

## Core Normalization Rules

Every section payload passed from the CMS or API passes through `normalizeSection()` in `@flowtop/ui`:
1. **Missing Required Fields:** Returns `null`. The renderer skips the section entirely and logs a console warning: `[SectionRenderer] Skipped section "<id>" (type: <type>) due to missing required fields.` Never crash the page.
2. **Unknown Enum Values:** Falls back to the contract's default value for that field (derived from `const` arrays).
3. **Unknown Extra Keys:** Stripped and ignored.
4. **Empty Strings:** Count as absent (converted to `null` or triggering required-field failure).
5. **Arrays:** Invalid entries (non-strings, empty strings, malformed CTA objects) are dropped.
6. **Strict Types:** 100% TypeScript strict, zero `any`, runtime narrowing with type guards.

---

## 0. Shared Layout Block

Carried by every section config under the `layout` property.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `background` | `string` | `'white'`, `'pale'`, `'deep'`, `'black'`, `'image'` | Optional | `'white'` | Falls back to `'white'`. Maps to semantic token background classes (`bg-surface-solid`, `bg-surface-light`, `bg-primary`, `bg-surface-inverse`). |
| `spacingTop` | `string` | `'none'`, `'small'`, `'medium'`, `'large'` | Optional | `'medium'` | Falls back to `'medium'` (`pt-space-8 md:pt-space-12`). |
| `spacingBottom` | `string` | `'none'`, `'small'`, `'medium'`, `'large'` | Optional | `'medium'` | Falls back to `'medium'` (`pb-space-8 md:pb-space-12`). |
| `width` | `string` | `'contained'`, `'wide'`, `'full'` | Optional | `'contained'` | Falls back to `'contained'`. Controls max-width constraint (`container-page`, `max-w-7xl`, or `w-full`). |
| `align` | `string` | `'left'`, `'center'`, `'right'` | Optional | `'left'` | Falls back to `'left'` text and content alignment. |

---

## 1. Hero Section (`hero`)

Full-bleed or contained visual banner with typography, media background (image or video), and action links.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `headline` | `string` | Non-empty string | **Required** | *None* | If absent or empty string, section is invalid; normalizer returns `null` and skips render. |
| `subheading` | `string \| null` | String or null | Optional | `null` | If absent, empty, or null, subheading element is omitted from the DOM. |
| `mediaType` | `string` | `'image'`, `'video'` | Optional | `'image'` | Falls back to `'image'`. Determines whether image or video player is rendered. |
| `desktopImageId` | `string \| null` | UUID / Media asset ID | **Required if mediaType is 'image'** | `null` | If `mediaType === 'image'` and field is absent or empty, normalizer returns `null` and skips section. |
| `mobileImageId` | `string \| null` | UUID / Media asset ID | Optional | `null` | If provided, rendered for mobile viewports using `<picture>` / responsive Next.js Image. Falls back to `desktopImageId` if absent. |
| `videoUrl` | `string \| null` | Valid URL | **Required if mediaType is 'video'** | `null` | If `mediaType === 'video'` and field is absent or empty, normalizer returns `null` and skips section. |
| `overlay` | `string` | `'none'`, `'light'`, `'medium'`, `'strong'` | Optional | `'medium'` | Falls back to `'medium'`. Applies background gradient/scrim over media to guarantee WCAG AAA text contrast. |
| `textPosition` | `string` | `'top-left'`, `'top-center'`, `'top-right'`, `'center-left'`, `'center'`, `'center-right'`, `'bottom-left'`, `'bottom-center'`, `'bottom-right'` | Optional | `'bottom-left'` | Falls back to `'bottom-left'`. 9-point flexbox alignment grid inside the hero frame. |
| `ctas` | `SectionCta[]` | Array of `{ label, href, style? }` | Optional | `[]` | Invalid CTA objects are dropped. Rendered as primary/secondary action buttons. If empty, CTA container is omitted. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |

---

## 2. Product Carousel Section (`product_carousel`)

Horizontal swipeable carousel of products loaded via placement, manual ID list, or catalogue rule.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `heading` | `string` | Non-empty string | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. |
| `source` | `string` | `'placement'`, `'manual'`, `'rule'` | Optional | `'placement'` | Falls back to `'placement'`. Decides data resolution strategy. |
| `placementLocation` | `string \| null` | Placement key / UUID (`'featured'`, `'new_arrivals'`, `'bestsellers'`, `'recommended'`, etc.) | Optional | `'featured'` | If `source === 'placement'`, queries `api.getPlacements(location)`. Falls back to `'featured'` if absent. |
| `productIds` | `string[]` | Array of UUIDs | Optional | `[]` | Used when `source === 'manual'`. Invalid entries (empty strings, non-strings) are dropped. |
| `rule` | `object \| null` | `{ type: 'newest', categoryId?: string \| null }` | Optional | `null` | Used when `source === 'rule'`. If invalid, falls back to newest catalogue query. |
| `count` | `number` | Integer $\ge 1$ | Optional | `8` | Maximum number of products to render in the carousel. Non-integer or $< 1$ falls back to `8`. |
| `cardStyle` | `string` | `'standard'`, `'compact'`, `'editorial'` | Optional | `'standard'` | Falls back to `'standard'`. Selects `ProductCard` visual layout variant. |
| `viewAllHref` | `string \| null` | Relative or absolute path | Optional | `null` | If present, renders an accessible "View All" link in the carousel header. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |

---

## 3. Collection Showcase Section (`collection_showcase`)

Editorial hero banner highlighting an architectural collection and featured pieces.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `collectionId` | `string` | Collection UUID or slug | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. |
| `coverImageId` | `string \| null` | UUID / Media asset ID | Optional | `null` | If absent, falls back to the collection's primary `heroImage`. |
| `description` | `string \| null` | String or null | Optional | `null` | If absent, falls back to the collection's own `tagline` or `description`. |
| `productIds` | `string[]` | Array of UUIDs | Optional | `[]` | Specific fixtures to feature in the showcase. Invalid items dropped. If empty, displays collection's top fixtures. |
| `variant` | `string` | `'split'`, `'stacked'`, `'overlay'` | Optional | `'split'` | Falls back to `'split'`. Controls visual layout composition between cover imagery and featured products. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |

---

## 4. Image Text Section (`image_text`)

50/50 or asymmetric editorial split with photography, rich typography, and optional CTA.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `heading` | `string` | Non-empty string | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. |
| `body` | `string` | HTML markup string | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. Rendered securely according to sanitisation rules. |
| `imageId` | `string` | UUID / Media asset ID | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. |
| `mobileImageId` | `string \| null` | UUID / Media asset ID | Optional | `null` | Optional mobile crop. Falls back to `imageId` if absent. |
| `imageSide` | `string` | `'left'`, `'right'` | Optional | `'left'` | Falls back to `'left'`. Controls whether image is positioned on the left or right of the text block on desktop. |
| `ratio` | `string` | `'50-50'`, `'60-40'`, `'40-60'` | Optional | `'50-50'` | Falls back to `'50-50'`. Column distribution across 12-column grid (`6/6`, `7/5`, or `5/7`). |
| `mobileOrder` | `string` | `'image-first'`, `'text-first'` | Optional | `'image-first'` | Falls back to `'image-first'`. Stacking order on mobile viewports (< 768px). |
| `cta` | `SectionCta \| null` | `{ label, href, style? }` | Optional | `null` | If missing label or href, dropped to `null`. If present, renders action button below text. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |

---

## 5. Gallery Section (`gallery`)

Multi-image grid, masonry, or slider for installations and architectural photography.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `heading` | `string \| null` | String or null | Optional | `null` | If absent, header is omitted. |
| `imageIds` | `string[]` | Array of UUIDs | **Required** | *None* | Must contain at least 1 valid non-empty string ID. If empty or absent, normalizer returns `null` and skips section. |
| `variant` | `string` | `'grid'`, `'masonry'`, `'slider'` | Optional | `'grid'` | Falls back to `'grid'`. Selects layout presentation format. |
| `columns` | `number` | `2`, `3`, `4` | Optional | `3` | Number of columns on desktop viewports ($\ge 1024\text{px}$). Any value outside 2, 3, 4 falls back to `3`. |
| `showCaptions` | `boolean` | `true`, `false` | Optional | `true` | If `false`, suppresses media caption/alt overlays under gallery images. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |

---

## 6. CTA Section (`cta`)

High-impact call-to-action banner for consultation inquiries, showroom appointments, or architectural catalog downloads.

| Field | Type | Allowed Values | Req / Opt | Default | Renderer Behaviour when Absent or Unknown |
|---|---|---|---|---|---|
| `heading` | `string` | Non-empty string | **Required** | *None* | If absent or empty string, normalizer returns `null` and skips section. |
| `body` | `string \| null` | String or null | Optional | `null` | Explanatory description. Omitted if absent. |
| `mode` | `string` | `'button'`, `'download'` | Optional | `'button'` | Falls back to `'button'`. Determines whether action navigates to URL or initiates secure asset download. |
| `cta` | `SectionCta \| null` | `{ label, href, style? }` | Optional | `null` | Rendered when `mode === 'button'`. Dropped if missing label or href. |
| `documentId` | `string \| null` | UUID / Media asset ID | Optional | `null` | Used when `mode === 'download'`. Links directly to authenticated media download stream. |
| `layout` | `SectionLayout` | Valid layout object | Optional | *Default layout* | Passes through `normalizeLayout()`. |
