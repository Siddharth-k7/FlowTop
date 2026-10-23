# @flowtop/ui - Components Guide

Core component library for Flowtop (`frontend/` and `admin/`).
Built with strict TypeScript, native web APIs (`<dialog>`, native `<select>`), WAI-ARIA standards, and Flowtop design tokens.

Every code example below is a complete, self-contained module with its own imports ready to be copied and pasted directly into consumer applications.

---

## 1. Button

Supports `primary`, `secondary`, `ghost`, and `danger` variants, `sm`, `md`, `lg` sizes, loading states (preserves button width and renders `Spinner`), and accessible icon-only buttons.
Also exports `buttonClasses()` for use with Next.js `<Link>`.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | Optional | Visual styling variant. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Optional | Button size (minimum 44px touch target enforced). |
| `iconOnly` | `boolean` | `false` | Optional | Square icon button. When `true`, `aria-label` is required in TypeScript. |
| `loading` | `boolean` | `false` | Optional | Preserves button dimensions, disables clicks, renders centered `Spinner`. |
| `disabled` | `boolean` | `false` | Optional | Disables button interactions and sets `opacity-50`. |
| `aria-label` | `string` | `undefined` | Required if `iconOnly={true}` | Accessible name for screen readers. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Optional | Native HTML button type. |
| `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | `undefined` | Optional | Click event handler. |
| `className` | `string` | `''` | Optional | Additional Tailwind utility classes. |
| `children` | `React.ReactNode` | `undefined` | Optional | Button label or icon content. |

```tsx
import { useState } from 'react';
import Link from 'next/link';
import { Button, buttonClasses } from '@flowtop/ui';

export function ButtonExample() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSave = () => {
    setIsSubmitting(true);
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const handleDelete = () => {
    console.info('Placement deleted');
  };

  return (
    <div className="flex flex-wrap gap-space-3 items-center">
      {/* Standard action buttons */}
      <Button variant="primary" onClick={handleSave}>
        Save Changes
      </Button>

      {/* Secondary / Ghost / Danger */}
      <Button variant="secondary">Cancel</Button>
      <Button variant="ghost">Preview</Button>
      <Button variant="danger" onClick={handleDelete}>
        Delete Placement
      </Button>

      {/* Loading state (preserves button width, disables clicks, shows Spinner) */}
      <Button variant="primary" loading={isSubmitting} onClick={handleSave}>
        Publish
      </Button>

      {/* Icon-only button (requires aria-label in TypeScript) */}
      <Button variant="ghost" iconOnly aria-label="Close menu">
        <svg className="w-space-4 h-space-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </Button>

      {/* Next.js Link styled as a Button */}
      <Link href="/products" className={buttonClasses({ variant: 'primary', size: 'md' })}>
        Browse Catalogue
      </Link>
    </div>
  );
}
```

---

## 2. Input

Supports `text`, `email`, `password` (with built-in accessible show/hide toggle), and `search`. Includes integrated `Field` wrapper for label, hint, and error.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Accessible field label linked via generated `id`. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Explanatory hint text linked via `aria-describedby`. |
| `error` | `string` | `undefined` | Optional | Error message linked via `aria-describedby` with `aria-invalid="true"`. |
| `type` | `string` | `'text'` | Optional | Input type (`'text'`, `'email'`, `'password'`, `'search'`, etc.). |
| `value` | `string \| number \| readonly string[]` | `undefined` | Optional | Controlled input value. |
| `defaultValue` | `string \| number \| readonly string[]` | `undefined` | Optional | Uncontrolled default input value. |
| `onChange` | `React.ChangeEventHandler<HTMLInputElement>` | `undefined` | Optional | Change event handler. |
| `leftIcon` | `React.ReactNode` | `undefined` | Optional | Decorative icon anchored to the left of the input. |
| `rightIcon` | `React.ReactNode` | `undefined` | Optional | Decorative icon anchored to the right of the input. |
| `disabled` | `boolean` | `false` | Optional | Disables input interaction. |
| `required` | `boolean` | `false` | Optional | Marks input as required. |
| `placeholder` | `string` | `undefined` | Optional | Input placeholder text (must not replace label). |
| `containerClassName` | `string` | `''` | Optional | Additional classes for input wrapper container. |
| `className` | `string` | `''` | Optional | Additional classes for `<input>` element. |

```tsx
import { useState } from 'react';
import { Input } from '@flowtop/ui';

export function InputExample() {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [query, setQuery] = useState('');
  const [fieldErrors] = useState<Record<string, string>>({
    name: 'Product name is required for catalogue indexing.',
  });

  return (
    <div className="flex flex-col gap-space-4 max-w-md">
      {/* Text input with label & error */}
      <Input
        label="Product Name"
        placeholder="e.g. Opel Basin Mixer"
        value={name}
        onChange={e => setName(e.target.value)}
        error={fieldErrors.name}
        required
      />

      {/* Password input with show/hide toggle */}
      <Input
        type="password"
        label="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        hint="Must be at least 12 characters."
      />

      {/* Search input with icon */}
      <Input
        type="search"
        placeholder="Search products by SKU or name..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
    </div>
  );
}
```

---

## 3. Select

Styled native select with custom dropdown indicator and 44px minimum touch target. Supports either an `options` prop array or native `<option>` children.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Accessible field label linked via generated `id`. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Explanatory hint text linked via `aria-describedby`. |
| `error` | `string` | `undefined` | Optional | Error message linked via `aria-describedby` with `aria-invalid="true"`. |
| `options` | `SelectOption[]` | `undefined` | Optional | Array of `{ label: string; value: string \| number; disabled?: boolean }`. |
| `value` | `string \| number \| readonly string[]` | `undefined` | Optional | Controlled select value. |
| `defaultValue` | `string \| number \| readonly string[]` | `undefined` | Optional | Uncontrolled default select value. |
| `onChange` | `React.ChangeEventHandler<HTMLSelectElement>` | `undefined` | Optional | Change event handler. |
| `disabled` | `boolean` | `false` | Optional | Disables select interaction. |
| `required` | `boolean` | `false` | Optional | Marks select as required. |
| `containerClassName` | `string` | `''` | Optional | Additional classes for wrapper container. |
| `className` | `string` | `''` | Optional | Additional classes for `<select>` element. |
| `children` | `React.ReactNode` | `undefined` | Optional | Native `<option>` elements when not using `options` prop. |

```tsx
import { useState } from 'react';
import { Select } from '@flowtop/ui';

