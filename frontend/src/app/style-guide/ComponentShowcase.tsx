'use client';

import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  Modal,
  Table,
  Badge,
  Tabs,
  Spinner,
  Drawer,
  Breadcrumbs,
  Menu,
  MenuItem,
  MenuDivider,
  Textarea,
  Checkbox,
  EmptyState,
  Skeleton,
  ProgressBar,
  Radio,
  RadioGroup,
  Switch,
  Tooltip,
  Pagination,
  Avatar,
  Field,
  useToast,
  ToastProvider,
} from '@flowtop/ui';

export function ComponentShowcase() {
  return (
    <ToastProvider>
      <ShowcaseContent />
    </ToastProvider>
  );
}

function ShowcaseContent() {
  const toast = useToast();

  // Interactive component states
  const [btnLoading, setBtnLoading] = useState(false);
  const [inputText, setInputText] = useState('Opel Tall Basin Mixer');
  const [inputError, setInputError] = useState('');
  const [selectVal, setSelectVal] = useState('brass');
  const [textareaVal, setTextareaVal] = useState(
    'Precision forged from architectural lead-free brass with a brushed PVD finish.'
  );

  // Checkbox states
  const [check1, setCheck1] = useState(true);
  const [check2, setCheck2] = useState(false);
  const [triState, setTriState] = useState<'checked' | 'unchecked' | 'indeterminate'>('indeterminate');

  // Radio & Switch
  const [radioVal, setRadioVal] = useState('gold');
  const [switchVal, setSwitchVal] = useState(true);

  // Modal & Drawer
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalBusy, setModalBusy] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerSide, setDrawerSide] = useState<'left' | 'right' | 'bottom'>('right');

  // ProgressBar & Pagination
  const [progressVal, setProgressVal] = useState(65);
  const [currentPage, setCurrentPage] = useState(2);

  return (
    <div className="flex flex-col gap-space-8 max-w-full">
      {/* 1. Button */}
      <section id="demo-button" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">1. Button</h3>
          <p className="text-caption text-text-muted">
            Variants (primary, secondary, ghost, danger), sizes (sm, md, lg), loading and disabled states, and icon-only.
          </p>
        </div>

        <div className="flex flex-col gap-space-4">
          <div className="flex flex-wrap items-center gap-space-3">
            <Button
              variant="primary"
              onClick={() => {
                setBtnLoading(true);
                setTimeout(() => setBtnLoading(false), 2000);
              }}
              loading={btnLoading}
            >
              {btnLoading ? 'Processing...' : 'Primary (Click for Loading)'}
            </Button>
            <Button variant="secondary" onClick={() => toast.info('Secondary button clicked')}>
              Secondary
            </Button>
            <Button variant="ghost" onClick={() => toast.info('Ghost button clicked')}>
              Ghost
            </Button>
            <Button variant="danger" onClick={() => toast.error('Danger button action triggered')}>
              Danger
            </Button>
            <Button variant="primary" disabled>
              Disabled
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-space-3">
            <Button variant="secondary" size="sm">
              Small (sm)
            </Button>
            <Button variant="secondary" size="md">
              Medium (md)
            </Button>
            <Button variant="secondary" size="lg">
              Large (lg)
            </Button>
            <Button
              variant="ghost"
              iconOnly
              aria-label="Add to favourites"
              onClick={() => toast.success('Added to collection')}
            >
              <span aria-hidden="true">★</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 2. Input */}
      <section id="demo-input" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">2. Input</h3>
          <p className="text-caption text-text-muted">
            Text, email, search, and password (with toggle) with integrated Field validation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
          <Input
            label="Product Title"
            hint="Displayed on the public product detail page."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            required
          />

          <Input
            type="search"
            label="Catalogue Search"
            placeholder="Search by SKU, series or keyword..."
          />

          <Input
            type="password"
            label="Admin Password"
            hint="Click the eye icon to toggle visibility."
            defaultValue="FlowTopSecret#2026"
          />

          <div className="flex flex-col gap-space-2">
            <Input
              label="Validation State Demo"
              value={inputText}
              onChange={(e) => {
                setInputText(e.target.value);
                if (e.target.value.length < 5) {
                  setInputError('Title must be at least 5 characters.');
                } else {
                  setInputError('');
                }
              }}
              error={inputError || undefined}
            />
            <div className="flex gap-space-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setInputError('SKU already exists in catalogue.')}
              >
                Trigger Error
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInputError('')}>
                Clear Error
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Select */}
      <section id="demo-select" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">3. Select</h3>
          <p className="text-caption text-text-muted">
            Styled native select with 44px minimum touch target and accessible focus rings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
          <Select
            label="Material & Alloy"
            value={selectVal}
            onChange={(e) => setSelectVal(e.target.value)}
            hint="Base structural metal composition."
            options={[
              { label: 'Forged Lead-Free Brass', value: 'brass' },
              { label: '316 Marine-Grade Stainless Steel', value: 'steel' },
              { label: 'Die-Cast Solid Bronze', value: 'bronze' },
            ]}
          />
          <Select
            label="Disabled Select"
            disabled
            options={[{ label: 'Locked Regional Warehouse', value: 'locked' }]}
          />
        </div>
      </section>

      {/* 4. Textarea */}
      <section id="demo-textarea" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">4. Textarea</h3>
          <p className="text-caption text-text-muted">
            Multi-line input with optional live character counter and Field integration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
          <Textarea
            label="Collection Narrative"
            value={textareaVal}
            onChange={(e) => setTextareaVal(e.target.value)}
            maxLength={180}
            showCount
            hint="Brief architectural description for luxury brochures."
          />
          <Textarea
            label="Disabled Textarea"
            disabled
            value="Archived engineering specifications (read-only)."
          />
        </div>
      </section>

      {/* 5. Checkbox */}
      <section id="demo-checkbox" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">5. Checkbox</h3>
          <p className="text-caption text-text-muted">
            Standard, indeterminate, and error states with 44px touch targets.
          </p>
        </div>

        <div className="flex flex-col gap-space-3">
          <Checkbox
            label="Enable PVD Anti-Corrosion Coating"
            hint="Enhances durability against hard groundwater."
            checked={check1}
            onChange={(e) => setCheck1(e.target.checked)}
          />

          <Checkbox
            label="Notify Project Architect on Dispatch"
            checked={check2}
            onChange={(e) => setCheck2(e.target.checked)}
          />

          <div className="flex items-center gap-space-3">
            <Checkbox
              label={`Batch Selection (${triState})`}
              checked={triState === 'checked'}
              indeterminate={triState === 'indeterminate'}
              onChange={() => {
                if (triState === 'indeterminate') setTriState('checked');
                else if (triState === 'checked') setTriState('unchecked');
                else setTriState('indeterminate');
              }}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (triState === 'indeterminate') setTriState('checked');
                else if (triState === 'checked') setTriState('unchecked');
                else setTriState('indeterminate');
              }}
            >
              Cycle Tri-State
            </Button>
          </div>

          <Checkbox label="Disabled option" disabled checked />
        </div>
      </section>

      {/* 6. Radio & RadioGroup */}
      <section id="demo-radio" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">6. Radio & RadioGroup</h3>
          <p className="text-caption text-text-muted">
            WAI-ARIA radiogroup with custom purple ring indicator and keyboard arrow navigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
          <RadioGroup
            label="Finishing Tone"
            hint="Select primary surface coating"
            value={radioVal}
            onChange={setRadioVal}
          >
            <Radio value="gold" label="Brushed Architectural Gold" hint="Physical Vapour Deposition" />
            <Radio value="chrome" label="Mirror Polished Chrome" hint="Multi-layer electroplated" />
            <Radio value="matte" label="Matte Obsidian Black" hint="Powder-coated dual bake" />
          </RadioGroup>

          <RadioGroup
            label="Placement Arrangement"
            orientation="horizontal"
            defaultValue="grid"
          >
            <Radio value="grid" label="Grid View" />
            <Radio value="carousel" label="Carousel" />
            <Radio value="hero" label="Hero Focus" disabled />
          </RadioGroup>
        </div>
      </section>

      {/* 7. Switch */}
      <section id="demo-switch" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">7. Switch</h3>
          <p className="text-caption text-text-muted">
            Toggle switch with <code>role=&quot;switch&quot;</code>, smooth animation, and 44px touch targets.
          </p>
        </div>

        <div className="flex flex-col gap-space-3">
          <Switch
            label="Live on Public Website"
            hint="When enabled, products appear in searches and collections."
            checked={switchVal}
            onChange={setSwitchVal}
          />
          <Switch label="Restricted to Trade Partners" defaultChecked={false} />
          <Switch label="Maintenance Mode (Disabled)" disabled checked />
        </div>
      </section>

      {/* 8. Card */}
      <section id="demo-card" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">8. Card</h3>
          <p className="text-caption text-text-muted">
            Surface containers in flat, raised, and inset variants with composable slots.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4">
          <Card variant="flat">
            <Card.Header>
              <Card.Title>Flat Variant</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-small text-text-muted">
                Clean 1px border with no elevation. Ideal for structured lists and grouped forms.
              </p>
            </Card.Body>
          </Card>

          <Card variant="raised">
            <Card.Header>
              <Card.Title>Raised Variant</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-small text-text-muted">
                Tinted purple shadow with gentle elevation. Used for hero items and active panels.
              </p>
            </Card.Body>
            <Card.Footer>
              <Button variant="secondary" size="sm">
                Inspect
              </Button>
            </Card.Footer>
          </Card>

          <Card variant="inset">
            <Card.Header>
              <Card.Title>Inset Variant</Card.Title>
            </Card.Header>
            <Card.Body>
              <p className="text-small text-text-muted">
                Recessed surface with subtle border. Ideal for code previews and technical specs.
              </p>
            </Card.Body>
          </Card>
        </div>
      </section>

      {/* 9. Modal & Drawer */}
      <section id="demo-modal-drawer" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">9. Modal & Drawer</h3>
          <p className="text-caption text-text-muted">
            Native &lt;dialog&gt; implementations with backdrop, focus trapping, Escape handling, and scroll lock.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Modal Dialog
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawerSide('right');
              setDrawerOpen(true);
            }}
          >
            Open Right Drawer
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawerSide('left');
              setDrawerOpen(true);
            }}
          >
            Open Left Drawer
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              setDrawerSide('bottom');
              setDrawerOpen(true);
            }}
          >
            Open Bottom Drawer
          </Button>
        </div>

        {/* Modal instance */}
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Catalogue Placement Inspector"
          busy={modalBusy}
        >
          <div className="flex flex-col gap-space-4">
            <p className="text-small text-text-primary">
              This modal reuses native HTML5 dialog primitives. Try pressing Escape to close it, or click the backdrop.
            </p>
            <div className="flex items-center gap-space-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setModalBusy(!modalBusy)}
              >
                {modalBusy ? 'Disable Busy Mode' : 'Enable Busy Mode (Locks Escape)'}
              </Button>
            </div>
            <div className="flex justify-end gap-space-2 pt-space-2 border-t border-border">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  toast.success('Changes applied.');
                  setIsModalOpen(false);
                }}
              >
                Apply Changes
              </Button>
            </div>
          </div>
        </Modal>

        {/* Drawer instance */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={`Drawer Sheet (${drawerSide})`}
          position={drawerSide}
        >
          <div className="flex flex-col gap-space-4">
            <p className="text-small text-text-primary">
              Slide-in dialog panel supporting left, right, and bottom directions. Fully accessible and scroll locked.
            </p>
            <Button variant="primary" onClick={() => setDrawerOpen(false)}>
              Close Drawer
            </Button>
          </div>
        </Drawer>
      </section>

      {/* 10. Menu */}
      <section id="demo-menu" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">10. Menu</h3>
          <p className="text-caption text-text-muted">
            Dropdown menu with Arrow keys (Up/Down/Home/End), Enter/Space, and Escape support.
          </p>
        </div>

        <div className="flex items-center gap-space-4">
          <Menu trigger={<Button variant="secondary">Placement Options</Button>}>
            <MenuItem onClick={() => toast.info('Reorder triggered')}>Reorder Position</MenuItem>
            <MenuItem onClick={() => toast.info('Duplicate triggered')}>Duplicate Item</MenuItem>
            <MenuDivider />
            <MenuItem destructive onClick={() => toast.error('Removed from section')}>
              Remove from Section
            </MenuItem>
          </Menu>
        </div>
      </section>

      {/* 11. Breadcrumbs */}
      <section id="demo-breadcrumbs" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">11. Breadcrumbs</h3>
          <p className="text-caption text-text-muted">
            Semantic <code>&lt;nav aria-label=&quot;Breadcrumb&quot;&gt;</code> with <code>aria-current=&quot;page&quot;</code> on the active item.
          </p>
        </div>

        <div className="bg-surface p-space-4 rounded-sm border border-border">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '#' },
              { label: 'Architectural Brassware', href: '#' },
              { label: 'Basin Mixers', href: '#' },
              { label: 'Aura High-Neck Mixer' },
            ]}
          />
        </div>
      </section>

      {/* 12. Table */}
      <section id="demo-table" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">12. Table</h3>
          <p className="text-caption text-text-muted">
            Data table with responsive horizontal overflow and numeric right alignment.
          </p>
        </div>

        <div className="overflow-x-auto max-w-full">
          <Table<{ sku: string; series: string; finish: string; inventory: string; status: 'In Stock' | 'Low Stock' }>
            columns={[
              { id: 'sku', header: 'Product SKU', accessor: (row) => row.sku },
              { id: 'series', header: 'Series', accessor: (row) => row.series },
              { id: 'finish', header: 'Finish', accessor: (row) => row.finish },
              { id: 'inventory', header: 'Inventory', align: 'right', accessor: (row) => row.inventory },
              {
                id: 'status',
                header: 'Status',
                align: 'right',
                accessor: (row) => (
                  <Badge variant={row.status === 'In Stock' ? 'success' : 'warning'}>
                    {row.status}
                  </Badge>
                ),
              },
            ]}
            data={[
              {
                sku: 'FLW-BSN-101',
                series: 'Aura Series',
                finish: 'Brushed Gold',
                inventory: '42 units',
                status: 'In Stock',
              },
              {
                sku: 'FLW-SHW-204',
                series: 'Cascade Overhead',
                finish: 'Obsidian Black',
                inventory: '6 units',
                status: 'Low Stock',
              },
            ]}
            rowKey={(row) => row.sku}
          />
        </div>
      </section>

      {/* 13. Toast */}
      <section id="demo-toast" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">13. Toast</h3>
          <p className="text-caption text-text-muted">
            Accessible live notifications with promise tracking and real error messages.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-3">
          <Button variant="secondary" onClick={() => toast.info('New collection drafted.')}>
            Info Toast
          </Button>
          <Button variant="secondary" onClick={() => toast.success('Specifications saved.')}>
            Success Toast
          </Button>
          <Button variant="secondary" onClick={() => toast.warning('Low stock notification.')}>
            Warning Toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error('Server connection timed out.')}>
            Error Toast
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              const fakePromise = new Promise((resolve) => setTimeout(resolve, 1500));
              toast.promise(fakePromise, {
                loading: 'Synchronizing with ERP database...',
                success: 'ERP sync complete.',
                error: 'Failed to sync with ERP.',
              });
            }}
          >
            Promise Toast (Async)
          </Button>
        </div>
      </section>

      {/* 14. Badge */}
      <section id="demo-badge" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">14. Badge</h3>
          <p className="text-caption text-text-muted">
            Status pills requiring readable text content for accessibility.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-2">
          <Badge variant="neutral">Draft</Badge>
          <Badge variant="primary">Architectural</Badge>
          <Badge variant="success">Published</Badge>
          <Badge variant="warning">Pending Review</Badge>
          <Badge variant="error">Discontinued</Badge>
          <Badge variant="info">Special Order</Badge>
        </div>
      </section>

      {/* 15. Tabs */}
      <section id="demo-tabs" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">15. Tabs</h3>
          <p className="text-caption text-text-muted">
            WAI-ARIA tablist with Arrow keys (Left/Right) and scrollable mobile tabstrip.
          </p>
        </div>

        <Tabs
          defaultValue="specs"
          items={[
            {
              id: 'specs',
              label: 'Technical Specifications',
              content: (
                <div className="p-space-4 bg-surface rounded-sm border border-border text-small text-text-muted">
                  Aerator: Neoperl Honeycomb | Flow Rate: 6.2 L/min at 3.0 bar pressure.
                </div>
              ),
            },
            {
              id: 'finish',
              label: 'Finish & Care',
              content: (
                <div className="p-space-4 bg-surface rounded-sm border border-border text-small text-text-muted">
                  Clean with mild warm soapy water and microfiber cloth. Avoid abrasive detergents.
                </div>
              ),
            },
            {
              id: 'warranty',
              label: 'Warranty Terms',
              content: (
                <div className="p-space-4 bg-surface rounded-sm border border-border text-small text-text-muted">
                  10-year comprehensive warranty on brass body and cartridge integrity.
                </div>
              ),
            },
          ]}
        />
      </section>

      {/* 16. Spinner & Skeleton */}
      <section id="demo-feedback" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">16. Spinner & Skeleton</h3>
          <p className="text-caption text-text-muted">
            Calm loading animations that respect prefers-reduced-motion.
          </p>
        </div>

        <div className="flex flex-col gap-space-4">
          <div className="flex items-center gap-space-6">
            <div className="flex items-center gap-space-2">
              <Spinner size="sm" label="Loading small" />
              <span className="text-caption text-text-muted">Small (sm)</span>
            </div>
            <div className="flex items-center gap-space-2">
              <Spinner size="md" label="Loading medium" />
              <span className="text-caption text-text-muted">Medium (md)</span>
            </div>
            <div className="flex items-center gap-space-2">
              <Spinner size="lg" label="Loading large" />
              <span className="text-caption text-text-muted">Large (lg)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4 p-space-4 bg-surface rounded-sm border border-border">
            <div className="flex items-center gap-space-3">
              <Skeleton variant="circular" className="w-touch h-touch shrink-0" />
              <div className="flex flex-col gap-space-2 w-full">
                <Skeleton variant="text" className="w-3/4" />
                <Skeleton variant="text" className="w-1/2" />
              </div>
            </div>
            <Skeleton variant="rectangular" className="h-space-6 w-full rounded-sm" />
          </div>
        </div>
      </section>

      {/* 17. ProgressBar */}
      <section id="demo-progressbar" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">17. ProgressBar</h3>
          <p className="text-caption text-text-muted">
            Determinate and indeterminate progress indicators following WAI-ARIA standards.
          </p>
        </div>

        <div className="flex flex-col gap-space-4 max-w-xl">
          <ProgressBar
            value={progressVal}
            max={100}
            label="Catalog Asset Compression"
            showValue
          />
          <div className="flex gap-space-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProgressVal(Math.max(0, progressVal - 15))}
            >
              -15%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProgressVal(Math.min(100, progressVal + 15))}
            >
              +15%
            </Button>
          </div>

          <ProgressBar label="Optimizing 4K media renders (Indeterminate)..." />
        </div>
      </section>


      {/* 18. Tooltip */}
      <section id="demo-tooltip" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">18. Tooltip</h3>
          <p className="text-caption text-text-muted">
            Advisory tooltip shown on hover and keyboard focus. Dismissible with Escape.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-4 pt-space-4">
          <Tooltip content="Tooltip positioned on top" position="top">
            <Button variant="secondary" size="sm">
              Hover Top
            </Button>
          </Tooltip>
          <Tooltip content="Tooltip positioned on bottom" position="bottom">
            <Button variant="secondary" size="sm">
              Hover Bottom
            </Button>
          </Tooltip>
          <Tooltip content="Tooltip positioned on left" position="left">
            <Button variant="secondary" size="sm">
              Hover Left
            </Button>
          </Tooltip>
          <Tooltip content="Tooltip positioned on right" position="right">
            <Button variant="secondary" size="sm">
              Hover Right
            </Button>
          </Tooltip>
        </div>
      </section>

      {/* 19. Pagination */}
      <section id="demo-pagination" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">19. Pagination</h3>
          <p className="text-caption text-text-muted">
            Real links through getHref(page) for zero-JS fallback, plus interactive onPageChange.
          </p>
        </div>

        <div className="flex flex-col items-center gap-space-3 p-space-4 bg-surface rounded-sm border border-border">
          <Pagination
            currentPage={currentPage}
            totalPages={8}
            getHref={(p) => `?page=${p}`}
            onPageChange={(p) => setCurrentPage(p)}
          />
          <span className="text-caption text-text-muted">
            Current active page: {currentPage} of 8
          </span>
        </div>
      </section>

      {/* 20. Avatar */}
      <section id="demo-avatar" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">20. Avatar</h3>
          <p className="text-caption text-text-muted">
            User/item avatars with sizes (sm, md, lg, xl), shapes (circle, square), and initials fallback.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-4">
          <div className="flex items-center gap-space-2">
            <Avatar name="Arun Kumar" alt="Arun Kumar" size="sm" />
            <span className="text-caption text-text-muted">sm (AK)</span>
          </div>
          <div className="flex items-center gap-space-2">
            <Avatar name="Vikram Malhotra" alt="Vikram Malhotra" size="md" />
            <span className="text-caption text-text-muted">md (VM)</span>
          </div>
          <div className="flex items-center gap-space-2">
            <Avatar name="Pooja Sharma" alt="Pooja Sharma" size="lg" />
            <span className="text-caption text-text-muted">lg (PS)</span>
          </div>
          <div className="flex items-center gap-space-2">
            <Avatar name="Flowtop Design" alt="Flowtop Design" size="xl" />
            <span className="text-caption text-text-muted">xl (FD)</span>
          </div>
          <div className="flex items-center gap-space-2">
            <Avatar name="Square Shape" alt="Square Shape" size="md" shape="square" />
            <span className="text-caption text-text-muted">square</span>
          </div>
        </div>
      </section>

      {/* 21. EmptyState */}
      <section id="demo-emptystate" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">21. EmptyState</h3>
          <p className="text-caption text-text-muted">
            Actionable view guiding next steps instead of a dead end.
          </p>
        </div>

        <div className="border border-dashed border-border rounded-md">
          <EmptyState
            title="No Placements Configured"
            description="Add featured collections or products to display on this page hero grid."
            action={
              <Button variant="primary" onClick={() => toast.info('New placement action clicked')}>
                Add First Placement
              </Button>
            }
          />
        </div>
      </section>

      {/* 22. Field */}
      <section id="demo-field" className="flex flex-col gap-space-4">
        <div className="border-b border-border pb-space-2">
          <h3 className="text-title font-semibold text-text-primary">22. Field</h3>
          <p className="text-caption text-text-muted">
            Shared form control wrapper with visible label, required asterisk, hint, and accessible error message.
          </p>
        </div>

        <div className="max-w-md">
          <Field
            label="Wholesale Tax Identification"
            hint="Format: 15-digit GSTIN (e.g. 27AAAAA0000A1Z5)"
            required
            error="Invalid GSTIN checksum for Maharashtra state."
          >
            <input
              type="text"
              defaultValue="27AAAAA0000A1Z0"
              className="w-full h-touch px-space-3 rounded-sm border border-error bg-surface-solid text-body focus-ring"
            />
          </Field>
        </div>
      </section>
    </div>
  );
}
