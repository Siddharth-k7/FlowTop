# admin/

The Flowtop CMS. Next.js App Router. Owned by Dev D.

This is the product. The public site is what customers see, but this is what Flowtop staff use every day, and the whole project is judged on whether they can run their website without calling a developer.

**The test that matters:** a marketing person adds a product and puts it on the homepage, unaided, after one training session. If they need help, the CMS has failed regardless of what the test report says.

## Who you are building for

Not developers. Marketing and product staff who know bathroom fittings and do not know HTML. Every screen should be obvious without documentation, forgiving of mistakes, and clear about what will happen when they press publish.

## Rules

**No free-text styling. Anywhere.** Every visual option is a dropdown of approved presets: background, spacing, width, alignment, column ratio. No colour picker, no CSS box, no class name input, no style attribute field. If the schema has a free-text style field, that is a bug. A layout outside the presets is a development task, not an editor task.

**Import from `packages/ui/`, never redefine.** Dev C owns the components and tokens. If you need a new variant, ask for it rather than building a parallel one. Two component libraries means two visual languages and one unhappy client.

**The UI is never the security.** Hiding a menu item or disabling a button is presentation. The server enforces permissions. Write it in a comment where you do role-based hiding so nobody later mistakes it for a guard.

**Never report a save that did not happen.** If the API returned an error, show it and keep the user's work. A false "Saved" costs someone an afternoon of retyping.

**Destructive actions explain themselves.** Not "Are you sure?" but what will actually happen:

> Remove from Homepage Featured?
> This removes the product from the homepage only. The product itself, and its other placements, are not affected.

Staff are afraid of deleting things. Specific wording is what makes them willing to use the tool.

**Nothing is lost.** Autosave drafts every 30 seconds. Warn before navigating away with unsaved changes. Long forms survive a refresh.

**The admin panel is responsive too.** Staff check orders on their phones. Nothing scrolls sideways at 360px. Three-column layouts become tabs. Tables become cards or scroll inside their own container.

## The two screens that carry the project

### Placement panel

Lives in the product form. Controls where a product is showcased across the whole site.

- Current placements listed with location, position, enabled toggle, remove
- Add placement opens a searchable list grouped by type: homepage sections, categories, collections, campaign pages
- Position is set per placement, drag to reorder within a location
- Preview shows the product inside its real target section, with real neighbours, at the right position, with a device toggle
- Removing one placement says plainly that the others and the product are untouched

Each placement is a separate record. The UI must make that obvious, because the backend model is only half the feature. The other half is staff believing it.

### Page builder

Three columns on desktop, tabs on tablet and mobile.

```
Section list  │  Live preview  │  Section editor
```

- Add, delete, duplicate, reorder by drag, hide and show
- Duplicate copies the layout settings so staff can clone a section and swap the content
- Undo and redo, 20 steps
- Device preview is a real resized iframe, not a CSS transform
- Autosave with a visible saved indicator
- Section editor offers dropdowns only, per the rule above

The section config shape is shared with Dev C, who renders it on the public site. **Changing that shape is a conversation with Dev C, not a commit.** See `docs/03-api-contract.md`.

## Form patterns

Use the same patterns everywhere so staff learn once:

- Sticky action bar at the bottom: Save Draft, Publish, Preview, status badge
- Required fields marked, publish blocked until they are filled
- Validation on blur, not on every keystroke
- Field-level errors, never a single error at the top
- Tabs for long forms, scrollable strip on mobile
- Loading skeletons shaped like the content, not spinners
- Empty states that tell the user what to do next

## When the API is not ready

Build against a typed mock in `lib/mocks/` matching the contract exactly, tagged `TODO: swap for real API`. Dev B seeds realistic Flowtop data; use it so screens look real rather than full of "Test Product 1".

## Checklist before opening a PR

- [ ] No free-text style field anywhere, grep to prove it
- [ ] Components imported from `packages/ui/`, none redefined
- [ ] Tested at 360px, no sideways scroll
- [ ] Unsaved changes warning works
- [ ] Failed save shows the real error and keeps the user's input
- [ ] Destructive actions say what will actually happen
- [ ] Empty and loading states exist on every new screen