export function SelectExample() {
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('featured');
  const [fieldErrors] = useState<Record<string, string>>({
    categoryId: 'Please select a valid parent category.',
  });

  return (
    <div className="flex flex-col gap-space-4 max-w-md">
      {/* Using options prop */}
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

      {/* Using native <option> children */}
      <Select
        label="Placement Location"
        value={location}
        onChange={e => setLocation(e.target.value)}
      >
        <option value="featured">Homepage: Featured</option>
        <option value="new_arrivals">Homepage: New Arrivals</option>
      </Select>
    </div>
  );
}
```

---

## 4. Field (Form Control Wrapper)

Shared form field wrapper used by `Input`, `Select`, and custom controls. Provides label, hint, and API error formatting with automatic `aria-describedby` and `aria-invalid` bindings.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Accessible label text. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Supporting hint text. |
| `error` | `string` | `undefined` | Optional | Validation error message. |
| `required` | `boolean` | `false` | Optional | Displays required asterisk and passes required flag. |
| `id` | `string` | `useId()` | Optional | Unique ID shared across label, input, hint, and error. |
| `className` | `string` | `''` | Optional | Additional wrapper container classes. |
| `children` | `React.ReactNode \| ((props) => React.ReactNode)` | `undefined` | Required | Render function receiving `{ id, 'aria-describedby', 'aria-invalid', required }` or static elements. |

```tsx
import { useState } from 'react';
import { Field } from '@flowtop/ui';

export function FieldExample() {
  const [dimensions, setDimensions] = useState('120x80');
  const [errors] = useState<Record<string, string>>({
    dim: 'Invalid millimeter format. Example: 120x80',
  });

  return (
    <Field
      label="Custom Control"
      hint="Specify dimensions in millimetres"
      error={errors.dim}
      required
    >
      {({ id, 'aria-describedby': describedBy, 'aria-invalid': invalid, required }) => (
        <input
          id={id}
          value={dimensions}
          onChange={e => setDimensions(e.target.value)}
          aria-describedby={describedBy}
          aria-invalid={invalid}
          required={required}
          className="p-space-2 border border-border-input rounded-sm text-small text-fg bg-surface-solid focus-ring"
        />
      )}
    </Field>
  );
}
```

---

## 5. Card

Flexible container supporting `flat`, `raised`, and `inset` variants with `Header`, `Title`, `Body`, and `Footer` subcomponents.

### Props

| Component | Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|---|
| `Card` | `variant` | `'flat' \| 'raised' \| 'inset'` | `'flat'` | Optional | Border and elevation styling. |
| `Card` | `as` | `'div' \| 'article' \| 'section'` | `'div'` | Optional | Semantic HTML container tag. |
| `Card` | `className` | `string` | `''` | Optional | Additional container classes. |
| `Card` | `children` | `React.ReactNode` | `undefined` | Required | Card subcomponents and content. |
| `Card.Header` | `className` | `string` | `''` | Optional | Additional header bar classes. |
| `Card.Header` | `children` | `React.ReactNode` | `undefined` | Required | Header elements (title, badges, actions). |
| `Card.Title` | `as` | `'h2' \| 'h3' \| 'h4' \| 'span'` | `'h3'` | Optional | Heading tag level. |
| `Card.Title` | `className` | `string` | `''` | Optional | Additional title typography classes. |
| `Card.Title` | `children` | `React.ReactNode` | `undefined` | Required | Title heading text. |
| `Card.Body` | `className` | `string` | `''` | Optional | Additional body padding classes. |
| `Card.Body` | `children` | `React.ReactNode` | `undefined` | Required | Card body content. |
| `Card.Footer` | `className` | `string` | `''` | Optional | Additional footer classes. |
| `Card.Footer` | `children` | `React.ReactNode` | `undefined` | Required | Footer action buttons. |

```tsx
import { Card, Badge, Button } from '@flowtop/ui';

export function CardExample() {
  return (
    <Card variant="raised" className="max-w-md">
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
  );
}
```

---

## 6. Modal

Native HTML5 `<dialog>` component. Automatically traps focus, locks body scroll, handles Escape key, returns focus to opener on close, and transforms into a bottom sheet on mobile screens (< 768px).

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `open` | `boolean` | — | Required | Controls modal visibility via HTML5 `<dialog>`. |
| `onClose` | `() => void` | — | Required | Callback triggered on Escape, backdrop click, or close button. |
| `title` | `string` | — | Required | Modal header title linked via `aria-labelledby`. |
| `description` | `string` | `undefined` | Optional | Subtitle linked via `aria-describedby`. |
| `busy` | `boolean` | `false` | Optional | Disables close actions while saving/submitting; sets `aria-busy="true"`. |
| `maxWidth` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | Optional | Max dialog width on desktop (turns into bottom sheet on mobile). |
| `footer` | `React.ReactNode` | `undefined` | Optional | Sticky footer action area. |
| `className` | `string` | `''` | Optional | Additional classes for `<dialog>`. |
| `children` | `React.ReactNode` | `undefined` | Required | Modal body content. |

```tsx
import { useState } from 'react';
import { Modal, Button } from '@flowtop/ui';

