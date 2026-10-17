import fs from 'node:fs';
import path from 'node:path';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { COMPONENT_REGISTRY } from './registry';
import { ComponentShowcase } from './ComponentShowcase';

export const metadata: Metadata = {
  title: 'Flowtop Style Guide & Design Tokens',
  description: 'Design system tokens and complete component showcase for Flowtop.',
  robots: {
    index: false,
    follow: false,
  },
};

interface TokenItem {
  name: string;
  value: string;
  comment?: string;
}

function loadTokensCss(): string {
  const candidatePaths = [
    path.resolve(process.cwd(), '../packages/ui/src/tokens.css'),
    path.resolve(process.cwd(), 'packages/ui/src/tokens.css'),
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return fs.readFileSync(p, 'utf8');
    }
  }
  throw new Error('Unable to locate packages/ui/src/tokens.css');
}

export default function StyleGuidePage() {
  // Hide in production unless STYLE_GUIDE=on
  if (process.env.NODE_ENV === 'production' && process.env.STYLE_GUIDE !== 'on') {
    notFound();
  }

  const cssContent = loadTokensCss();

  // Extract all CSS custom properties
  const tokenRegex = /--([a-z0-9-]+):\s*([^;]+);/g;
  const allTokens: Record<string, string> = {};
  let match: RegExpExecArray | null;
  while ((match = tokenRegex.exec(cssContent)) !== null) {
    const key = match[1];
    const val = match[2];
    if (key && val) {
      allTokens[key] = val.trim();
    }
  }

  // Filter token groups
  const brandColors: TokenItem[] = [
    'color-purple-deep',
    'color-purple-light',
    'color-purple-pale',
    'color-ink',
    'color-white',
  ]
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  const greyColors: TokenItem[] = Object.keys(allTokens)
    .filter((k) => k.startsWith('color-grey-'))
    .sort((a, b) => {
      const na = parseInt(a.replace('color-grey-', ''), 10);
      const nb = parseInt(b.replace('color-grey-', ''), 10);
      return na - nb;
    })
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  const semanticColors: TokenItem[] = [
    'color-success',
    'color-success-tint',
    'color-warning',
    'color-warning-tint',
    'color-error',
    'color-error-tint',
    'color-info',
    'color-info-tint',
  ]
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  const roleColors: TokenItem[] = [
    'primary',
    'primary-dark',
    'primary-tint',
    'accent',
    'on-primary',
    'surface',
    'surface-solid',
    'surface-glass',
    'surface-light',
    'surface-inverse',
    'on-surface-inverse',
    'text-primary',
    'text-muted',
    'border',
    'border-strong',
    'border-input',
    'focus-ring',
  ]
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  // Spacing tokens
  const spacingKeys = [
    'space-0',
    'space-px',
    'space-1',
    'space-2',
    'space-3',
    'space-4',
    'space-5',
    'space-6',
    'space-7',
    'space-8',
    'size-touch',
  ];
  const spacingTokens: TokenItem[] = spacingKeys
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  // Radii
  const radiiKeys = ['radius-none', 'radius-sm', 'radius-md', 'radius-lg', 'radius-pill'];
  const radiiTokens: TokenItem[] = radiiKeys
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  // Shadows
  const shadowKeys = ['shadow-sm', 'shadow-md', 'shadow-lg'];
  const shadowTokens: TokenItem[] = shadowKeys
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  // Motion
  const motionKeys = [
    'duration-fast',
    'duration-base',
    'duration-slow',
    'ease-standard',
    'ease-emphasized',
  ];
  const motionTokens: TokenItem[] = motionKeys
    .filter((k) => allTokens[k])
    .map((k) => ({ name: k, value: allTokens[k] || '' }));

  // Type scale
  const typeLevels = [
    {
      level: 'display',
      class: 'text-display font-display font-light',
      label: 'Display',
      sample: 'Flowtop Luxury',
    },
    {
      level: 'headline',
      class: 'text-headline font-display font-medium',
      label: 'Headline',
      sample: 'Architectural Bath Fittings',
    },
    {
      level: 'title',
      class: 'text-title font-display font-semibold',
      label: 'Title',
      sample: 'Brushed Gold Basin Mixers',
    },
    {
      level: 'body',
      class: 'text-body font-body font-regular',
      label: 'Body',
      sample: 'Crafted from pure architectural lead-free brass with enduring precision.',
    },
    {
      level: 'small',
      class: 'text-small font-body font-regular',
      label: 'Small',
      sample: 'Aerator rate: 6.2 L/min at 3.0 bar pressure. Lead-free certified.',
    },
    {
      level: 'caption',
      class: 'text-caption font-body font-regular text-text-muted',
      label: 'Caption',
      sample: 'SKU: FLW-BSN-101 | 10-Year Body Warranty',
    },
  ];

  return (
    <div className="min-h-screen bg-surface text-primary antialiased py-space-6 px-space-4 md:px-space-8 max-w-full overflow-x-hidden">
      <div className="max-w-7xl mx-auto flex flex-col gap-space-8">
        {/* Header */}
        <header className="flex flex-col gap-space-2 border-b border-border pb-space-6">
          <div className="flex flex-wrap items-center justify-between gap-space-4">
            <div>
              <span className="text-caption font-semibold tracking-tight text-primary uppercase">
                Design System & Component Kit
              </span>
              <h1 className="text-headline font-display font-semibold text-text-primary tracking-tight">
                Flowtop Style Guide
              </h1>
            </div>
            <div className="px-space-3 py-space-1 rounded-pill bg-purple-pale text-purple-deep text-caption font-semibold">
              Live from tokens.css
            </div>
          </div>
          <p className="text-body text-text-muted max-w-2xl">
            Single source of truth for Flowtop design tokens, scales, and shared components. All
            token values are extracted directly from <code className="text-small">tokens.css</code> at
            runtime, ensuring they never go stale.
          </p>
        </header>

        {/* Component Registry Summary Table */}
        <section className="flex flex-col gap-space-4 bg-surface-solid p-space-6 rounded-md border border-border shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-space-2">
            <div>
              <h2 className="text-title font-semibold text-text-primary">Component Registry</h2>
              <p className="text-caption text-text-muted">
                {COMPONENT_REGISTRY.length} exported components verified by <code className="text-caption">scripts/check.mjs</code>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-space-2">
            {COMPONENT_REGISTRY.map((comp) => (
              <a
                key={comp.id}
                href={`#demo-${comp.id}`}
                className="p-space-2 rounded-sm border border-border bg-surface hover:bg-purple-pale hover:border-primary transition-colors duration-fast flex flex-col gap-px focus-ring"
              >
                <span className="text-small font-semibold text-text-primary">{comp.name}</span>
                <span className="text-caption text-text-muted">{comp.category}</span>
              </a>
            ))}
          </div>
        </section>

        {/* 1. Colour Tokens */}
        <section className="flex flex-col gap-space-6">
          <div>
            <h2 className="text-headline font-display font-semibold text-text-primary">1. Colour Tokens</h2>
            <p className="text-small text-text-muted">
              Curated purple, ink, and tinted neutral palettes meeting WCAG AA contrast standards.
            </p>
          </div>

          {/* Brand Palette */}
          <div className="flex flex-col gap-space-3">
            <h3 className="text-title font-medium text-text-primary">Brand Palette</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-space-3">
              {brandColors.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col rounded-sm border border-border bg-surface-solid overflow-hidden shadow-sm"
                >
                  <div
                    className="h-space-7 w-full border-b border-border"
                    style={{ backgroundColor: `var(--${t.name})` }}
                  />
                  <div className="p-space-2 flex flex-col">
                    <span className="text-small font-semibold text-text-primary truncate">--{t.name}</span>
                    <span className="text-caption text-text-muted font-mono">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Functional Roles */}
          <div className="flex flex-col gap-space-3">
            <h3 className="text-title font-medium text-text-primary">Semantic & Functional Roles</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-space-3">
              {roleColors.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-space-3 p-space-2 rounded-sm border border-border bg-surface-solid shadow-sm"
                >
                  <div
                    className="w-space-6 h-space-6 rounded-sm border border-border shrink-0"
                    style={{ backgroundColor: `var(--${t.name})` }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-small font-semibold text-text-primary truncate">--{t.name}</span>
                    <span className="text-caption text-text-muted font-mono truncate">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Grey Scale */}
          <div className="flex flex-col gap-space-3">
            <h3 className="text-title font-medium text-text-primary">Purple-Tinted Grey Scale</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-space-2">
              {greyColors.map((t) => (
                <div
                  key={t.name}
                  className="flex flex-col rounded-sm border border-border bg-surface-solid overflow-hidden shadow-sm"
                >
                  <div
                    className="h-space-5 w-full border-b border-border"
                    style={{ backgroundColor: `var(--${t.name})` }}
                  />
                  <div className="p-space-1 flex flex-col">
                    <span className="text-caption font-medium text-text-primary truncate">
                      {t.name.replace('color-', '')}
                    </span>
                    <span className="text-caption text-text-muted font-mono truncate">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Semantic Status */}
          <div className="flex flex-col gap-space-3">
            <h3 className="text-title font-medium text-text-primary">Semantic States & Tints</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-space-3">
              {semanticColors.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center gap-space-3 p-space-2 rounded-sm border border-border bg-surface-solid shadow-sm"
                >
                  <div
                    className="w-space-6 h-space-6 rounded-sm border border-border shrink-0"
                    style={{ backgroundColor: `var(--${t.name})` }}
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-small font-semibold text-text-primary truncate">--{t.name}</span>
                    <span className="text-caption text-text-muted font-mono truncate">{t.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 2. Type Scale */}
        <section className="flex flex-col gap-space-6 border-t border-border pt-space-8">
          <div>
            <h2 className="text-headline font-display font-semibold text-text-primary">2. Typography Scale</h2>
            <p className="text-small text-text-muted">
              Fluid typography scaling smoothly from 360px to 1440px viewport widths with clamp().
            </p>
          </div>

          <div className="flex flex-col divide-y divide-border bg-surface-solid rounded-md border border-border p-space-6">
            {typeLevels.map((lvl) => {
              const sizeVal = allTokens[`text-${lvl.level}-size`] || '';
              const leadingVal = allTokens[`text-${lvl.level}-leading`] || '';
              return (
                <div key={lvl.level} className="py-space-4 first:pt-0 last:pb-0 flex flex-col gap-space-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-space-2">
                    <div className="flex items-center gap-space-2">
                      <span className="text-small font-semibold text-primary">{lvl.label}</span>
                      <code className="text-caption text-text-muted">--text-{lvl.level}-size: {sizeVal}</code>
                    </div>
                    <span className="text-caption text-text-muted font-mono">leading: {leadingVal}</span>
                  </div>
                  <div className={lvl.class}>{lvl.sample}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Spacing Scale as Bars */}
        <section className="flex flex-col gap-space-6 border-t border-border pt-space-8">
          <div>
            <h2 className="text-headline font-display font-semibold text-text-primary">3. Spacing Scale</h2>
            <p className="text-small text-text-muted">
              4px incremental base scale plus 44px minimum interactive touch target. Shown as proportional bars.
            </p>
          </div>

          <div className="flex flex-col gap-space-3 bg-surface-solid p-space-6 rounded-md border border-border">
            {spacingTokens.map((sp) => (
              <div key={sp.name} className="flex flex-col gap-space-1">
                <div className="flex justify-between items-center text-caption text-text-muted">
                  <code className="font-semibold text-text-primary">--{sp.name}</code>
                  <span className="font-mono">{sp.value}</span>
                </div>
                <div className="w-full bg-surface rounded-sm h-space-4 overflow-hidden border border-border flex items-center">
                  <div
                    className="h-full bg-primary transition-all duration-fast"
                    style={{ width: `var(--${sp.name})` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Radii, Shadows and Motion */}
        <section className="flex flex-col gap-space-6 border-t border-border pt-space-8">
          <div>
            <h2 className="text-headline font-display font-semibold text-text-primary">
              4. Radii, Shadows & Motion
            </h2>
            <p className="text-small text-text-muted">
              Token curves for rounded surfaces, tinted elevation shadows, and duration timings.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-6">
            {/* Radii */}
            <div className="flex flex-col gap-space-3 bg-surface-solid p-space-6 rounded-md border border-border">
              <h3 className="text-title font-medium text-text-primary">Border Radii</h3>
              <div className="flex flex-col gap-space-3">
                {radiiTokens.map((r) => (
                  <div key={r.name} className="flex items-center gap-space-3">
                    <div
                      className="w-space-6 h-space-6 bg-purple-pale border-2 border-primary shrink-0"
                      style={{ borderRadius: `var(--${r.name})` }}
                    />
                    <div className="flex flex-col">
                      <span className="text-small font-semibold text-text-primary">--{r.name}</span>
                      <span className="text-caption text-text-muted font-mono">{r.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div className="flex flex-col gap-space-3 bg-surface-solid p-space-6 rounded-md border border-border">
              <h3 className="text-title font-medium text-text-primary">Tinted Shadows</h3>
              <div className="flex flex-col gap-space-4">
                {shadowTokens.map((s) => (
                  <div
                    key={s.name}
                    className="p-space-3 rounded-sm bg-surface border border-border flex flex-col"
                    style={{ boxShadow: `var(--${s.name})` }}
                  >
                    <span className="text-small font-semibold text-text-primary">--{s.name}</span>
                    <span className="text-caption text-text-muted font-mono truncate">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Motion */}
            <div className="flex flex-col gap-space-3 bg-surface-solid p-space-6 rounded-md border border-border">
              <h3 className="text-title font-medium text-text-primary">Motion & Timing</h3>
              <div className="flex flex-col gap-space-3">
                {motionTokens.map((m) => (
                  <div key={m.name} className="flex flex-col p-space-2 rounded-sm bg-surface border border-border">
                    <span className="text-small font-semibold text-text-primary">--{m.name}</span>
                    <span className="text-caption text-text-muted font-mono truncate">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 5. Complete Component Showcase */}
        <section className="flex flex-col gap-space-6 border-t border-border pt-space-8">
          <div>
            <h2 className="text-headline font-display font-semibold text-text-primary">
              5. Interactive Component Showcase
            </h2>
            <p className="text-small text-text-muted">
              Every exported component, variant, and interactive state. Clickable and testable live.
            </p>
          </div>

          <ComponentShowcase />
        </section>
      </div>
    </div>
  );
}
