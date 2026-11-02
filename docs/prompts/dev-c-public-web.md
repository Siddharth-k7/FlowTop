# Dev C - Public Website

**Your scope:** `frontend/` entirely, plus `packages/ui/`

**Not your scope:** `backend/` is Dev A and Dev B. `admin/` is Dev D.

**You own `packages/ui/`, and Dev D imports it.** That makes it a shared contract, not private code. Dev D is blocked until you ship it.

---

## How to use this file

Run the prompts in order. After each phase, run the checks, then post the "send for review" block.

**Your first deadline is day 4, not week 2.** Dev D cannot build a single admin screen without your design tokens and the ten core components. Ship them rough on day 4, then keep improving while he builds. A beautiful design system on day 8 costs him half a phase.

When an endpoint does not exist yet, build against a typed mock matching `docs/03-api-contract.md` exactly. Never wait for the backend.

---

## PROMPT 0 - Orient

```
Read these before writing any code:
- AGENTS.md at the repo root
- frontend/AGENTS.md
- docs/03-api-contract.md, especially ProductCard, ProductDetail and the six
  section config shapes
- docs/02-mvp-scope.md
- docs/06-conventions.md

Then tell me, in your own words:
1. What I own and what belongs to Dev D
2. Why Dev D is blocked on me in week 1, and what exactly he needs
3. The rule about money and why the frontend never adds anything up
4. Why I never read payment success from the URL

Do not write any code yet.
```

---

# PHASE 1 - Design system and shell (Weeks 1 to 2)

## Prompt 1.1 - Scaffold and tokens

```
Set up frontend/ and packages/ui/.

frontend/: Next.js App Router, TypeScript strict, Tailwind.
packages/ui/: a workspace package both frontend and admin import.

In packages/ui/src/tokens.css define CSS custom properties:

Colours:
--color-purple-deep  #5B2A86
--color-purple-light #9B6FC4
--color-purple-pale  #F4EEFA
--color-ink          #16121C
--color-white        #FFFFFF
Plus a neutral grey scale 50 to 900, and semantic success, warning, error,
info.

Type scale: 6 sizes from caption to display, each with a line height.
Spacing: 8 steps on a 4px base.
Radius: 3 steps. Shadow: 3 steps, very subtle, this is a premium brand.
Breakpoints: 360, 768, 1024, 1440. Container widths per breakpoint.

Wire all of it into the Tailwind config as theme values, so components write
bg-purple-deep and p-space-4, never raw values.

Set up admin/ to import the same package, so both apps share one visual
language.
```

## Prompt 1.2 - The ten core components, ship by day 4

```
Build the ten components Dev D needs first. He is blocked until these exist,
so correct and plain beats beautiful. Polish comes later.

Button, with primary, secondary, ghost and danger variants, each with
loading and disabled states.
Input. Select. Card. Modal. Table, with sortable headers, an empty state and
a loading skeleton. Toast. Badge. Tabs. Spinner.

For every one:
- Every value from the tokens, no hardcoded colours or sizes
- Keyboard reachable with a visible focus ring
- Correct ARIA roles
- Modal traps focus and closes on Escape, restoring focus on close
- Touch targets at least 44px on mobile
- Typed props, no any

Export them from packages/ui. Tell Dev D the moment they are pushed.
```

## Prompt 1.3 - The rest of the UI kit and the style guide

```
Finish the component library.

Drawer, Checkbox, Radio, Switch, Textarea, Tooltip, Pagination, EmptyState,
Breadcrumbs, Skeleton.

Then build /style-guide in frontend/, showing:
- Every colour with its token name and hex
- The full type scale
- The spacing scale as bars
- Every component, every variant, every state, clickable

This page is how Dev D discovers what exists without reading code, and how
we both check nothing drifted. Keep it current.
```

## Prompt 1.4 - Public shell

```
Build the public site shell.

Header:
- Flowtop wordmark left
- Desktop: horizontal nav supporting one level of dropdown
- Mobile: hamburger opening a full-screen slide-in menu
- Right: search icon, cart icon with a count badge
- Sticky on scroll with a subtle background change

Footer: four link columns, newsletter box, social icons, legal line.

The menu items come from a prop, never hardcoded. The CMS feeds this later.
For now create lib/mocks/navigation.ts with the default Flowtop structure,
tagged TODO.

Also: root layout, 404 page, error boundary, loading skeletons.

Test at 360, 768 and 1440. No sideways scroll at any width.
```