export function ModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleRemove = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setIsOpen(false);
    }, 1000);
  };

  return (
    <div>
      <Button onClick={() => setIsOpen(true)}>Open Placement Details</Button>

      <Modal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        title="Remove Placement"
        description="This removes the product from the homepage only. The product itself is not deleted."
        busy={isSaving}
        footer={
          <div className="flex gap-space-2">
            <Button variant="secondary" onClick={() => setIsOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button variant="danger" loading={isSaving} onClick={handleRemove}>
              Confirm Removal
            </Button>
          </div>
        }
      >
        <p className="text-small text-fg-muted">Are you sure you want to proceed?</p>
      </Modal>
    </div>
  );
}
```

---

## 7. Table

Controlled data table with server-side sorting headers (`aria-sort`), loading skeleton, empty state, and scoped horizontal scroll.

`Table` does not reorder `data` itself: `onSort` reports the column and direction, and the caller passes back sorted rows (from the API, or from a `useMemo` for client-side data). While `loading` is true the `<table>` carries `aria-busy="true"`. With `onRowClick`, the first cell of each row is a `<button>`, so rows are reachable by keyboard.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `columns` | `TableColumn<T>[]` | — | Required | Column definitions `{ id, header, sortable?, align?, accessor? }`. |
| `data` | `T[]` | — | Required | Array of row data records. |
| `rowKey` | `(item: T) => string` | — | Required | Unique key generator for each data row. |
| `sortColumn` | `string` | `undefined` | Optional | ID of currently sorted column. |
| `sortDirection` | `'asc' \| 'desc'` | `'asc'` | Optional | Active sort direction (`aria-sort`). |
| `onSort` | `(columnId: string, direction: SortDirection) => void` | `undefined` | Optional | Callback when sortable header is clicked. |
| `loading` | `boolean` | `false` | Optional | Shows table skeleton rows while fetching data. |
| `skeletonRowCount` | `number` | `5` | Optional | Number of skeleton placeholder rows when `loading={true}`. |
| `emptyState` | `React.ReactNode` | `undefined` | Optional | Custom empty state message when `data` is empty. |
| `caption` | `string` | `undefined` | Optional | Accessible `<caption>` for screen readers. |
| `onRowClick` | `(item: T) => void` | `undefined` | Optional | Row click event handler. |
| `className` | `string` | `''` | Optional | Additional table wrapper classes. |

```tsx
import { useState } from 'react';
import { Table, type TableColumn, type SortDirection } from '@flowtop/ui';

interface ProductItem {
  id: string;
  name: string;
  sku: string;
  priceFormatted: string;
}

const sampleProducts: ProductItem[] = [
  { id: 'p1', name: 'Opel Basin Mixer', sku: 'OPL-BM-01', priceFormatted: '₹14,500' },
  { id: 'p2', name: 'Aura Shower Column', sku: 'AUR-SC-02', priceFormatted: '₹32,000' },
  { id: 'p3', name: 'Linear Concealed Valve', sku: 'LIN-CV-03', priceFormatted: '₹8,900' },
];

const columns: TableColumn<ProductItem>[] = [
  { id: 'name', header: 'Product Name', sortable: true, accessor: p => p.name },
  { id: 'sku', header: 'SKU', sortable: false, accessor: p => p.sku },
  { id: 'price', header: 'Price', sortable: true, align: 'right', accessor: p => p.priceFormatted },
];

export function TableExample() {
  const [sortCol, setSortCol] = useState('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');
  const [loading, setLoading] = useState(false);

  return (
    <Table
      columns={columns}
      data={sampleProducts}
      rowKey={p => p.id}
      sortColumn={sortCol}
      sortDirection={sortDir}
      onSort={(col, dir) => {
        setSortCol(col);
        setSortDir(dir);
        setLoading(true);
        setTimeout(() => setLoading(false), 500);
      }}
      loading={loading}
      emptyState="No products found in this category."
    />
  );
}
```

---

## 8. ToastProvider & useToast

Accessible toast notification system. It ships as `ToastProvider` and the `useToast` hook.
- Errors stay until explicitly dismissed.
- Success, warning, and info toasts automatically dismiss after 5 seconds and pause on mouse hover and keyboard focus.
- `toast.promise()` tracks promises and shows real success/failure states with properly narrowed error types. Success auto-dismisses after 5 seconds (pausing on hover and focus), while errors persist until dismissed.

### Props & Hook API

| Component / Hook | Prop / Method | Type / Signature | Description |
|---|---|---|---|
| `ToastProvider` | `children` | `React.ReactNode` (Required) | Application component tree wrapped by the provider. |
| `useToast()` | `success` | `(message, options?) => string` | Triggers a green success toast (5s auto-dismiss). |
| `useToast()` | `error` | `(message, options?) => string` | Triggers a red error toast (persists until dismissed). |
| `useToast()` | `warning` | `(message, options?) => string` | Triggers an amber warning toast (5s auto-dismiss). |
| `useToast()` | `info` | `(message, options?) => string` | Triggers a blue info toast (5s auto-dismiss). |
| `useToast()` | `promise` | `<T>(promise, { loading, success, error }, options?) => Promise<T>` | Displays loading toast, then swaps to success (5s auto-dismiss, pauses on hover/focus) or error (persists until dismissed). Note: `error` callback receives `(err: unknown)`. |
| `useToast()` | `dismiss` | `(id: string) => void` | Closes toast by ID. |
| `useToast()` | `clear` | `() => void` | Closes all active toasts. |

```tsx
import { ToastProvider, useToast, Button } from '@flowtop/ui';

