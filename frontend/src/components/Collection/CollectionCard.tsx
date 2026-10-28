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
      <div className="p-space-6 flex flex-col flex-1 justify-between gap-space-5">
        <div className="flex flex-col gap-space-2">
          <span className="text-caption font-semibold tracking-widest uppercase text-fg-muted">
            {productCountText}
          </span>
          <h2 className="font-display font-light text-title md:text-headline tracking-tight text-fg group-hover:text-primary transition-colors">
            {collection.name}
          </h2>
          <p className="text-caption md:text-small text-fg-muted font-light line-clamp-3 leading-relaxed">
            {collection.description || collection.tagline}
          </p>
        </div>

        <div className="pt-space-1 inline-flex items-center gap-space-2 text-caption font-semibold text-fg group-hover:text-primary transition-colors">
          <span>Explore Collection</span>
          <span className="transition-transform duration-base group-hover:translate-x-1" aria-hidden="true">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}