## Prompt 1.5 - API client

```
Build lib/api.ts.

- Base URL from an environment variable
- Credentials included, because the cart uses a cookie
- Typed request and response using shared/types
- Parses the error envelope from docs/03-api-contract.md and throws a typed
  error carrying code, message and fields
- A mock mode flag so every screen can be built before the backend exists
- Request timeout and one retry on a network failure, never on a 4xx

Create lib/mocks/ with typed fixtures matching the contract EXACTLY. Every
mock file is tagged TODO so one grep finds them all on swap day.

Use Dev B's seed data as the source for the mock values, so screens look
real rather than full of "Test Product 1".
```

---

## ✅ PHASE 1 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | **Day 4: ten components pushed** | Dev D confirms he is unblocked |
| 2 | Open /style-guide | Every token and component state visible on one page |
| 3 | Grep for hex colours outside tokens.css | Zero results |
| 4 | Grep for `: any` | Zero results |
| 5 | Public site at 360px | No sideways scroll, hamburger works |
| 6 | Tab through the header with no mouse | Focus visible, order sensible |
| 7 | Open a Modal, press Escape | Closes, focus returns to the trigger |
| 8 | Turn on mock mode with the backend off | Every page still renders |
| 9 | Diff a mock against the contract | Identical, field for field |

### Send for review

```
Phase 1 done. For review:
- Screenshot of /style-guide
- Confirmation from Dev D that the UI kit unblocked him, and on which day
- tokens.css
- lib/api.ts
- Results of checks 1 to 9
```

---

# PHASE 2 - Product pages (Weeks 3 to 4)

## Prompt 2.1 - Product card

```
Build ProductCard, used on listings, carousels and related sections.

- Primary image, swapping to a second image on hover
- Name, price, strikethrough original when on sale
- Finish swatches as small colour dots
- A badge when the API sends one, remembering the badge comes from the
  placement for that location, not from the product
- Quick WhatsApp icon
- Three card styles from the contract: standard, compact, editorial
- Skeleton variant for loading

Images use next/image with explicit dimensions and a blur placeholder.

4 columns on desktop, 2 on tablet, 2 on mobile.
```

## Prompt 2.2 - Product detail page

```
Build the product detail page at app/products/[slug].

Desktop layout:
- Left: gallery, large main image, thumbnail strip, click to zoom
- Right: name, SKU, price, short description, finish picker as swatches,
  quantity, Add to Cart, WhatsApp enquiry
- Below: full description, specifications, documents
- Then: related products, Complete the Look

Mobile: gallery full width at the top, swipeable. Sticky Add to Cart bar at
the bottom of the viewport.

Rules:
- The spec table renders exactly what the API sends. The API already removes
  empty values, so never render a label without a value, and never add a
  dash.
- Changing finish swaps the image and the price with no page reload and no
  refetch, the variants are already in the response
- An enquiry-only product hides Add to Cart and shows WhatsApp prominently
- An unavailable product shows the availability message and disables the
  button
- The price comes from the API. Never compute a discount or a total.

Server rendered for SEO. Include product structured data.
```

## Prompt 2.3 - Listings and filters

```
Build app/products and app/category/[slug].

- Responsive product grid
- Filter sidebar on desktop, bottom sheet on mobile: category, finish, price
  range, availability
- Sort: newest, price low to high, price high to low, name
- Filter state lives in the URL query string, so a filtered view can be
  shared and survives a refresh
- Active filters shown as removable chips, plus a clear all
- Result count
- Empty state when nothing matches
- Pagination that works without JavaScript, for SEO
- Skeleton cards while loading, matching the real card shape

Debounce filter changes so a slider does not fire thirty requests.
```

## Prompt 2.4 - Collection pages

```
Build app/collections and app/collections/[slug].

Index: grid of collection cards with hero image, name, product count.

Detail:
- Full-bleed hero with the collection image and name
- The story section. This is where the premium brand lives, so give it real
  editorial design: large type, generous whitespace, asymmetric image
  placement. Not a blog post layout.
- Products in the collection, in the exact order the admin ranked them
- A finish strip when the collection shares finishes
- Related collections at the bottom

Read frontend/AGENTS.md on brand before you start this one. It is the page
Flowtop will judge the design on.
```