function saveProductApi(): Promise<{ id: string }> {
  return new Promise(resolve => setTimeout(() => resolve({ id: 'prod-123' }), 1000));
}

function ProductEditor() {
  const toast = useToast();

  const handleSave = async () => {
    try {
      await toast.promise(saveProductApi(), {
        loading: 'Saving product specifications...',
        success: 'Product saved successfully.',
        error: (err: unknown) => `Failed to save: ${err instanceof Error ? err.message : String(err)}`,
      });
    } catch {
      // Handled via toast
    }
  };

  return (
    <Button variant="primary" onClick={handleSave}>
      Save Specifications
    </Button>
  );
}

export function ToastExample() {
  return (
    <ToastProvider>
      <ProductEditor />
    </ToastProvider>
  );
}
```

---

## 9. Badge

Semantic status pill. **Always requires text content** for accessibility, never colour alone.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `variant` | `'neutral' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'neutral'` | Optional | Semantic status color token variant. |
| `icon` | `React.ReactNode` | `undefined` | Optional | Leading status icon. |
| `className` | `string` | `''` | Optional | Additional badge styling classes. |
| `children` | `React.ReactNode` | — | Required | Descriptive text content (never color alone). |

```tsx
import { Badge } from '@flowtop/ui';

export function BadgeExample() {
  return (
    <div className="flex flex-wrap gap-space-2">
      <Badge variant="neutral">Draft</Badge>
      <Badge variant="primary">Featured</Badge>
      <Badge variant="success">Published</Badge>
      <Badge variant="warning">Low Stock</Badge>
      <Badge variant="error">Out of Stock</Badge>
      <Badge variant="info">In Review</Badge>
    </div>
  );
}
```

---

## 10. Tabs

Accessible tabs following the WAI-ARIA tablist pattern. Supports Arrow keys (Left/Right/Up/Down), Home, and End navigation, plus a horizontally scrollable tabstrip on mobile devices.
Supports both data-driven `items` array usage and compound component composition (`TabList`, `Tab`, and `TabPanel`).

Every `TabPanel` keeps its element in the DOM (inactive ones are `hidden`) so each tab's `aria-controls` resolves, but only the active panel mounts its children. A `Tab` with no matching `TabPanel` sets no `aria-controls`. A disabled `Tab` is skipped by arrow-key navigation and cannot be selected.

### Props

| Component | Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|---|
| `Tabs` | `items` | `TabItem[]` | `undefined` | Optional | Data-driven tabs array `{ id, label, content?, disabled? }`. |
| `Tabs` | `value` | `string` | `undefined` | Optional | Controlled active tab ID. |
| `Tabs` | `defaultValue` | `string` | First item ID or `''` | Optional | Initial active tab ID for uncontrolled mode. |
| `Tabs` | `onChange` | `(value: string) => void` | `undefined` | Optional | Callback when active tab changes. |
| `Tabs` | `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Optional | Tabstrip orientation (`aria-orientation`). |
| `Tabs` | `className` | `string` | `''` | Optional | Additional container classes. |
| `Tabs` | `children` | `React.ReactNode` | `undefined` | Optional | Compound components (`TabList`, `TabPanel`). |
| `TabList` | `aria-label` | `string` | — | Required | Accessible label for the tablist container. |
| `TabList` | `className` | `string` | `''` | Optional | Additional tablist styling classes. |
| `TabList` | `children` | `React.ReactNode` | — | Required | `<Tab>` button items. |
| `Tab` | `value` | `string` | — | Required | Unique tab identifier matching a `<TabPanel>`. |
| `Tab` | `disabled` | `boolean` | `false` | Optional | Disables tab selection. |
| `Tab` | `className` | `string` | `''` | Optional | Additional tab button classes. |
| `Tab` | `children` | `React.ReactNode` | — | Required | Tab label content. |
| `TabPanel` | `value` | `string` | — | Required | Unique identifier matching a `<Tab>`. |
| `TabPanel` | `className` | `string` | `''` | Optional | Additional panel styling classes. |
| `TabPanel` | `children` | `React.ReactNode` | — | Required | Panel body content rendered when active. |

```tsx
import { Tabs, TabList, Tab, TabPanel } from '@flowtop/ui';

export function TabsExample() {
  return (
    <div className="flex flex-col gap-space-6 w-full">
      {/* 1. Data-driven usage with items array */}
      <Tabs
        items={[
          { id: 'identity', label: 'Identity', content: <div>Identity specification fields</div> },
          { id: 'commerce', label: 'Commerce', content: <div>Commerce pricing and inventory</div> },
          { id: 'technical', label: 'Technical', content: <div>Technical dimensional drawings</div> },
        ]}
        defaultValue="identity"
      />

      {/* 2. Compound component usage with TabList, Tab, and TabPanel */}
      <Tabs defaultValue="general">
        <TabList aria-label="Product Configuration">
          <Tab value="general">General</Tab>
          <Tab value="finishes">Finishes</Tab>
          <Tab value="seo">SEO</Tab>
        </TabList>
        <TabPanel value="general">
          <p className="text-body text-fg">General product metadata and SKU configuration.</p>
        </TabPanel>
        <TabPanel value="finishes">
          <p className="text-body text-fg">Finishing swatch associations and finish codes.</p>
        </TabPanel>
        <TabPanel value="seo">
          <p className="text-body text-fg">Search engine title tag and meta descriptions.</p>
        </TabPanel>
      </Tabs>
    </div>
  );
}
```

