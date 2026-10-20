# Dev D - Admin CMS

**Your scope:** `admin/` entirely

**Not your scope:** `backend/` is Dev A and Dev B. `frontend/` and `packages/ui/` are Dev C.

**You import `packages/ui/` from Dev C.** You never redefine a component there. If you need a new variant, ask him.

---

## How to use this file

Run the prompts in order. After each phase, run the checks, then post the "send for review" block.

**You are building the product.** The public site is what customers see, but this is what Flowtop staff use every day, and the whole project is judged on one thing:

> A marketing person adds a product and puts it on the homepage, unaided, after one training session.

If they need help, the CMS failed, whatever the test report says.

**You own the two biggest pieces:** the placement panel and the page builder. Both land in Phase 3. Everything before that is preparation.

---

## PROMPT 0 - Orient

```
Read these before writing any code:
- AGENTS.md at the repo root
- admin/AGENTS.md
- docs/03-api-contract.md, especially the admin endpoints and the six
  section config shapes
- docs/02-mvp-scope.md
- docs/06-conventions.md

Then tell me, in your own words:
1. Who I am building for, and what that means for how screens should work
2. Why there must be no free-text style field anywhere in the CMS
3. What happens when an admin removes a product from Homepage Featured
4. Why hiding a button is not a permission check

Do not write any code yet.
```

---

# PHASE 1 - Shell and media (Weeks 1 to 2)

Dev C ships you design tokens on day 2 and ten core components on day 4. Until then, build structure with rough styling. The layout does not change when you swap in his components, only the look.

## Prompt 1.1 - Scaffold and shell

```
Set up admin/ as a Next.js App Router app with TypeScript strict and
Tailwind, importing tokens and components from packages/ui.

If Dev C's package is not ready yet, build with plain styling and swap later.
Do NOT create your own button or input component. That is his job and two
copies means two visual languages.

Build the admin shell:
- Left sidebar: Dashboard, Products, Categories, Collections, Pages,
  Journal, Media, Orders, Submissions, Navigation, Settings, Users
- Collapses to icons on tablet, becomes a drawer on mobile
- Top bar: breadcrumbs, global search box (non-functional for now), current
  user with a logout menu
- Page wrapper with a consistent title, action area and content region

Menu items hide based on the user's permissions from the auth response. Put
a comment on that code saying it is cosmetic only and the server is the real
guard, so nobody later mistakes it for security.
```

## Prompt 1.2 - Login and auth

```
Build the login flow.

- Centred card, Flowtop branding, email and password
- A second screen for the 6-digit MFA code, shown only when the API responds
  with requiresMfa
- A recovery code option on the MFA screen
- Clear errors, loading state on submit, keeps the email on failure
- Forgot password flow

Never store a token in localStorage. The session is an httpOnly cookie set
by Dev A's API.

Build lib/auth.ts with login, logout, current user, and a route guard that
redirects to login when there is no session. Use lib/mocks/auth.ts until
Dev A's endpoints exist.

On a 401 anywhere in the app, redirect to login. On a 403, show a clear
"you do not have permission" message, never a blank screen.
```

## Prompt 1.3 - API client and mocks

```
Build lib/api.ts.

- Base URL from an environment variable
- Credentials included
- Typed against shared/types
- Parses the error envelope from docs/03-api-contract.md and surfaces
  error.fields so forms can highlight the right input
- 401 redirects to login, 403 shows a permission toast
- Mock mode flag so every screen can be built before the backend exists

Create lib/mocks/ with typed fixtures matching the contract exactly. Use
Dev B's seed data for the values, so screens look real instead of full of
"Test Product 1".

Tag every mock TODO so one grep finds them all on swap day.
```

## Prompt 1.4 - Dashboard

```
Build the dashboard at /dashboard.

Quick action tiles, eight of them: Add Product, Create Page, Add Collection,
Write Journal, Upload Media, View Orders, View Submissions, Navigation.

Summary cards, wired to mocks for now, real data in Phase 4:
- Draft pages
- Products missing images
- Products missing specifications
- Recent orders
- Recent submissions

Each card links to a filtered list, so clicking "4 products missing images"
opens the product list already filtered.

This is the first screen staff see every day. It should answer "what needs
my attention" in one glance, not be a wall of charts.
```

