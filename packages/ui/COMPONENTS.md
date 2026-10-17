# @flowtop/ui - Components Guide

Core component library for Flowtop (`frontend/` and `admin/`).
Built with strict TypeScript, native web APIs (`<dialog>`, native `<select>`), WAI-ARIA standards, and Flowtop design tokens.

---

## 1. Button

Supports `primary`, `secondary`, `ghost`, and `danger` variants, `sm`, `md`, `lg` sizes, loading states (keeps width and renders Spinner), and accessible icon-only buttons.
Also exports `buttonClasses()` for use with Next.js `<Link>`.

```tsx
import { Button, buttonClasses } from '@flowtop/ui';

// Standard action buttons
<Button variant="primary" onClick={handleSave}>
  Save Changes
</Button>

// Secondary / Ghost / Danger
<Button variant="secondary">Cancel</Button>
<Button variant="danger" onClick={handleDelete}>Delete Placement</Button>

// Loading state (preserves button width, disables clicks, shows Spinner)
<Button variant="primary" loading={isSubmitting}>
  Publish
</Button>

// Icon-only button (requires aria-label in TypeScript)
<Button variant="ghost" iconOnly aria-label="Close menu">
  <CloseIcon />
</Button>

// Next.js Link styled as a Button
import Link from 'next/link';

<Link href="/products" className={buttonClasses({ variant: 'primary', size: 'md' })}>
  Browse Catalogue
</Link>
```

---

## 2. Input

Supports `text`, `email`, `password` (with built-in accessible show/hide toggle), and `search`. Includes integrated `Field` wrapper for label, hint, and error.

```tsx
import { Input } from '@flowtop/ui';

// Text input with label & error
<Input
  label="Product Name"
  placeholder="e.g. Opel Basin Mixer"
  value={name}
  onChange={e => setName(e.target.value)}
  error={fieldErrors.name}
  required
/>

// Password input with show/hide toggle
<Input
  type="password"
  label="Password"
  value={password}
  onChange={e => setPassword(e.target.value)}
  hint="Must be at least 12 characters."
/>

// Search input with icon
<Input
  type="search"
  placeholder="Search products by SKU or name..."
  value={query}
  onChange={e => setQuery(e.target.value)}
/>
```

---

## 3. Select

Styled native select with custom dropdown indicator and 44px min touch target.

```tsx
import { Select } from '@flowtop/ui';

// Using options prop
<Select
  label="Category"
  value={categoryId}
  onChange={e => setCategoryId(e.target.value)}
  error={fieldErrors.categoryId}
  options={[
    { label: 'Select category...', value: '' },
    { label: 'Basin Mixers', value: 'cat-1' },
    { label: 'Shower Systems', value: 'cat-2' },
  ]}
  required
/>

// Using native <option> children
<Select label="Placement Location" value={location} onChange={e => setLocation(e.target.value)}>
  <option value="featured">Homepage: Featured</option>
  <option value="new_arrivals">Homepage: New Arrivals</option>
</Select>
```

---

## 4. Field (Form Control Wrapper)

Shared form field wrapper used by `Input` and `Select`. Provides label, hint, and API error formatting with automatic `aria-describedby` and `aria-invalid` bindings.

```tsx
import { Field } from '@flowtop/ui';

<Field label="Custom Control" hint="Specify dimensions in millimetres" error={errors.dim}>
  {({ id, 'aria-describedby': describedBy, 'aria-invalid': invalid }) => (
    <input
      id={id}
      aria-describedby={describedBy}
      aria-invalid={invalid}
      className="p-space-2 border rounded-sm"
    />
  )}
</Field>
```

---

## 5. Card

Flexible container supporting `flat`, `raised`, and `inset` variants with `Header`, `Title`, `Body`, and `Footer` subcomponents.

```tsx
import { Card } from '@flowtop/ui';

<Card variant="raised">
  <Card.Header>
    <Card.Title as="h3">Opel Basin Mixer</Card.Title>
    <Badge variant="success">Published</Badge>
  </Card.Header>
  <Card.Body>
    <p>Solid brass basin mixer with ceramic disc cartridge.</p>
  </Card.Body>
  <Card.Footer>
    <Button variant="primary" size="sm">Edit Product</Button>
    <Button variant="ghost" size="sm">Preview</Button>
  </Card.Footer>
</Card>
```

---

## 6. Modal

Native HTML5 `<dialog>` component. Automatically traps focus, locks body scroll, handles Escape key, returns focus to the trigger element on close, and transforms into a bottom sheet on mobile screens (< 768px).

```tsx
import { useState } from 'react';
import { Modal, Button } from '@flowtop/ui';

function Example() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Placement Details</Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Remove Placement"
        description="This removes the product from the homepage only. The product itself is not deleted."
        busy={isSaving} // Intercepts Escape and close buttons while saving
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="danger" loading={isSaving} onClick={handleRemove}>
              Confirm Removal
            </Button>
          </>
        }
      >
        <p className="text-small text-muted">Are you sure you want to proceed?</p>
      </Modal>
    </>
  );
}
```

