import React from 'react';
import Link from 'next/link';
import { Button, Card, Badge } from '@flowtop/ui';

export default function HomePage() {
  const featuredCollections = [
    {
      id: 'aura',
      name: 'Aura Series',
      badge: 'Signature',
      description: 'Precision cylindrical form with diamond-knurled tactile controls.',
      finish: 'Brushed Architectural Gold',
      href: '/collections/aura',
    },
    {
      id: 'cascade',
      name: 'Cascade Luxe',
      badge: 'Best Seller',
      description: 'Thermostatic shower mixers and fluted overhead rain experiences.',
      finish: 'Polished Mirror Chrome',
      href: '/collections/cascade',
    },
    {
      id: 'obsidian',
      name: 'Obsidian Noir',
      badge: 'New Release',
      description: 'Dual-baked matte obsidian with underlying architectural brass accents.',
      finish: 'Matte Obsidian PVD',
      href: '/collections/obsidian',
    },
    {
      id: 'neo',
      name: 'Neo Architectural',
      badge: 'Planar',
      description: 'Geometric planar precision engineered for modern minimalist spaces.',
      finish: 'Raw Forged Brass',
      href: '/collections/neo',
    },
  ];

  return (
    <div className="w-full flex flex-col gap-space-8 py-space-6 md:py-space-8 max-w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-space-4 md:px-space-6 w-full">
        <div className="relative rounded-lg bg-surface-inverse text-on-surface-inverse p-space-6 sm:p-space-8 md:p-space-8 overflow-hidden shadow-lg border border-border">
          <div className="relative z-raised max-w-2xl flex flex-col gap-space-4">
            <span className="text-caption font-semibold tracking-wide uppercase text-purple-light">
              Indian Architectural Craftsmanship
            </span>
            <h1 className="text-display font-display font-medium tracking-tight leading-tight text-on-surface-inverse">
              Pure geometry. Enduring brassware.
            </h1>
            <p className="text-body text-purple-pale leading-relaxed max-w-xl">
              Engineered from lead-free architectural brass and finished in ultra-durable PVD coatings.
              Built for private residences, luxury hotels, and discerning specifiers.
            </p>
            <div className="flex flex-wrap items-center gap-space-3 pt-space-2">
              <Link href="/products">
                <Button variant="primary">Explore Catalogue</Button>
              </Link>
              <Link href="/style-guide">
                <Button variant="secondary">View Design System</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Collections Grid */}
      <section className="max-w-7xl mx-auto px-space-4 md:px-space-6 w-full flex flex-col gap-space-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-space-2 border-b border-border pb-space-3">
          <div>
            <span className="text-caption font-semibold uppercase tracking-tight text-primary">
              Curation
            </span>
            <h2 className="text-headline font-display font-semibold text-fg">
              Featured Collections
            </h2>
          </div>
          <Link
            href="/collections"
            className="text-small font-medium text-primary hover:underline focus-ring rounded-sm"
          >
            All Collections &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
          {featuredCollections.map((col) => (
            <Card key={col.id} variant="raised" className="flex flex-col h-full">
              <Card.Header>
                <div className="flex items-center justify-between w-full">
                  <Badge variant="primary">{col.badge}</Badge>
                  <span className="text-caption text-fg-muted">{col.finish}</span>
                </div>
              </Card.Header>
              <Card.Body className="flex-1 flex flex-col gap-space-2">
                <Card.Title>{col.name}</Card.Title>
                <p className="text-small text-fg-muted leading-relaxed">
                  {col.description}
                </p>
              </Card.Body>
              <Card.Footer>
                <Link href={col.href} className="w-full">
                  <Button variant="ghost" size="sm" className="w-full justify-between">
                    <span>Inspect Series</span>
                    <span aria-hidden="true">&rarr;</span>
                  </Button>
                </Link>
              </Card.Footer>
            </Card>
          ))}
        </div>
      </section>

      {/* Architecture & Engineering Standards */}
      <section className="max-w-7xl mx-auto px-space-4 md:px-space-6 w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-space-4 p-space-6 bg-surface-solid rounded-md border border-border shadow-sm">
          <div className="flex flex-col gap-space-2">
            <span className="text-caption font-semibold uppercase text-primary">01 / Metallurgical Purity</span>
            <h3 className="text-title font-medium text-fg">Architectural Brass</h3>
            <p className="text-small text-fg-muted leading-relaxed">
              Forged exclusively from certified lead-free brass ingots, preventing groundwater leaching and guaranteeing decades of hydraulic integrity.
            </p>
          </div>
          <div className="flex flex-col gap-space-2">
            <span className="text-caption font-semibold uppercase text-primary">02 / Surface Resilience</span>
            <h3 className="text-title font-medium text-fg">Vapour Deposition (PVD)</h3>
            <p className="text-small text-fg-muted leading-relaxed">
              Zirconium and titanium molecular bonding produces an ultra-hard surface impervious to corrosion, abrasive cleaning, and harsh water.
            </p>
          </div>
          <div className="flex flex-col gap-space-2">
            <span className="text-caption font-semibold uppercase text-primary">03 / Specifier Support</span>
            <h3 className="text-title font-medium text-fg">BIM & Hydraulic Data</h3>
            <p className="text-small text-fg-muted leading-relaxed">
              Complete CAD geometry, Revit families, and dynamic flow rate curves prepared specifically for hospitality and residential architects.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