## Prompt 1.5 - Media library

```
Build the media library at /media.

- Drag and drop upload area plus a browse button
- Multiple files at once with per-file progress
- Client-side checks before upload: allowed types, max size, clear error for
  rejects. Dev A also checks server side, this is just fast feedback.
- Grid with thumbnails, filename, size, date
- Search and filter by type
- Click opens a detail panel: preview, alt text editor, copy URL, delete
- Delete shows 409 nicely when the asset is still in use, naming what uses
  it

Then build MediaPicker as a reusable modal. Every other screen opens this to
choose an existing image rather than re-uploading. Product forms, section
editors, collections and journal all use it.

Alt text is a first-class field, not an afterthought. Dev C needs it for
accessibility.
```

---

## ✅ PHASE 1 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Dev C's components arrive | You swap them in with no layout change |
| 2 | Grep admin for a locally defined Button or Input | Zero results, all from packages/ui |
| 3 | Admin at 360px | No sideways scroll, sidebar is a drawer |
| 4 | Tab the shell with no mouse | Everything reachable, focus visible |
| 5 | Log in with a wrong password | Clear error, email kept |
| 6 | Log in as a super admin | MFA screen appears |
| 7 | Visit /products while logged out | Redirected to login, not a blank page |
| 8 | Trigger a 403 | Clear permission message |
| 9 | Upload a 200MB file | Rejected client side with a readable message |
| 10 | Mock mode on, backend off | Every screen renders |

### Send for review

```
Phase 1 done. For review:
- Screenshots of the admin shell at desktop and 360px
- Screenshot of the dashboard
- Screenshot of the media library and the MediaPicker modal
- Which day Dev C's components arrived and whether that blocked me
- Results of checks 1 to 10
```

---

# PHASE 2 - The product form (Weeks 3 to 4)

The most used screen in the whole CMS. Get it right and the rest follows.

## Prompt 2.1 - Product list

```
Build /products.

- Table: thumbnail, name, SKU, category, price, status badge, last updated
- Sort by any column
- Search by name or SKU, debounced
- Filters: category, status, and a "needs attention" filter for missing
  images or missing specs, which the dashboard cards link into
- Pagination, 25 per page
- Row click opens the edit form
- Bulk select with bulk publish, unpublish and archive
- Empty state with "Add your first product"
- Loading skeleton shaped like the table, not a spinner
- Add Product button, top right

Price displayed in rupees, formatted from the paise the API sends. Use one
shared formatPrice helper, never inline division.
```

## Prompt 2.2 - Product form shell

```
Build the product form at /products/[id], create and edit in one component.

Seven tabs: Identity, Commerce, Technical, Media, Merchandising, Related,
SEO.

Form-wide behaviour:
- Sticky action bar at the bottom: Save Draft, Publish, Preview, status badge
- Autosave the draft every 30 seconds with a visible "saved" indicator
- Unsaved changes warning when navigating away or closing the tab
- Validation on blur, field-level errors, never one error at the top
- Required fields marked, Publish blocked until they are filled, with the
  blocking fields named
- error.fields from the API maps onto the right input and switches to that
  tab
- Fully usable at 360px, tabs become a horizontally scrollable strip

Identity tab: name, SKU, slug (auto from name, editable), category,
collections multi-select, short description, full description with a
restricted rich text editor (bold, italic, lists, links only, no font or
colour controls).

Commerce tab: price, sale price, tax class, availability, stock message, and
a toggle for purchasable online versus enquiry only.

Leave Technical, Media, Merchandising, Related and SEO as placeholders.
```

## Prompt 2.3 - Variant and specification editors

