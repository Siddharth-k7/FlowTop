# Proposed contract additions (needs Dev B and Dev C sign-off)

Source: `Flowtop_Frontend_Requirements_Audit_Report.pdf` (Revision 5.0). The admin editors for these exist in
`src/lib/sections.ts` and `src/lib/content-types.ts`. **Nothing here changes `docs/03-api-contract.md`**; that is a PR all four review.
Every shape below is mocked in `src/lib/mocks/` and tagged `TODO: swap for real API`.

## Section types 7 to 12 (new). All carry the existing `layout` block.
| type | config |
|---|---|
| `resource_downloads` | `heading`, `resourceIds[]`, `groupByCategory` |
| `inspiration` | `heading`, `lookIds[]`, `showShopThisLook` |
| `support_faq` | `heading`, `faqIds[]`, `showWhatsapp` |
| `exhibition_feature` | `heading`, `exhibitionId`, `showProducts` |
| `related_products` | `heading`, `mode` (`style_related` or `compatible_accessories`), `productId?`, `count` |
| `comparison` | `heading`, `body`, `productIds[]`, `ctaLabel` |

Additions to existing types: `gallery.hotspots[] {productId, x, y}` (percent of image); `cta.mode` gains `form`, plus `cta.formType` (`consultation` or `purchase_assistance`).

## New admin collections (`/admin/<name>`, standard list/get/post/patch/delete)
`resources`, `inspiration`, `exhibitions`, `faqs`, `synonyms`, `style-rules`, `finish-care`, `attributes`. Field lists: `content-types.ts`.

## Submissions
New `type: purchase_assistance` (consumer: name, city, phone/email, fittingInterest) kept separate from `dealer_application`. Recipients for each are admin-only settings (`purchaseAssistanceRecipients`, `dealerRecipients`).

## Product
New fields: `beforeYouBuy[]`, `fitChecks[]`, `relatedIds[]` (style-related), `compatibleIds[]` (installation hardware).

## Deviations from the contract that the real API should absorb
- Product variants and specifications are saved inside the product PATCH; the contract has separate variant endpoints.
- Pages save the whole `sections` array in one PATCH (undo/redo and autosave need it); the contract has per-section endpoints.
- Lists are filtered and paged client-side in the mock; the real endpoints take `search`, `status`, `page`.

## Not done here (outside `admin/`)
The PDF's frontend findings (404 routes, /compare, /style-finder, /finishes, cart removal, dealer form) belong to Dev C.