---

## 7. Table

Controlled data table with server-side sorting headers (`aria-sort`), loading skeleton, empty state, and scoped horizontal scroll.

```tsx
import { useState } from 'react';
import { Table, TableColumn, SortDirection } from '@flowtop/ui';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  priceFormatted: string;
}

const columns: TableColumn<ProductItem>[] = [
  { id: 'name', header: 'Product Name', sortable: true, accessor: p => p.name },
  { id: 'sku', header: 'SKU', sortable: false, accessor: p => p.sku },
  { id: 'price', header: 'Price', sortable: true, align: 'right', accessor: p => p.priceFormatted },
];

function ProductListTable({ products, loading }) {
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  return (
    <Table
      columns={columns}
      data={products}
      rowKey={p => p.id}
      sortColumn={sortCol}
      sortDirection={sortDir}
      onSort={(col, dir) => {
        setSortCol(col);
        setSortDir(dir);
        // Trigger server-side pagination / sort reload
      }}
      loading={loading}
      emptyState="No products found in this category."
    />
  );
}
```

---

## 8. Toast

Accessible toast notifications via `ToastProvider` and `useToast`.
- Errors stay until explicitly dismissed.
- Success, warning, and info toasts automatically dismiss after 5 seconds and pause on mouse hover.
- `toast.promise()` tracks promises and shows real success/failure states.

```tsx
// 1. Wrap your root in ToastProvider
import { ToastProvider, useToast, Button } from '@flowtop/ui';

export function AppRoot({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}

// 2. Trigger toasts anywhere
export function ProductEditor() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await toast.promise(saveProductApi(), {
        loading: 'Saving product specifications...',
        success: 'Product saved successfully.',
        error: (err) => `Failed to save: ${err.message}`,
      });
    } catch {
      // Error toast already displayed
    }
  };

  return (
    <Button variant="primary" onClick={handleSave}>
      Save Specifications
    </Button>
  );
}
```

---

## 9. Badge

Semantic status pill. **Always requires text content** for accessibility, never colour alone.

```tsx
import { Badge } from '@flowtop/ui';

<Badge variant="neutral">Draft</Badge>
<Badge variant="primary">Featured</Badge>
<Badge variant="success">Published</Badge>
<Badge variant="warning">Low Stock</Badge>
<Badge variant="error">Out of Stock</Badge>
<Badge variant="info">In Review</Badge>
```

---

## 10. Tabs

Accessible tabs following the WAI-ARIA tablist pattern. Supports Arrow keys (Left/Right/Up/Down), Home, and End navigation, plus a horizontally scrollable tabstrip on mobile devices.

```tsx
import { Tabs } from '@flowtop/ui';

// Data-driven usage:
<Tabs
  items={[
    { id: 'identity', label: 'Identity', content: <div>Identity fields...</div> },
    { id: 'commerce', label: 'Commerce', content: <div>Commerce fields...</div> },
    { id: 'technical', label: 'Technical', content: <div>Specifications...</div> },
  ]}
  defaultValue="identity"
/>
```

---

## 11. Spinner

Calm loading indicator with `role="status"` and accessible screen reader label. Under `prefers-reduced-motion: reduce`, switches from continuous rotation to calm opacity pulse.

```tsx
import { Spinner } from '@flowtop/ui';

<Spinner size="sm" label="Loading variant images..." />
<Spinner size="md" label="Processing order..." />
<Spinner size="lg" label="Uploading high-resolution asset..." />
```

---

## 12. Drawer

Native `<dialog>` sheet sliding in from `left`, `right`, or `bottom`. Reuses Modal's dialog logic: body scroll locks, Escape closes, focus traps, focus returns to opener on close.

```tsx
import { Drawer, Button } from '@flowtop/ui';

<Drawer
  open={isCartOpen}
  onClose={() => setIsCartOpen(false)}
  title="Your Shopping Bag"
  side="right"
  size="md"
>
  <div>Cart items...</div>
</Drawer>
```

---

## 13. Breadcrumbs

Accessible navigation trail `<nav aria-label="Breadcrumb">` with `aria-current="page"` on the active leaf item.

```tsx
import { Breadcrumbs } from '@flowtop/ui';

<Breadcrumbs
  items={[
    { label: 'Home', href: '/' },
    { label: 'Faucets', href: '/categories/faucets' },
    { label: 'Basin Mixers', href: '/collections/basin-mixers' },
    { label: 'Aura Tall Basin Mixer' },
  ]}
/>
```

---

## 14. Menu

Action button plus popup dropdown menu following WAI-ARIA Menu pattern. Full keyboard support: Arrow keys (Up/Down/Home/End), Enter/Space to select, Escape to close. Focus management returns to button upon closing.