```
Two editors inside the product form.

1. Variant editor, in Commerce:
- Add a finish row: name, SKU suffix, price override, swatch colour, image
  via MediaPicker, availability toggle
- Drag to reorder
- Exactly one marked default, picking a new one clears the old
- SKU suffix uniqueness validated before save

2. Specification editor, in Technical. This one decides whether the CMS
   succeeds.

- Rows of name and value, NOT a fixed set of fields
- An "Add specification" button lets staff create any field they want, for
  example "Spout Reach", with no developer involved
- Each row has a type: text, number with a unit, boolean, or choice from a
  list
- Drag to reorder
- Optional group headings, so rows can sit under "Technical" or
  "Installation"
- A "common specs" dropdown pre-filling typical bathfitting fields as a
  shortcut: Material, Finish, Installation Type, Dimensions, Weight,
  Cartridge, Flow Rate, Warranty. It is a shortcut, never a restriction.
- A row with an empty value is removed on save, never sent, because the
  public page must not render empty rows

On save, send the full ordered array to PUT
/admin/products/:id/specifications. Dev B replaces the whole list in one
transaction.
```

## Prompt 2.4 - Media, SEO, categories, collections

```
Finish the product form and build two more screens.

1. Media tab:
- Primary image via MediaPicker
- Gallery with drag to reorder
- Documents section for PDFs
- Alt text field on every image, shown inline
- Warning when a product has no primary image, since that drives the
  dashboard card

2. SEO tab:
- Page title, meta description with a character counter and a colour warning
  past the limit
- Canonical URL
- Social share image via MediaPicker
- A live Google result preview, so staff see what they are writing

3. /categories:
- List with drag to reorder, since order drives the menu and listings
- Inline rename
- Fields: name, slug, description, image, parent, status
- Product count per category
- Delete blocked when products remain, with an offer to move them instead

4. /collections/[id]:
- Name, slug, story with a rich text editor, hero image, SEO
- Assigned products panel: search the catalogue, tick to add, drag to rank
- Assigned products shown as cards in their saved order, so the editor sees
  what the page will look like
- Remove a product from the collection, with a message making clear the
  product itself is untouched
```

---

## ✅ PHASE 2 CHECKS

### AT-01, the whole sequence

| Step | Action | Pass when |
|---|---|---|
| 1 | Create "Opel Basin Mixer" | Saves as draft |
| 2 | Add three finishes with different prices | All save, one is default |
| 3 | Upload five images, reorder | Order persists after reload |
| 4 | Add eight specifications | All save |
| 5 | **Add a new spec field "Spout Reach"** | Works, no code change |
| 6 | Preview | Opens the public page correctly |
| 7 | Publish | Live on the site |
| 8 | Archive | Gone from listings, still in admin |

### Form behaviour

| # | Check | Pass when |
|---|---|---|
| 9 | Save with no name | Blocked, field-level error, right tab opened |
| 10 | Enter a duplicate SKU | API 422 maps onto the SKU field |
| 11 | Edit, then navigate away | Unsaved changes warning |
| 12 | Edit, wait 30 seconds | Autosave indicator shows saved |
| 13 | Kill the network, hit Save | Error shown, work kept, **no false success** |
| 14 | A spec row with an empty value | Removed on save, never sent |
| 15 | Product form at 360px | Tabs scroll, every field usable |
| 16 | Delete a category with products | Blocked, offers to move them |
| 17 | Remove a product from a collection | Message makes clear the product survives |

### Send for review

```
Phase 2 done. For review:
- Recording of the full AT-01 sequence, all 8 steps
- Screenshots of all seven product form tabs
- Screenshot of the specification editor with a custom field added
- Results of checks 9 to 17
```

---

# PHASE 3 - Placement and page builder (Weeks 5 to 6)

Your two biggest pieces. Budget the whole phase and do not let anything else in.

## Prompt 3.1 - Section config agreement

```
Before building the editor, sit with Dev C and go through the six section
config shapes in docs/03-api-contract.md field by field.

Confirm:
- The shape my editor produces is exactly the shape he renders
- Every style option is an enum with a fixed set of values
- Optional fields are genuinely optional and he handles them being absent
- The layout block is identical across all six types

This is the seam most likely to cause rework in the project. Spend the hour.

Report what we changed, if anything. A change needs Dev A and Dev B too,
because Dev B validates the config server side.
```