---

## ✅ PHASE 2 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | A product with an empty weight field | No weight row, no empty label, no dash |
| 2 | Switch finish | Image and price change, no reload, no network call |
| 3 | An enquiry-only product | No Add to Cart, WhatsApp prominent |
| 4 | An unavailable product | Message shown, button disabled |
| 5 | Product page at 360px | Sticky bar works, gallery swipes |
| 6 | Apply two filters, copy the URL, open in a new tab | Same results |
| 7 | Refresh with filters applied | Filters survive |
| 8 | Drag a price slider | Debounced, not one request per pixel |
| 9 | A category with no products | Proper empty state |
| 10 | Open a product URL that does not exist | Clean 404 |
| 11 | Disable JavaScript, load a product page | Content and specs still readable |
| 12 | Validate product structured data | No errors |

### Send for review

```
Phase 2 done. For review:
- Screenshots of the product page, desktop and 360px
- Screenshot of the collection detail page
- Recording of the finish switch
- Results of checks 1 to 12
- Confirmation that my mocks matched Dev B's real responses when I swapped
```

---

# PHASE 3 - Sections and the dynamic site (Weeks 5 to 6)

The homepage stops being a design and becomes whatever the CMS says.

## Prompt 3.1 - The section contract

```
Before building anything, read the six section config shapes in
docs/03-api-contract.md and build the TypeScript types for them in
shared/types.

Then sit with Dev D and confirm, field by field, that:
- The shape I render is the shape his editor produces
- Every style option is an enum, not a free string
- Optional fields are genuinely optional and I handle them being absent

This is the seam most likely to cause rework. Spend the hour now.

Report back what, if anything, we changed, because a change needs Dev A and
Dev B to agree too.
```

## Prompt 3.2 - The six sections

```
Build the six public section components in components/sections/.

1. HeroSection
   headline, subheading, image or video, separate mobile image, overlay
   strength, text position on a 9-point grid, up to two CTAs

2. ProductCarouselSection
   heading, source (placement, manual or rule), count, card style, arrows
   and dots, swipe on mobile, view all link

3. CollectionShowcaseSection
   collection, cover image or video, description, selected products, three
   layout variants

4. ImageTextSection
   image, heading, body, CTA, column ratio, image side, mobile stacking
   order

5. GallerySection
   images, grid or masonry or slider, columns, captions, lightbox

6. CtaSection
   heading, body, button or document download

Shared rules for all six:
- Every style option comes from the preset enums, never an arbitrary value
- The layout block applies the same way everywhere: background, spacing,
  width, alignment
- Images with a mobile slot use it below 768px
- Lazy load below the fold, explicit dimensions to stop layout shift
- Respect prefers-reduced-motion
- Work at 360px with no sideways scroll
- Render sensibly when an optional field is empty, no gaps, no broken grid
```

## Prompt 3.3 - Section renderer and dynamic pages

```
Build SectionRenderer and wire up the dynamic pages.

SectionRenderer takes the ordered section array from the API and renders the
right component for each, skipping hidden ones. One typed switch. An unknown
type logs a warning and renders nothing, it never crashes the page.

Then:
- Rebuild app/page.tsx to render from sections. The homepage is no longer a
  hardcoded design.
- Build app/[slug]/page.tsx so any CMS page works the same way, used for
  campaign landing pages
- Wire the header and footer to the navigation API, replacing the mock

Server rendered. Cache appropriately but revalidate on publish, Dev A's
caching layer handles the backend side.
```

## Prompt 3.4 - Journal

```
Build the public journal.

- app/journal, index with category filtering and pagination
- app/journal/[slug], the article page

Article page: hero image, title, author, date, category, body as HTML from
the CMS, and related products as cards at the bottom.

Sanitise the HTML body. The CMS restricts what editors can enter, but never
trust that on render.

Readable typography. Measure around 65 to 75 characters, generous line
height. This is long-form reading, not a product grid.

Share buttons and article structured data.
```

---

## ✅ PHASE 3 CHECKS

### AT-03, the homepage test

| # | Check | Pass when |
|---|---|---|
| 1 | Dev D reorders sections and publishes | Public homepage matches, in order |
| 2 | Dev D duplicates a section and changes its content | Both render, layout preserved |
| 3 | Dev D hides a section | Absent from the public page |
| 4 | Dev D creates a campaign page at /opel-launch | Page renders at that URL |

