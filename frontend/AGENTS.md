# frontend/

The public Flowtop website. Next.js App Router. Owned by Dev C.

Dev C also owns `packages/ui/`, which `admin/` imports. Changing a component there affects Dev D, so treat it as a shared contract rather than private code.

## Brand

Purple, light purple, black, white. Restrained and premium. Generous whitespace, strong typography, large considered imagery. This is a high-end bathroom brand, not a hardware catalogue.

```
--purple-deep    #5B2A86
--purple-light   #9B6FC4
--purple-pale    #F4EEFA
--ink            #16121C
--white          #FFFFFF
```

Plus a neutral grey scale and semantic colours for success, warning, error and info. Nothing else without asking.

## Rules

**Every value comes from a token.** No hex codes, no pixel values, no arbitrary Tailwind values in a component. If the token you need does not exist, add it to the token file, do not inline it.

**Mobile first.** Nothing scrolls sideways at 360px. Touch targets at least 44px. Test at 360, 768 and 1440 before calling anything done.

**Server components by default.** Reach for `'use client'` only when the component genuinely needs interaction or browser APIs. Product pages, listings and CMS pages are server rendered for SEO.

**Render only what exists.** A product with no weight shows no weight row. Not an empty label, not a dash, not a blank cell. Filter empty values before rendering.

**Images:** always `next/image`, always explicit dimensions, lazy below the fold, eager only for the hero. Every image needs alt text; decorative ones get `alt=""`.

**Never calculate money.** Cart totals, tax, shipping and discounts come from the API response and are displayed as received. Adding numbers in JavaScript is how prices drift.

**Never read payment success from the URL.** After the gateway redirect, show a confirming state and poll the API until it reports verified. The redirect parameters mean nothing.

**Never fake a success.** If the API did not confirm, show the error and keep what the user typed.

## Sections

The homepage and every CMS page are built from six section components. The CMS decides which ones appear and in what order.

```
HeroSection
ProductCarouselSection
CollectionShowcaseSection
ImageTextSection
GallerySection
CtaSection
SectionRenderer        reads the ordered list, draws the right component
```

Rules for all of them:

- Each takes a typed config object matching `docs/03-api-contract.md`. **This shape is shared with Dev D, who builds the editor for it. Changing it is a conversation, not a commit.**
- Every style option is an enum from the presets. Never a free-form colour, size or spacing value.
- Sections with images take a separate mobile image, so staff can use a portrait crop on phones.
- Optional fields may be empty. Render sensibly, do not leave a gap or break the layout.
- Unknown section type: log it and render nothing. Never crash the page.

## Accessibility

- Keyboard reachable, with a visible focus ring
- Real labels on every field, not placeholders standing in
- Errors tied to their field with `aria-describedby`
- One `h1` per page, no skipped heading levels
- Contrast 4.5:1 for text. Light purple on white is the likely failure, check it.
- `prefers-reduced-motion` suppresses non-essential animation
- Skip-to-content link

## Performance

- Target LCP under 2.5s on mobile 4G
- Responsive sizes, modern formats
- Self-hosted fonts, preload only the weights used
- Code split anything heavy
- Explicit dimensions everywhere to keep layout shift near zero

## When the API is not ready

Build against a typed mock in `lib/mocks/` matching the contract exactly, and tag it `TODO: swap for real API`. Never wait on the backend.

## Checklist before opening a PR

- [ ] No hex codes or raw pixel values outside the token file
- [ ] Tested at 360px, no sideways scroll
- [ ] Keyboard reachable, focus visible
- [ ] Images have dimensions and alt text
- [ ] No money arithmetic in JavaScript
- [ ] Empty optional fields render cleanly
- [ ] Error states tested, not just the happy path