```tsx
import { Menu, MenuItem, MenuDivider, Button } from '@flowtop/ui';

<Menu trigger={<Button variant="secondary">Quick Actions</Button>}>
  <MenuItem onClick={handleEdit}>Edit Product</MenuItem>
  <MenuItem onClick={handleDup}>Duplicate Entry</MenuItem>
  <MenuDivider />
  <MenuItem destructive onClick={handleDelete}>Delete Product</MenuItem>
</Menu>
```

---

## 15. Textarea

Multi-line input integrated with `Field` (label, hint, error). Includes optional live character counter (`maxLength` + `showCount`).

```tsx
import { Textarea } from '@flowtop/ui';

<Textarea
  label="Product Narrative"
  hint="Displayed prominently at the top of the collection page."
  placeholder="Crafted from pure architectural brass..."
  maxLength={300}
  showCount
  value={description}
  onChange={e => setDescription(e.target.value)}
  error={fieldErrors.description}
/>
```

---

## 16. Checkbox

Accessible checkbox control supporting indeterminate state (`indeterminate` prop), custom check and dash indicators, 44px minimum touch target, label, hint, and error.

```tsx
import { Checkbox } from '@flowtop/ui';

// Tri-state batch selection
<Checkbox
  label="Select All Products"
  indeterminate={selectedCount > 0 && selectedCount < totalCount}
  checked={selectedCount === totalCount}
  onChange={handleToggleAll}
/>
```

---

## 17. EmptyState

Actionable empty state providing clear next steps rather than a dead-end message.

```tsx
import { EmptyState, Button } from '@flowtop/ui';

<EmptyState
  title="No Placements Configured"
  description="Add featured collections or products to display on this page hero grid."
  action={
    <Button variant="primary" onClick={openAddModal}>
      Add Placement
    </Button>
  }
/>
```

---

## 18. Skeleton

Calm loading placeholder matching Flowtop design tokens. Supports `text`, `circular`, and `rectangular` shapes with smooth pulse animation.

```tsx
import { Skeleton } from '@flowtop/ui';

<Skeleton shape="circular" className="w-touch h-touch" />
<Skeleton shape="text" className="w-space-8" />
<Skeleton shape="rectangular" className="h-space-7 w-full rounded-md" />
```

---

## 19. ProgressBar

Determinate and indeterminate progress indicator following WAI-ARIA `progressbar` pattern.

```tsx
import { ProgressBar } from '@flowtop/ui';

// Determinate
<ProgressBar value={65} max={100} label="Upload Progress" showLabel />

// Indeterminate (calm continuous sweep)
<ProgressBar indeterminate label="Optimizing media assets..." />
```

---

## 20. Radio & RadioGroup

WAI-ARIA radiogroup pattern with Flowtop purple ring indicator, 44px touch targets, horizontal or vertical orientation, label, hint, and error.

```tsx
import { RadioGroup, Radio } from '@flowtop/ui';

<RadioGroup
  label="Finishing Tone"
  value={finish}
  onChange={setFinish}
  error={fieldErrors.finish}
>
  <Radio value="chrome" label="Polished Chrome" hint="Standard reflective finish" />
  <Radio value="brushed-gold" label="Brushed Architectural Gold" hint="PVD coated brass" />
  <Radio value="matte-black" label="Matte Obsidian Black" />
</RadioGroup>
```

---

## 21. Switch

Accessible toggle switch with `role="switch"`, smooth translation, 44px touch target, and keyboard control (Space / Enter).

```tsx
import { Switch } from '@flowtop/ui';

<Switch
  label="Publish to Online Store"
  hint="Immediately visible in public search and catalogue."
  checked={isPublished}
  onChange={setIsPublished}
/>
```

---

## 22. Tooltip

Lightweight advisory tooltip that opens on hover and keyboard focus. Closes on Escape. Never holds essential information.

```tsx
import { Tooltip, Button } from '@flowtop/ui';

<Tooltip content="Permanent deletion cannot be undone.">
  <Button variant="danger">Archive</Button>
</Tooltip>
```

---

## 23. Pagination

Accessible pagination with real `getHref(page)` URLs ensuring full functionality without JavaScript, plus optional `onPageChange` handler for client-side interception.

```tsx
import { Pagination } from '@flowtop/ui';

<Pagination
  currentPage={currentPage}
  totalPages={12}
  getHref={(page) => `/catalogue?page=${page}`}
  onPageChange={(page) => setPage(page)}
/>
```

---

## 24. Avatar

User or item avatar with automatic initials fallback when image is missing or fails to load.

```tsx
import { Avatar } from '@flowtop/ui';

<Avatar src="/team/arun.jpg" alt="Arun Kumar" size="md" />
<Avatar alt="Vikram Malhotra" size="lg" shape="square" />
```