### Section robustness

| # | Check | Pass when |
|---|---|---|
| 5 | A hero with no subheading and no CTA | Renders cleanly, no gap |
| 6 | A carousel with 2 products when count is 8 | Renders 2, no empty slots |
| 7 | A page with zero sections | Renders empty, does not crash |
| 8 | An unknown section type in the response | Logged, skipped, page still renders |
| 9 | Every section at 360px | No sideways scroll |
| 10 | A hero with a mobile image set | Mobile uses the portrait crop |
| 11 | prefers-reduced-motion on | Carousel autoplay and parallax suppressed |
| 12 | Journal body containing a script tag | Sanitised, not executed |

### Send for review

```
Phase 3 done. For review:
- Screenshots of the homepage built entirely from CMS sections
- Confirmation from Dev D that the section config shapes match exactly
- What we changed in the section contract, if anything
- Results of checks 1 to 12
```

---

# PHASE 4 - Commerce and contact (Weeks 7 to 8)

## Prompt 4.1 - Cart

```
Build the cart.

AddToCartButton:
- Sends productId, variantId and quantity. NOTHING ELSE.
- Never sends a price. Add a comment saying so, because this is a real
  attack vector and the next person to touch this file needs to know.
- Loading state while in flight, success feedback after

CartDrawer, sliding in from the right when something is added:
- Line items with thumbnail, name, finish, quantity stepper, line total,
  remove
- Subtotal, shipping, tax, total, all taken from the API response
- NEVER add anything up in JavaScript
- Warnings array rendered, so a product that became unavailable shows a
  message rather than silently vanishing
- Empty state
- Checkout and Continue Shopping

Cart page at /cart, same content in a full page layout.

Optimistic UI on quantity change, rolling back with an error toast if the
API rejects it.
```

## Prompt 4.2 - Checkout

```
Build checkout at /checkout. Guest only. Never show a login prompt.

Three steps, a stepper on mobile:
1. Contact: name, email, phone with country code
2. Delivery: address lines, city, state dropdown, PIN code, landmark, notes
3. Review: summary, edit links back, terms checkbox, Pay

Rules:
- Validate each step before allowing the next
- Indian PIN code, 6 digits. Indian phone, 10 digits with optional +91.
- Every total comes from the API. No arithmetic anywhere in this flow.
- Pay hands off to the gateway using the handoff object from the contract

THE CRITICAL PART, after the gateway redirect:
- Show a "confirming your payment" state
- Poll GET /orders/:reference/status until paymentStatus is paid or failed
- NEVER read success from the redirect URL parameters. Anyone can type that
  URL. The redirect proves nothing.
- Confirmation page on paid: reference, items, address, what happens next,
  a WhatsApp link
- Failure page on failed: what went wrong, not charged, try again, contact
  support
- A sensible timeout on the poll, with a "we are still checking, here is
  your reference" state rather than an infinite spinner

Keep the design calm and uncluttered. People abandon ugly checkouts.
```

## Prompt 4.3 - WhatsApp and forms

```
1. WhatsApp:

FloatingWhatsAppButton on every public page, bottom right, above mobile
sticky bars, hidden on checkout. Number from GET /settings/public, never
hardcoded.

ProductWhatsAppButton on product pages and cards. Builds the message from
the template in settings, filling productName, sku, finish and url. For
example:

"Hi, I'm interested in Opel Basin Mixer (SKU: FT-OBM-001) in Matte Black.
https://flowtop.com/products/opel-basin-mixer"

URL-encode properly. Test with a product name containing an ampersand and
one containing a non-ASCII character.

Fire an analytics event named as a click. A WhatsApp click is NOT a lead and
must never be recorded as one.

2. Forms:

Contact form: name, email, phone, subject, message.
Dealer enquiry: name, company, role, city, project type, requirement,
message.

Both:
- Validate on blur, not on every keystroke
- Honeypot field hidden from humans
- Disabled with a spinner while submitting
- On success, show the reference the API returns
- The API returns saved and emailSent separately. If saved is true and
  emailSent is false, say so honestly: we have your message, our email
  notification failed, WhatsApp us if urgent.
- NEVER show success when saved is false
- Keep everything the user typed on any failure
- Fully labelled, errors tied to fields with aria-describedby
```