---

## 11. Spinner

Calm loading indicator with `role="status"` and accessible screen reader label. Under `prefers-reduced-motion: reduce`, switches from continuous rotation to calm opacity pulse.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Optional | Spinner diameter (`sm`: 16px, `md`: 24px, `lg`: 32px). |
| `label` | `string` | `'Loading...'` | Optional | Screen-reader accessible status description (`.sr-only`). |
| `className` | `string` | `''` | Optional | Additional SVG styling classes. |

```tsx
import { Spinner } from '@flowtop/ui';

export function SpinnerExample() {
  return (
    <div className="flex items-center gap-space-4">
      <Spinner size="sm" label="Loading variant images..." />
      <Spinner size="md" label="Processing order..." />
      <Spinner size="lg" label="Uploading high-resolution asset..." />
    </div>
  );
}
```

---

## 12. Drawer

Native `<dialog>` sheet sliding in from `left`, `right`, or `bottom`. Reuses Modal's dialog logic: body scroll locks, Escape closes, focus traps, focus returns to opener on close.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `open` | `boolean` | — | Required | Controls visibility via HTML5 `<dialog>`. |
| `onClose` | `() => void` | — | Required | Close handler for Escape, backdrop, or close button. |
| `title` | `string` | — | Required | Drawer title linked via `aria-labelledby`. |
| `description` | `string` | `undefined` | Optional | Supporting description linked via `aria-describedby`. |
| `position` | `'left' \| 'right' \| 'bottom'` | `'right'` | Optional | Slide-in drawer edge position. |
| `busy` | `boolean` | `false` | Optional | Disables close actions while saving/submitting; sets `aria-busy="true"`. |
| `footer` | `React.ReactNode` | `undefined` | Optional | Sticky bottom drawer action area. |
| `className` | `string` | `''` | Optional | Additional dialog styling classes. |
| `children` | `React.ReactNode` | — | Required | Drawer scrollable body content. |

```tsx
import { useState } from 'react';
import { Drawer, Button } from '@flowtop/ui';

export function DrawerExample() {
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div>
      <Button onClick={() => setIsCartOpen(true)}>Open Shopping Bag</Button>

      <Drawer
        open={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        title="Your Shopping Bag"
        position="right"
        footer={
          <Button variant="primary" onClick={() => setIsCartOpen(false)}>
            Checkout
          </Button>
        }
      >
        <div className="text-body text-fg">Cart items and order summary</div>
      </Drawer>
    </div>
  );
}
```

---

## 13. Breadcrumbs

Accessible navigation trail `<nav aria-label="Breadcrumb">` with `aria-current="page"` on the active leaf item.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `items` | `BreadcrumbItem[]` | — | Required | Array of `{ label: React.ReactNode, href?: string }`. Leaf item receives `aria-current="page"`. |
| `separator` | `React.ReactNode` | Chevron SVG | Optional | Custom separator element between breadcrumb items. |
| `className` | `string` | `''` | Optional | Additional `<nav>` classes. |

```tsx
import { Breadcrumbs } from '@flowtop/ui';

export function BreadcrumbsExample() {
  return (
    <Breadcrumbs
      items={[
        { label: 'Home', href: '/' },
        { label: 'Faucets', href: '/categories/faucets' },
        { label: 'Basin Mixers', href: '/collections/basin-mixers' },
        { label: 'Aura Tall Basin Mixer' },
      ]}
    />
  );
}
```

---

## 14. Menu

Action button plus popup dropdown menu following WAI-ARIA Menu pattern. Full keyboard support: Arrow keys (Up/Down/Home/End), Enter/Space to select, Escape to close. Focus returns to trigger button upon closing.

### Props

| Component | Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|---|
| `Menu` | `trigger` | `React.ReactElement` | — | Required | Trigger button element that receives popup aria attributes. |
| `Menu` | `align` | `'left' \| 'right'` | `'left'` | Optional | Popover alignment relative to trigger button. |
| `Menu` | `className` | `string` | `''` | Optional | Additional menu popover container classes. |
| `Menu` | `children` | `React.ReactNode` | — | Required | `<MenuItem>` and `<MenuDivider>` elements. |
| `MenuItem` | `destructive` | `boolean` | `false` | Optional | Red error highlight for irreversible/delete actions. |
| `MenuItem` | `icon` | `React.ReactNode` | `undefined` | Optional | Leading action icon. |
| `MenuItem` | `disabled` | `boolean` | `false` | Optional | Disables menu action item. |
| `MenuItem` | `onClick` | `React.MouseEventHandler<HTMLButtonElement>` | `undefined` | Optional | Menu item click event handler. |
| `MenuItem` | `className` | `string` | `''` | Optional | Additional item styling classes. |
| `MenuItem` | `children` | `React.ReactNode` | — | Required | Menu item label. |
| `MenuDivider` | — | — | — | — | Visual dividing rule (`<hr role="separator">`). |