## Prompt 3.2 - Placement panel

```
Build the placement panel. It lives in the product form's Merchandising tab,
replacing the Phase 2 placeholder.

The concept staff need to understand from the UI alone: one product is
showcased in many places, each independently.

Current placements list:
- Each row: location name, position number, enabled toggle, remove button
- Grouped by location type: Homepage, Categories, Collections, Campaigns
- Drag to reorder within a location

Add placement:
- Opens a searchable list from GET /admin/placement-locations
- Grouped by type
- Already-used locations shown as disabled, since a product cannot be placed
  twice in one location
- On pick, a row appears where I set position and an optional badge label

Remove shows a confirmation that says exactly what happens:

  Remove from Homepage Featured?
  This removes the product from the homepage only. The product itself, and
  its other placements, are not affected.

That wording matters more than it looks. Staff are afraid of deleting
things, and this dialog is where that fear shows up. Vague wording means
they never use the feature.

Works at 360px.
```

## Prompt 3.3 - Placement preview

```
Build the placement preview.

Each placement row has a Preview button opening a modal that shows the
product rendered inside its actual target section, with the real
neighbouring products in their real order.

- Use Dev C's SectionRenderer so the preview is the real thing, not an
  approximation
- Highlight the product being previewed so it is findable
- Desktop, tablet and mobile toggle inside the modal
- Show the position number, so the editor can see it really is second
- A clear banner when the placement is disabled, saying it is not live

This is the feature that makes staff trust the tool. Without it they publish
blind, panic, and go back to asking a developer.
```

## Prompt 3.4 - Page builder shell

```
Build the page builder at /pages/[id]. The biggest single piece in the
project.

Desktop: three columns.

  Section list  |  Live preview  |  Section editor

Section list:
- Each section as a card: type icon, a short label taken from its content,
  drag handle, visibility toggle, duplicate, delete
- Add section opens a picker showing the six types with a thumbnail of each

Live preview:
- Renders the current state using Dev C's SectionRenderer
- Updates as settings change
- Clicking a section in the preview selects it in the list

Behaviour:
- Drag to reorder, preview updates immediately
- Duplicate copies all settings, so staff clone a layout and swap content
- Hide keeps it saved but off the live page
- Delete confirms first
- Undo and redo, 20 steps
- Autosave every 30 seconds with a visible saved indicator
- Page settings panel: title, slug, SEO fields, publish state

Tablet and mobile: the three columns become tabs, Sections, Preview, Editor.
```

## Prompt 3.5 - Section editor and device preview

```
Build the section editor panel and the device toggle.

The editor changes with the selected section type, but every type shares the
same layout block:

- Background: a DROPDOWN of white, pale, deep, black, image
- Spacing above and below: none, small, medium, large
- Width: contained, wide, full
- Alignment: left, centre, right
- Column ratio where relevant: 50-50, 60-40, 40-60
- Mobile stacking order where relevant

THE ABSOLUTE RULE: there is NO free-text style field anywhere. No colour
picker. No CSS box. No class name input. No custom style attribute. Every
visual option is a dropdown of approved values from the contract. A layout
outside the presets is a development task.

Per-type fields follow the six config shapes in the contract exactly.

Every section using an image gets a separate mobile image slot, so staff can
pick a portrait crop for phones.

Device preview toggle above the preview column: Desktop 1440, Tablet 768,
Mobile 360. Resize a real iframe to that width. Do NOT fake it with a CSS
transform, because that hides real responsive bugs.
```

## Prompt 3.6 - Navigation and journal

```
Two smaller screens to finish the phase.

1. /navigation:
- Drag and drop tree for the header, one level of dropdown
- Each item: label, link type (page, category, collection, product,
  external), destination picker appropriate to the type, open in new tab
- Separate simpler editor for footer columns
- Warning when an item points at unpublished content, using the flag Dev B
  returns
- Saved wholesale with PUT /admin/navigation

2. /journal/[id]:
- Title, slug, author, date, category, hero image via MediaPicker
- Rich text body, same restricted editor as the product description
- Related products picker
- SEO fields with the Google preview
- Draft, preview, publish
```