## Prompt 4.4 - Search and analytics

```
1. Site search UI:
- Opens from the header icon as an overlay
- Debounced as you type
- Results grouped by type: products, collections, articles
- Keyboard navigable, arrow keys and enter
- Recent searches in localStorage, wrapped in try/catch because it throws in
  private windows
- Empty state with suggestions

2. Analytics:
Build one typed tracking helper. Never scatter raw calls through components.

Events: page_view, product_view, search, filter_applied, add_to_cart,
remove_from_cart, begin_checkout, purchase, whatsapp_click, form_submit,
document_download, journal_view, collection_view.

Rules:
- Never send passwords, payment details, full addresses or anything
  identifying a person
- Product events carry id, name, category and price, nothing else
- Respect do-not-track
- A debug mode logging to the console

Then walk the entire funnel with debug on and confirm every event fires
exactly once, not twice.
```

---

## ✅ PHASE 4 CHECKS

### The attacks

| # | Attack | Pass when |
|---|---|---|
| 1 | Change the price in the cart request via dev tools | Server charges the real price |
| 2 | **Copy the payment success URL, open it fresh in a new tab** | **No order confirmed. The page polls and shows the real status.** |
| 3 | Grep the checkout code for arithmetic on money | Zero results |
| 4 | Grep for reading success from searchParams | Zero results |

### WhatsApp

| # | Check | Pass when |
|---|---|---|
| 5 | Click WhatsApp on a product | Message has name, SKU, selected finish, full URL |
| 6 | Switch finish, then click | Message shows the new finish |
| 7 | A product name containing "&" | Encodes correctly, message not truncated |
| 8 | Dev D changes the number in admin settings | Picked up with no deploy |
| 9 | Check the analytics event name | Click, never lead |

### Honesty

| # | Check | Pass when |
|---|---|---|
| 10 | Kill the network, submit the contact form | Error shown, input kept, no false success |
| 11 | Dev A makes the email fail while the save succeeds | Honest message about the email |
| 12 | Cart with a product that became unavailable | Warning shown, not silently removed |

### Send for review

```
Phase 4 done. For review:
- Recording of a full guest checkout
- Recording of attack 2, the forged success URL
- Screenshot of the WhatsApp prefilled message
- Console output of the analytics debug walk
- Results of checks 1 to 12
```

---

# PHASE 5 - Performance, accessibility, launch (Weeks 9 to 10)

No new features. You also test Dev D's admin panel while he tests your site.

## Prompt 5.1 - Performance

```
Performance pass on the public site.

- Every image through next/image with correct sizes per breakpoint
- WebP and AVIF with fallbacks
- Explicit width and height everywhere, to keep layout shift near zero
- Lazy load below the fold, eager only for the hero
- Blur placeholders on product images
- Self-host fonts, preload only the two weights actually used, font-display
  swap
- Code split heavy components
- Audit the bundle, remove anything unused
- Confirm the CDN and caching headers Dev A configured are actually being
  hit

Run Lighthouse on mobile, throttled, for: homepage, product page, category
page, checkout. Report all four scores and list everything below target.

Target: LCP under 2.5s, CLS under 0.1.
```

## Prompt 5.2 - Accessibility

```
Accessibility pass, WCAG 2.2 AA oriented.

- Tab the entire site with no mouse. Fix every trap, invisible focus and
  illogical order.
- Real labels on every field, never a placeholder standing in for one
- Errors tied to fields with aria-describedby and announced to screen
  readers
- Contrast at least 4.5:1 for text, 3:1 for UI. Check light purple on white
  specifically, it is the likely failure.
- Alt text on every image, alt="" on decorative ones
- One h1 per page, no skipped heading levels
- Modals trap focus and restore it
- Carousels keyboard operable and announcing position
- prefers-reduced-motion suppresses non-essential animation
- Skip to content link

Run axe on every page type. Report what remains.
```

## Prompt 5.3 - SEO and resilience