```tsx
import { Menu, MenuItem, MenuDivider, Button } from '@flowtop/ui';

export function MenuExample() {
  const handleEdit = () => console.info('Edit selected');
  const handleDup = () => console.info('Duplicate selected');
  const handleDelete = () => console.info('Delete selected');

  return (
    <Menu trigger={<Button variant="secondary">Quick Actions</Button>}>
      <MenuItem onClick={handleEdit}>Edit Product</MenuItem>
      <MenuItem onClick={handleDup}>Duplicate Entry</MenuItem>
      <MenuDivider />
      <MenuItem destructive onClick={handleDelete}>Delete Product</MenuItem>
    </Menu>
  );
}
```

---

## 15. Textarea

Multi-line input integrated with `Field` (label, hint, error). Includes optional live character counter (`maxLength` + `showCount`).

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Accessible field label linked via generated `id`. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Supporting hint text linked via `aria-describedby`. |
| `error` | `string` | `undefined` | Optional | Error message linked via `aria-describedby` with `aria-invalid="true"`. |
| `showCount` | `boolean` | `false` | Optional | Displays live character counter indicator when `maxLength` is set. |
| `maxLength` | `number` | `undefined` | Optional | Max characters allowed. |
| `rows` | `number` | `4` | Optional | Initial visible text rows. |
| `value` | `string` | `undefined` | Optional | Controlled textarea value. |
| `defaultValue` | `string` | `undefined` | Optional | Uncontrolled default value. |
| `onChange` | `React.ChangeEventHandler<HTMLTextAreaElement>` | `undefined` | Optional | Change event handler. |
| `disabled` | `boolean` | `false` | Optional | Disables textarea interaction. |
| `required` | `boolean` | `false` | Optional | Marks textarea as required. |
| `placeholder` | `string` | `undefined` | Optional | Placeholder text. |
| `className` | `string` | `''` | Optional | Additional classes for `<textarea>` element. |

```tsx
import { useState } from 'react';
import { Textarea } from '@flowtop/ui';

export function TextareaExample() {
  const [description, setDescription] = useState('');
  const [fieldErrors] = useState<Record<string, string>>({
    description: 'Description exceeds maximum allowed length.',
  });

  return (
    <Textarea
      label="Product Narrative"
      hint="Displayed prominently at the top of the collection page."
      placeholder="Crafted from pure architectural brass..."
      maxLength={300}
      showCount
      value={description}
      onChange={e => setDescription(e.target.value)}
      error={description.length > 300 ? fieldErrors.description : undefined}
    />
  );
}
```

---

## 16. Checkbox

Accessible checkbox control supporting indeterminate state (`indeterminate` prop), custom check and dash indicators, 44px minimum touch target, label, hint, and error.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Accessible checkbox label. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Explanatory hint text. |
| `error` | `string` | `undefined` | Optional | Validation error message. |
| `checked` | `boolean` | `false` | Optional | Controlled checked state. |
| `defaultChecked` | `boolean` | `false` | Optional | Uncontrolled initial checked state. |
| `indeterminate` | `boolean` | `false` | Optional | Tri-state indeterminate dash state (e.g. partial batch select). |
| `disabled` | `boolean` | `false` | Optional | Disables interaction and lowers opacity. |
| `onChange` | `React.ChangeEventHandler<HTMLInputElement>` | `undefined` | Optional | Change event handler. |
| `className` | `string` | `''` | Optional | Additional wrapper container classes. |

```tsx
import { useState } from 'react';
import { Checkbox } from '@flowtop/ui';

export function CheckboxExample() {
  const [selectedCount, setSelectedCount] = useState(2);
  const totalCount = 5;

  const handleToggleAll = () => {
    setSelectedCount(prev => (prev === totalCount ? 0 : totalCount));
  };

  return (
    <Checkbox
      label="Select All Products"
      indeterminate={selectedCount > 0 && selectedCount < totalCount}
      checked={selectedCount === totalCount}
      onChange={handleToggleAll}
    />
  );
}
```

---

## 17. EmptyState

Actionable empty state providing clear next steps rather than a dead-end message.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `title` | `string` | — | Required | Heading explaining the empty condition. |
| `description` | `React.ReactNode` | — | Required | Guidance or next steps for the user. |
| `icon` | `React.ReactNode` | Tray SVG | Optional | Decorative centered illustration/icon. |
| `action` | `React.ReactNode` | `undefined` | Optional | Primary call-to-action button. |
| `secondaryAction` | `React.ReactNode` | `undefined` | Optional | Secondary action button or link. |
| `className` | `string` | `''` | Optional | Additional container styling classes. |

```tsx
import { EmptyState, Button } from '@flowtop/ui';

export function EmptyStateExample() {
  const openAddModal = () => console.info('Add modal triggered');

  return (
    <EmptyState
      title="No Placements Configured"
      description="Add featured collections or products to display on this page hero grid."
      action={<Button variant="primary" onClick={openAddModal}>Add Placement</Button>}
    />
  );
}
```

---

## 18. Skeleton

Calm loading placeholder matching Flowtop design tokens. Supports `text`, `circular`, `rectangular`, and `card` variants with smooth pulse animation.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `variant` | `'text' \| 'circular' \| 'rectangular' \| 'card'` | `'text'` | Optional | Shape and styling variant. |
| `width` | `string \| number` | `undefined` | Optional | Explicit width (number in px or CSS string). |
| `height` | `string \| number` | `undefined` | Optional | Explicit height (number in px or CSS string). |
| `className` | `string` | `''` | Optional | Additional utility classes (e.g. `w-full`, `rounded-md`). |