---

## ✅ PHASE 3 CHECKS

### AT-02, the placement test. This is the project.

| Step | Action | Pass when |
|---|---|---|
| 1 | Open a product, go to Merchandising | Placement panel loads |
| 2 | Add to Basin Mixers | Row appears |
| 3 | Add to Opel Collection at rank 1 | Row appears |
| 4 | Add to Homepage Featured at position 2 | Row appears |
| 5 | Preview each one | Each shows the product in its real section, right position |
| 6 | Publish | All three live |
| 7 | Check the public site | Appears in all three, correct order |
| 8 | **Remove ONLY the Homepage Featured placement** | **Gone from the homepage. Still in the category and the collection. Product intact.** |

If step 8 removes anything else, tell Dev B immediately. It means the backend used a flag column instead of a placement table, and that is a rewrite.

### AT-03 and AT-04

| # | Check | Pass when |
|---|---|---|
| 9 | Add a product carousel to the homepage | Appears in the list and the preview |
| 10 | Duplicate an image+text section | Copy keeps every layout setting |
| 11 | Change the duplicate's image, heading and CTA | Preview updates live |
| 12 | Drag both sections to new positions | Order changes, preview follows |
| 13 | Publish | Public homepage matches the preview exactly |
| 14 | Create a campaign page from a template, set a slug, pick products, publish | Live at the right URL |

### The rule

| # | Check | Pass when |
|---|---|---|
| 15 | **Grep admin for any free-text style input** | **Zero results. No colour picker, no CSS box, no class input.** |
| 16 | Try to type a hex colour anywhere in the section editor | Impossible, dropdowns only |
| 17 | Delete all sections and publish | Page renders empty, nothing crashes |
| 18 | Add a section, undo, redo | Both work |
| 19 | Page builder at 360px | Three columns became tabs, all usable |
| 20 | Page builder with 30 sections | Still responsive, no lag |
| 21 | Device preview set to mobile | Real iframe resize, not a transform |

### Send for review

```
Phase 3 done. For review:
- Recording of AT-02, all 8 steps, especially step 8
- Recording of AT-03
- Screenshot of the page builder, all three columns
- Screenshot of the section editor showing only dropdowns
- Proof of check 15: paste the grep command and its empty output
- What changed in the section config agreement with Dev C, if anything
- Results of checks 9 to 21
```

---

# PHASE 4 - Orders and settings (Weeks 7 to 8)

## Prompt 4.1 - Orders

```
Build the order screens.

/orders:
- Table: reference, date, customer, item count, total, payment status, order
  status
- Filter by order status, payment status and date range
- Search by reference, email or phone
- Pagination
- Export CSV button, visible only when the user has order:export

/orders/[id]:
- Full line items with product, finish, quantity, unit price, line total
- Customer contact and delivery address
- Payment state and reference
- Status timeline showing who changed what and when
- Status change dropdown with a confirmation step, and a note field
- A line saying status changes are logged
- Print-friendly view

Money formatted in rupees from paise, using the shared helper.

Line items show the SNAPSHOT values the API returns, the name and price at
purchase time, not the current product. Do not helpfully look up the live
product.
```

## Prompt 4.2 - Submissions

```
Build /submissions.

- Unified inbox for contact and dealer enquiries
- Filter by type, status and date
- Unread shown clearly, marked read on open
- Detail panel with the full submission and a mailto reply link
- Mark as handled
- CSV export for authorized roles only

Show the emailSent flag. When a submission saved but its email failed, the
row is flagged, because that is a customer waiting on a reply nobody saw.
That flag is the whole reason records are kept as well as emailed.
```

## Prompt 4.3 - Settings

