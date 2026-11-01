# Dev D test log (Phase 5.5: testing Dev C's site against the admin)

Run with the admin on mocks (`NEXT_PUBLIC_USE_MOCKS` unset). Walk the scripts in `docs/05-team-split.md` (Phase 2 to 4 exit tests).

- [ ] Add "Spout Reach" spec to a product, no code change (Specifications tab)
- [ ] Product in category, collection and Homepage Featured at position 2 (Placement tab)
- [ ] Remove only the homepage placement; the other two and the product remain
- [ ] Duplicate, reorder, hide a section; publish; public page matches (needs Dev C /preview and real API)
- [ ] Kill the network, press Save: error shown, input kept, no "Saved"
- [ ] 360px: no sideways scroll on every screen
- [ ] Priya (marketing_admin) gets a clear 403 on /orders, and no menu item for it
- [ ] Change WhatsApp number in Settings; frontend picks it up with no deploy (needs real API)