```tsx
import { Skeleton } from '@flowtop/ui';

export function SkeletonExample() {
  return (
    <div className="flex flex-col gap-space-3 max-w-sm">
      <Skeleton variant="circular" width={44} height={44} />
      <Skeleton variant="text" />
      <Skeleton variant="rectangular" height={120} className="w-full" />
    </div>
  );
}
```

---

## 19. ProgressBar

Determinate and indeterminate progress indicator following WAI-ARIA `progressbar` pattern.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `value` | `number` | `undefined` | Optional | Current progress value (0 to `max`). Omitting it activates indeterminate sweep animation. |
| `max` | `number` | `100` | Optional | Maximum progress value. |
| `label` | `string` | `undefined` | Optional | Accessible text label displayed above the bar. |
| `showValue` | `boolean` | `false` | Optional | Displays percentage text on the right side. |
| `size` | `'sm' \| 'md'` | `'md'` | Optional | Track height (`sm`: 4px, `md`: 8px). |
| `className` | `string` | `''` | Optional | Additional container classes. |

```tsx
import { ProgressBar } from '@flowtop/ui';

export function ProgressBarExample() {
  return (
    <div className="flex flex-col gap-space-4 max-w-md">
      {/* Determinate progress bar */}
      <ProgressBar value={65} max={100} label="Upload Progress" showValue />

      {/* Indeterminate progress bar (value omitted) */}
      <ProgressBar label="Optimizing media assets..." />
    </div>
  );
}
```

---

## 20. Radio & RadioGroup

WAI-ARIA radiogroup pattern with Flowtop purple ring indicator, 44px touch targets, horizontal or vertical orientation, label, hint, and error.

### Props

| Component | Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|---|
| `RadioGroup` | `name` | `string` | `useId()` | Optional | Shared input name for all child radios. |
| `RadioGroup` | `value` | `string` | `undefined` | Optional | Controlled selected radio value. |
| `RadioGroup` | `defaultValue` | `string` | `undefined` | Optional | Uncontrolled default radio value. |
| `RadioGroup` | `onChange` | `(value: string) => void` | `undefined` | Optional | Callback when selection changes. |
| `RadioGroup` | `label` | `React.ReactNode` | `undefined` | Optional | Accessible group label (`aria-labelledby`). |
| `RadioGroup` | `hint` | `React.ReactNode` | `undefined` | Optional | Supporting group hint text. |
| `RadioGroup` | `error` | `string` | `undefined` | Optional | Validation error message for group. |
| `RadioGroup` | `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Optional | Layout orientation of radio buttons. |
| `RadioGroup` | `disabled` | `boolean` | `false` | Optional | Disables all child radio buttons. |
| `RadioGroup` | `required` | `boolean` | `false` | Optional | Marks group as required. |
| `RadioGroup` | `className` | `string` | `''` | Optional | Additional group container classes. |
| `RadioGroup` | `children` | `React.ReactNode` | — | Required | `<Radio>` items. |
| `Radio` | `value` | `string` | — | Required | Value submitted for this option. |
| `Radio` | `label` | `React.ReactNode` | `undefined` | Optional | Label for this option. |
| `Radio` | `hint` | `React.ReactNode` | `undefined` | Optional | Secondary hint below the label. |
| `Radio` | `disabled` | `boolean` | `false` | Optional | Disables this specific radio option. |
| `Radio` | `className` | `string` | `''` | Optional | Additional radio wrapper classes. |

```tsx
import { useState } from 'react';
import { RadioGroup, Radio } from '@flowtop/ui';

export function RadioGroupExample() {
  const [finish, setFinish] = useState('chrome');
  const [fieldErrors] = useState<Record<string, string>>({
    finish: 'Special order finish requires approval.',
  });

  return (
    <RadioGroup
      label="Finishing Tone"
      value={finish}
      onChange={setFinish}
      error={finish === 'custom' ? fieldErrors.finish : undefined}
    >
      <Radio value="chrome" label="Polished Chrome" hint="Standard reflective finish" />
      <Radio value="brushed-gold" label="Brushed Architectural Gold" hint="PVD coated brass" />
      <Radio value="matte-black" label="Matte Obsidian Black" />
    </RadioGroup>
  );
}
```

---

## 21. Switch

Accessible toggle switch with `role="switch"`, smooth translation, 44px touch target, and keyboard control (Space / Enter).

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `label` | `React.ReactNode` | `undefined` | Optional | Label text for the toggle. |
| `hint` | `React.ReactNode` | `undefined` | Optional | Explanatory hint text. |
| `error` | `string` | `undefined` | Optional | Validation error message. |
| `checked` | `boolean` | `undefined` | Optional | Controlled toggle state. |
| `defaultChecked` | `boolean` | `false` | Optional | Uncontrolled initial toggle state. |
| `onChange` | `(checked: boolean) => void` | `undefined` | Optional | Callback on toggle change. |
| `disabled` | `boolean` | `false` | Optional | Disables toggle interaction. |
| `name` | `string` | `undefined` | Optional | Form submission field name. |
| `value` | `string` | `'on'` | Optional | Form submission value. |
| `className` | `string` | `''` | Optional | Additional container classes. |

```tsx
import { useState } from 'react';
import { Switch } from '@flowtop/ui';