```
Build /settings with two tabs.

Email tab:
- Sender name and sender address
- Recipient inbox for each event: orders, contact, dealer
- A test send button per recipient, showing the real result

WhatsApp tab:
- Business number with format validation
- General message template
- Product message template, with the available placeholders listed:
  {productName} {sku} {finish} {url}
- A live preview rendering the template with sample values, so staff see the
  actual message before saving

Both tabs make clear that changes take effect immediately with no deploy.
That is the point of the module.

settings:write only. A user without it sees the values read-only, not a
blank page.
```

## Prompt 4.4 - Dashboard wiring and polish

```
Finish the admin.

1. Wire the dashboard summary cards to Dev B's real aggregate endpoint,
   replacing the mocks. Each card links to its filtered list.

2. Global search in the top bar: products, pages, collections, journal
   articles, orders. Grouped results, keyboard navigable, opens the record.

3. Go through every screen and audit:
   - Empty state exists and says what to do next
   - Loading state is a skeleton shaped like the content, not a spinner
   - Error state is clear and offers a retry
   - Every destructive action says what will actually happen
   - Every form warns about unsaved changes

Make a list of what was missing and fix it.
```

---

## ✅ PHASE 4 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | Place a test order, open it in admin | Correct items, finishes, totals |
| 2 | Change order status | Confirmation, saves, timeline updates |
| 3 | Rename a product, reopen an old order | Old order still shows the old name |
| 4 | Export as a role without order:export | Button not shown, and the API would refuse anyway |
| 5 | A submission whose email failed | Flagged in the list |
| 6 | Change the WhatsApp number in settings | Dev C's site picks it up, no deploy |
| 7 | WhatsApp template live preview | Renders with sample values correctly |
| 8 | Test email button | Shows the real result, success or failure |
| 9 | Settings as a user without settings:write | Read-only, not blank |
| 10 | Every screen at 360px | Usable, tables scroll or become cards |
| 11 | Every screen's empty state | Present and useful |

### Send for review

```
Phase 4 done. For review:
- Screenshot of the order detail with the status timeline
- Screenshot of the WhatsApp settings with the live preview
- The list of missing states found in the audit and what was fixed
- Results of checks 1 to 11
```

---

# PHASE 5 - Polish, training, launch (Weeks 9 to 10)

No new features. You also test Dev C's site while he tests your admin.

## Prompt 5.1 - Admin accessibility and responsive

```
Two passes over the admin panel. Staff use this all day, and some of them
will use it on a phone.

Accessibility:
- Tab every screen with no mouse, fix every trap and invisible focus
- Real labels on every field
- Errors tied to fields with aria-describedby
- Contrast 4.5:1 for text
- Modals trap and restore focus
- Drag and drop has a keyboard alternative, because reordering by drag alone
  is inaccessible
- prefers-reduced-motion respected

Responsive, at 360, 390, 768, 1024, 1440:
- No sideways scroll anywhere
- Tables scroll inside their container or become cards
- The page builder's three columns become usable tabs
- Touch targets at least 44px
- Forms usable one-handed

Run axe on every screen and report what remains.
```

## Prompt 5.2 - Admin performance

```
The admin gets slow in exactly two places. Fix both.

1. The page builder with many sections:
   - Lazy load the preview iframe
   - Memoise section cards so dragging one does not re-render thirty
   - Debounce the preview update, do not re-render on every keystroke
   - Test with 50 sections

2. Long tables:
   - Virtualise the product list beyond a few hundred rows
   - Debounce search
   - Keep filter state in the URL so back works

Also: code split the page builder out of the main bundle. Most sessions
never open it.

Report before and after numbers.
```

## Prompt 5.3 - The admin guide

```
Write docs/admin-guide.md for Flowtop staff.

Audience: a marketing person who is not technical. Plain English. No jargon.
Describe where screenshots should go.

Numbered steps for:
1. Logging in, and what to do if you forget your password
2. Adding a new product from start to publish
3. Adding a new specification field
4. Putting a product on the homepage
5. Removing a product from the homepage WITHOUT deleting it
6. Creating a collection and assigning products
7. Rearranging the homepage
8. Building a campaign landing page
9. Writing a journal article
10. Changing the menu
11. Uploading and reusing images
12. Checking orders and changing order status
13. Reading form submissions
14. Changing the WhatsApp number or an email recipient
15. What to do when something looks wrong

End with a one-page cheat sheet of the ten most common tasks.

Write it so nobody has to call a developer to do any of these. That is the
test it has to pass.
```