```
1. SEO:
- Dynamic sitemap.xml from Dev B's sitemap-data endpoint, drafts excluded
- robots.txt blocking admin and checkout
- Unique title and meta description everywhere, with sensible fallbacks when
  the CMS field is empty
- Open Graph and Twitter cards with a default share image
- Canonicals, and correct handling for filtered listing pages
- Product, breadcrumb and organization structured data, validated in
  Google's tool
- Crawl staging and report broken links, missing meta and duplicate titles

2. Resilience, build and show me each:
- A page that does not exist
- A product archived while someone had the page open
- The API returning 500
- The API timing out
- A session expiring mid-checkout
- An image that fails to load
- Slow 3G, confirm skeletons show and nothing jumps
- JavaScript disabled, confirm core content renders

Every one shows something useful. Never a blank page, never a raw error.
```

## Prompt 5.4 - Remaining pages

```
Build what is left.

1. Support page: CMS-managed FAQ accordion with categories, downloadable
   manuals and care guides grouped by product type, support WhatsApp button,
   contact form. A line saying warranty registration is coming soon.

2. Legal pages: privacy, terms, shipping, refunds. Build them as CMS pages
   so Flowtop can edit the text themselves. Clearly marked placeholder text
   until they supply the real wording.

3. About, Manufacturing and Quality: build these using the existing page
   builder sections, not hardcoded. They should be editable like any other
   page.

4. Cookie consent banner if the analytics setup needs one for India.
```

## Prompt 5.5 - Test Dev D's admin panel

```
Break Dev D's admin panel. Do not change his code, produce findings with
screen, what you did and what happened.

- Click every screen at 360px and look for sideways scroll, overlapping text
  and cut-off content
- Tab every screen with no mouse
- Submit every form empty, and with one required field missing
- Start editing, navigate away, confirm the unsaved warning fires
- Kill the network mid-save and check whether it falsely reports success
- Look for ANY free-text style input in the section editor. A colour picker,
  a CSS box, a class name field. There must be none.
- Try to enter a hex colour anywhere in the page builder
- Open the page builder with 30 sections and check it stays usable
- Delete something and check the confirmation says what will actually happen
- Check empty and loading states exist on every screen

Report everything, including what passed.
```

---

## ✅ PHASE 5 CHECKS

| # | Check | Target |
|---|---|---|
| 1 | Lighthouse performance, mobile, homepage | 90+ |
| 2 | Lighthouse performance, mobile, product page | 90+ |
| 3 | LCP on mobile 4G | under 2.5s |
| 4 | CLS | under 0.1 |
| 5 | Lighthouse accessibility, every page type | 95+ |
| 6 | axe violations | zero critical, zero serious |
| 7 | Keyboard only, whole site | Everything reachable, focus visible |
| 8 | Every page at 360px | No sideways scroll |
| 9 | JavaScript off, product page | Content readable |
| 10 | Structured data validation | No errors |
| 11 | Staging crawl | No broken links, no duplicate titles |
| 12 | Dev D audit | Findings delivered |

### Send for review

```
Phase 5 done. For review:
- Lighthouse reports, all four page types
- axe report
- Screenshots at 360px of every major page
- Findings from testing Dev D's admin panel
- Results of checks 1 to 12
```

---

# Quick reference

| Phase | Prompts | Weeks | The one thing that must work |
|---|---|---|---|
| 0 | 1 | day 1 | You know Dev D is blocked on you |
| 1 | 1.1 to 1.5 | 1 to 2 | **Ten components shipped by day 4** |
| 2 | 2.1 to 2.4 | 3 to 4 | No empty spec rows, finish switch with no reload |
| 3 | 3.1 to 3.4 | 5 to 6 | The homepage renders entirely from CMS data |
| 4 | 4.1 to 4.4 | 7 to 8 | A forged success URL confirms nothing |
| 5 | 5.1 to 5.5 | 9 to 10 | LCP under 2.5s, zero serious axe violations |

## You block Dev D

| You deliver | When | What he cannot do without it |
|---|---|---|
| Design tokens | Day 2 | Style anything |
| Ten core components | **Day 4** | Build any admin screen properly |
| The rest of the kit | Week 2 | Forms, drawers, tooltips |
| Section config types | Phase 3 start | Build the section editor |
| SectionRenderer | Phase 3 | His live preview |

Ship rough and early. He owns the page builder, the biggest piece in the project, and every day you are late is a day he loses.

## Tell the others immediately if

- Dev B's response shape differs from my mock, meaning the contract drifted
- Dev A's cart endpoint accepts a price from the client
- Dev D's section editor produces a config I cannot render
- Any API returns an empty specification row