export function SwitchExample() {
  const [isPublished, setIsPublished] = useState(false);

  return (
    <Switch
      label="Publish to Online Store"
      hint="Immediately visible in public search and catalogue."
      checked={isPublished}
      onChange={setIsPublished}
    />
  );
}
```

---

## 22. Tooltip

Lightweight advisory tooltip that opens on hover and keyboard focus. Closes on Escape. Never holds essential information.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `content` | `React.ReactNode` | — | Required | Non-essential advisory tooltip text. |
| `position` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Optional | Tooltip positioning relative to trigger. |
| `delayMs` | `number` | `200` | Optional | Hover delay before tooltip shows (in ms). |
| `className` | `string` | `''` | Optional | Additional tooltip bubble classes. |
| `children` | `React.ReactElement` | — | Required | Single child element serving as the trigger. |

```tsx
import { Tooltip, Button } from '@flowtop/ui';

export function TooltipExample() {
  return (
    <Tooltip content="Permanent deletion cannot be undone.">
      <Button variant="danger">Archive</Button>
    </Tooltip>
  );
}
```

---

## 23. Pagination

Accessible pagination with real `getHref(page)` URLs ensuring full functionality without JavaScript, plus optional `onPageChange` handler for client-side interception.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `currentPage` | `number` | — | Required | Current active page number (1-indexed). |
| `totalPages` | `number` | — | Required | Total number of pages available. |
| `getHref` | `(page: number) => string` | — | Required | Function returning the href for each page URL (ensures no-JS SEO fallback). |
| `onPageChange` | `(page: number) => void` | `undefined` | Optional | Interactive handler to intercept clicks for client-side pagination. |
| `siblingCount` | `number` | `1` | Optional | Number of page siblings shown on each side of the active page. |
| `className` | `string` | `''` | Optional | Additional navigation container classes. |
| `aria-label` | `string` | `'Pagination'` | Optional | Accessible navigation label. |

```tsx
import { useState } from 'react';
import { Pagination } from '@flowtop/ui';

export function PaginationExample() {
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={12}
      getHref={(page) => `/catalogue?page=${page}`}
      onPageChange={(page) => setCurrentPage(page)}
    />
  );
}
```

---

## 24. Avatar

User or item avatar with automatic initials fallback when image is missing or fails to load.

### Props

| Prop | Type / Allowed Values | Default | Required / Optional | Description |
|---|---|---|---|---|
| `alt` | `string` | — | Required | Accessible image description and fallback source for initials. |
| `src` | `string` | `undefined` | Optional | Image source URL. If missing or fails to load, renders fallback initials. |
| `name` | `string` | `undefined` | Optional | Person or item name to derive initials from (defaults to `alt`). |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Optional | Avatar dimensions (`sm`: 24px, `md`: 44px, `lg`: 48px, `xl`: 64px). |
| `shape` | `'circle' \| 'square'` | `'circle'` | Optional | Border shape (`circle` pill or `square` rounded-md). |
| `className` | `string` | `''` | Optional | Additional container styling classes. |

```tsx
import { Avatar } from '@flowtop/ui';

export function AvatarExample() {
  return (
    <div className="flex items-center gap-space-3">
      <Avatar src="/team/arun.jpg" alt="Arun Kumar" size="md" />
      <Avatar alt="Vikram Malhotra" size="lg" shape="square" />
    </div>
  );
}
```

---

## What the preset replaces

`tailwind-preset.cjs` puts Flowtop token scales on `theme.extend`, so consumers keep Tailwind's default utilities (`w-56`, `z-10`, `font-mono`, the `sm` screen, and the rest). One scale is still replaced outright.

### `theme.colors`

The colour scale replaces Tailwind's default palette. `bg-red-500`, `text-slate-900`, `bg-black`, and the other default colour utilities are not generated. Every colour in the preset is a Flowtop token, and `colorToken()` still accepts opacity modifiers: `bg-ink/60` compiles to a `color-mix(in srgb, var(--color-ink) …)` rule.

### Keys on `theme.extend` that override a default

Same-named keys override the Tailwind value. The rest of that scale stays.

| Scale | Key | Tailwind default | Flowtop value |
|---|---|---|---|
| `screens` | `xl` | `1280px` | `1440px` (`--breakpoint-xl`) |
| `spacing` | `0` | `0px` | `var(--space-0)`, which is `0` |
| `spacing` | `px` | `1px` | `var(--space-px)`, which is `1px` |
| `borderRadius` | `sm` | `0.125rem` (2px) | `var(--radius-sm)`, `0.75rem` (12px) |
| `borderRadius` | `md` | `0.375rem` (6px) | `var(--radius-md)`, `1.5rem` (24px) |
| `borderRadius` | `lg` | `0.5rem` (8px) | `var(--radius-lg)`, `2.5rem` (40px) |
| `boxShadow` | `sm`, `md`, `lg` | black `rgb()` shadows | purple-tinted `--shadow-sm` / `--shadow-md` / `--shadow-lg` |
| `fontWeight` | `light`, `medium`, `semibold` | `300`, `500`, `600` | `var(--weight-light)` / `--weight-medium` / `--weight-semibold`, same numbers |

`screens.md` (`768px`) and `screens.lg` (`1024px`) match Tailwind. `sm` (`640px`) and `2xl` (`1536px`) are the defaults again. `screens.xs` (`360px`) is added.

Spacing tokens are named `space-1` … `space-8`, not `1` … `8`. They do not override Tailwind's numeric steps. In particular `space-5` is `1.5rem` (24px) while Tailwind's `5` is `1.25rem` (20px), `space-6` is `2rem` (32px) while Tailwind's `6` is `1.5rem` (24px), and `space-8` is `4rem` (64px) while Tailwind's `8` is `2rem` (32px). `p-space-6` and `w-6` are different utilities. `0` and `px` are the only spacing keys that override a default, and their computed sizes match.
