import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Collection } from '../../lib/types-pending';

export interface CollectionCardProps {
  collection: Collection;
  priority?: boolean;
}

export function CollectionCard({ collection, priority = false }: CollectionCardProps) {
  const productCountText =
    collection.productCount === 1
      ? '1 Architectural Piece'
      : `${collection.productCount} Architectural Pieces`;

  return (
    <Link
      href={`/collections/${collection.slug}`}
      className="group relative flex flex-col bg-surface-solid rounded-lg border border-border overflow-hidden transition-all duration-300 hover:shadow-md focus-ring"
      aria-label={`${collection.name} Collection, ${productCountText}`}
    >
      {/* Calm hover image container: scale 1.03 inside overflow hidden, transform only */}
      <div className="relative w-full aspect-[16/10] overflow-hidden bg-surface">
        <Image
          src={collection.heroImage}
          alt={collection.name}
          fill
          priority={priority}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03] transform-gpu will-change-transform"
        />
        {/* Subtle scrim for image depth */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"
          aria-hidden="true"
        />
      </div>

      {/* Card Content */}
      <div className="p-space-6 flex flex-col flex-1 justify-between gap-space-4">
        <div className="flex flex-col gap-space-2">
          <span className="text-caption font-medium tracking-wide uppercase text-primary">
            {productCountText}
          </span>
          <h2 className="font-display font-light text-headline tracking-tight text-fg group-hover:text-primary transition-colors">
            {collection.name}
          </h2>
          <p className="text-body text-fg-muted line-clamp-3 leading-relaxed">
            {collection.description || collection.tagline}
          </p>
        </div>

        <div className="pt-space-2 inline-flex items-center gap-space-2 text-small font-medium text-fg group-hover:text-primary transition-colors">
          <span>Explore Collection</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 ease-out group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