## Prompt 5.4 - Training environment

```
Set up a training environment.

- A copy of staging with safe sample data, seeded from Dev B's dev seed
- No real customer data, no real orders, no live payment keys
- Resettable with one command, so a trainee can break it freely
- Accounts for each of the three roles, so staff see their own permissions

Then write a 45-minute training session outline covering the five things
staff will do most: add a product, place it on the homepage, remove a
placement, rearrange the homepage, check an order.
```

## Prompt 5.5 - Test Dev C's site

```
Break Dev C's public site. Do not change his code, produce findings with
page, what you did and what happened.

- Every page at 360px, look for sideways scroll, overlapping text, cut-off
  content
- Tab every page with no mouse
- A product with no image, no specs, no description, one finish
- Switch finishes rapidly and check for a race or a stale price
- Add to cart, change quantity to 0, to 999, to a decimal
- Open the cart in two tabs and change both
- Submit every form empty, and with one field missing
- Kill the network mid-submit and check for a false success
- Open dev tools and change a price in a cart request
- Craft the payment success URL by hand
- Disable JavaScript and check what still works
- Throttle to slow 3G and look for layout jumps

Report everything, including what passed.
```

---

## ✅ PHASE 5 CHECKS

| # | Check | Pass when |
|---|---|---|
| 1 | axe on every admin screen | Zero critical, zero serious |
| 2 | Keyboard only, whole admin | Everything reachable, including reordering |
| 3 | Every screen at 360px | No sideways scroll |
| 4 | Page builder with 50 sections | Stays responsive |
| 5 | Product list with 500 products | Scrolls smoothly |
| 6 | Page builder code split | Not in the main bundle |
| 7 | Training environment reset | One command, clean state |
| 8 | Dev C audit | Findings delivered |
| 9 | **A non-technical person adds a product and puts it on the homepage, unaided, with only the guide** | **They finish without asking you anything** |

Check 9 is the release gate. Everything else can pass while the product still fails its purpose.

### Send for review

```
Phase 5 done. For review:
- axe report
- Before and after performance numbers for the page builder
- The admin guide
- Who tested check 9, how it went, and where they got stuck
- Findings from testing Dev C's site
- Results of checks 1 to 9
```

---

# Quick reference

| Phase | Prompts | Weeks | The one thing that must work |
|---|---|---|---|
| 0 | 1 | day 1 | You can explain who you are building for |
| 1 | 1.1 to 1.5 | 1 to 2 | Login, shell, media library, all on mocks |
| 2 | 2.1 to 2.4 | 3 to 4 | A custom spec field added with no code change |
| 3 | 3.1 to 3.6 | 5 to 6 | Removing one placement leaves the others alone |
| 4 | 4.1 to 4.4 | 7 to 8 | WhatsApp number changed with no deploy |
| 5 | 5.1 to 5.5 | 9 to 10 | A non-technical person works unaided |

## Who blocks you

| You need | From | When |
|---|---|---|
| Design tokens | Dev C | Day 2 |
| Ten core components | Dev C | **Day 4** |
| Auth endpoints | Dev A | Week 1 |
| Media upload | Dev A | Week 2 |
| Product and category APIs | Dev B | Week 3 |
| Placement API | Dev B | Week 5 |
| Section config validation | Dev B | Week 5 |
| SectionRenderer | Dev C | Week 5 |
| Order and settings APIs | Dev A | Week 7 |

Build against mocks the moment a shape is in the contract. Never sit waiting.

## Tell the others immediately if

- Removing one placement affects another, tell Dev B, it is a rewrite
- An admin API answers while you are logged out, tell Dev A
- An API returns a specification row with an empty value, tell Dev B
- A save reports success when it failed, tell whoever owns that endpoint
- Dev C's SectionRenderer cannot render a config your editor produces
