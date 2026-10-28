import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { api } from '../../lib/api';
import { PRODUCT_BLUR_DATA_URL } from '../../lib/image-constants';
import {
  parseJournalParams,
  buildJournalHref,
  JOURNAL_CATEGORIES,
  isJournalCategoryValid,
  getJournalCategoryBySlug,
} from '../../lib/journal';
import { Card, Badge, Pagination, EmptyState, Button } from '@flowtop/ui';

interface JournalPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: JournalPageProps): Promise<Metadata> {
  const resolved = await searchParams;
  const parsed = parseJournalParams(resolved);

  if (parsed.category && !isJournalCategoryValid(parsed.category)) {
    return { title: 'Category Not Found | Flowtop' };
  }

  const activeCategory = getJournalCategoryBySlug(parsed.category);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  const title = activeCategory
    ? `${activeCategory.label} | Flowtop Journal`
    : 'Journal | Architectural Brassware & Considered Living';
  const description =
    'Essays, design interviews, and material guides on architectural brassware and contemporary bathroom design in India.';
  const canonical = buildJournalHref(`${siteUrl}/journal`, parsed);

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Flowtop',
      type: 'website',
    },
  };
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function JournalPage({ searchParams }: JournalPageProps) {
  const resolved = await searchParams;
  const parsed = parseJournalParams(resolved);

  // Missing or invalid category is a 404
  if (parsed.category && !isJournalCategoryValid(parsed.category)) {
    notFound();
  }

  const journalRes = await api.getJournal({
    category: parsed.category,
    page: parsed.page,
    perPage: 9,
  });

  const articles = journalRes?.data || [];
  const meta = journalRes?.meta || { page: 1, perPage: 9, total: 0, totalPages: 1 };
  const activeCategory = getJournalCategoryBySlug(parsed.category);

  return (
    <div className="w-full flex flex-col py-space-6 md:py-space-8 max-w-full overflow-x-hidden">
      <div className="container-page flex flex-col gap-space-8 w-full">
        {/* Header Section */}
        <header className="flex flex-col gap-space-3 max-w-2xl">
          <span className="text-caption font-semibold tracking-wide uppercase text-primary">
            The Flowtop Journal
          </span>
          <h1 className="text-display font-display font-normal tracking-tight text-fg">
            Water, materials & considered living
          </h1>
          <p className="text-body text-fg-muted leading-relaxed">
            Essays on architectural restraint, metallurgical purity, and considered everyday rituals.
          </p>
        </header>

        {/* Category Filter Pills */}
        <nav aria-label="Journal categories" className="flex flex-wrap items-center gap-space-2 pb-space-2 border-b border-border">
          <Link
            href="/journal"
            className={`min-h-[44px] px-space-4 py-space-2 rounded-full text-small font-medium transition-colors duration-fast focus-ring flex items-center ${
              !parsed.category
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-fg hover:bg-surface-solid border border-border'
            }`}
          >
            All Articles
          </Link>
          {JOURNAL_CATEGORIES.map((cat) => {
            const isActive = parsed.category === cat.slug;
            return (
              <Link
                key={cat.slug}
                href={buildJournalHref('/journal', parsed, { category: cat.slug, page: 1 })}
                className={`min-h-[44px] px-space-4 py-space-2 rounded-full text-small font-medium transition-colors duration-fast focus-ring flex items-center ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'bg-surface text-fg hover:bg-surface-solid border border-border'
                }`}
              >
                {cat.label}
              </Link>
            );
          })}
        </nav>

        {/* Main Content Area */}
        {articles.length === 0 ? (
          <EmptyState
            title="No articles found"
            description={
              activeCategory
                ? `There are currently no articles published in the "${activeCategory.label}" category.`
                : 'No journal articles are available at this time.'
            }
            action={
              parsed.category ? (
                <Link href="/journal">
                  <Button variant="secondary">View All Articles</Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="flex flex-col gap-space-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-6">
              {articles.map((art) => (
                <Link
                  key={art.id}
                  href={`/journal/${art.slug}`}
                  className="group flex flex-col focus-ring rounded-lg"
                >
                  <Card variant="raised" className="flex flex-col h-full overflow-hidden hover:shadow-md transition-shadow duration-fast">
                    {/* Cover Image */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-solid">
                      <Image
                        src={art.coverImage}
                        alt={art.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL={PRODUCT_BLUR_DATA_URL}
                        className="object-cover transition-transform duration-slow group-hover:scale-105"
                      />
                    </div>

                    <Card.Header>
                      <div className="flex items-center justify-between w-full gap-space-2">
                        <Badge variant="primary">{art.category}</Badge>
                        <span className="text-caption text-fg-muted whitespace-nowrap">
                          {formatDate(art.publishedAt)}
                        </span>
                      </div>
                    </Card.Header>

                    <Card.Body className="flex-1 flex flex-col gap-space-2">
                      <Card.Title as="h2" className="line-clamp-2 group-hover:text-primary transition-colors duration-fast">
                        {art.title}
                      </Card.Title>
                      <p className="text-small text-fg-muted line-clamp-3 leading-relaxed">
                        {art.excerpt}
                      </p>
                    </Card.Body>

                    <Card.Footer>
                      <div className="flex items-center justify-between w-full text-caption text-fg-muted font-medium">
                        <span>{art.readTimeMinutes} min read</span>
                        <span className="text-primary group-hover:translate-x-0.5 transition-transform duration-fast">
                          Read article &rarr;
                        </span>
                      </div>
                    </Card.Footer>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {meta.totalPages > 1 && (
              <div className="flex justify-center pt-space-6 border-t border-border">
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  getHref={(p) => buildJournalHref('/journal', parsed, { page: p })}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
