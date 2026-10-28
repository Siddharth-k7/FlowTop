'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';
import { analytics } from '../../lib/analytics';
import { formatPaise } from '../../lib/format';
import { Spinner } from '@flowtop/ui';
import type { SiteSearchResults, SearchProductItem, SearchCollectionItem, SearchArticleItem } from '../../lib/types-pending';

export interface SiteSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

const RECENT_SEARCHES_KEY = 'flowtop_recent_searches';
const MAX_RECENT_SEARCHES = 6;

const CURATED_SUGGESTIONS = [
  'Basin Mixers',
  'Aura Series',
  'Matte Black',
  'Cascade Luxe',
  'Shower Systems',
  'PVD Care & Maintenance',
];

type NavigableItem =
  | { kind: 'product'; data: SearchProductItem; href: string }
  | { kind: 'collection'; data: SearchCollectionItem; href: string }
  | { kind: 'article'; data: SearchArticleItem; href: string };

export function SiteSearchOverlay({ isOpen, onClose }: SiteSearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SiteSearchResults>({
    products: [],
    collections: [],
    articles: [],
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const resultsContainerRef = useRef<HTMLDivElement | null>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const dialogCardRef = useRef<HTMLDivElement | null>(null);

  // 1. Safe localStorage access wrapped in try/catch (critical for private browsing)
  const loadRecentSearches = useCallback((): string[] => {
    try {
      if (typeof window === 'undefined') return [];
      const stored = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_RECENT_SEARCHES);
      }
    } catch {
      // Safe catch: private browsing mode or storage quotas throw SecurityError
    }
    return [];
  }, []);

  const saveRecentSearch = useCallback((term: string) => {
    const cleanTerm = term.trim();
    if (!cleanTerm || cleanTerm.length < 2) return;

    try {
      if (typeof window === 'undefined') return;
      const current = loadRecentSearches();
      const updated = [cleanTerm, ...current.filter((t) => t.toLowerCase() !== cleanTerm.toLowerCase())].slice(
        0,
        MAX_RECENT_SEARCHES
      );
      window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // Safe catch for private windows
    }
  }, [loadRecentSearches]);

  const clearRecentSearches = () => {
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    } catch {
      // Safe catch
    }
    setRecentSearches([]);
  };

  // 2. Open / Close lifecycle & body scroll locking
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setDebouncedQuery('');
      setResults({ products: [], collections: [], articles: [] });
      setHighlightedIndex(-1);
      openerRef.current?.focus();
      return undefined;
    }

    openerRef.current = document.activeElement as HTMLElement | null;

    // Load recent searches on open
    setRecentSearches(loadRecentSearches());

    // Lock background scroll
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Auto-focus input
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = origOverflow;
      openerRef.current?.focus();
    };
  }, [isOpen, loadRecentSearches]);

  // 3. Debounce search query (250ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 250);

    return () => clearTimeout(handler);
  }, [query]);

  // 4. Fetch search results when debounced query changes
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults({ products: [], collections: [], articles: [] });
      setIsLoading(false);
      setHighlightedIndex(-1);
      return;
    }

    let isSubscribed = true;
    setIsLoading(true);

    api
      .searchSite(debouncedQuery)
      .then((res) => {
        if (!isSubscribed) return;
        setResults(res.data);
        setIsLoading(false);
        setHighlightedIndex(0); // Highlight first result

        const totalCount =
          res.data.products.length + res.data.collections.length + res.data.articles.length;
        // Centralized analytics tracking
        analytics.search(debouncedQuery, totalCount);
      })
      .catch((err) => {
        if (!isSubscribed) return;
        console.warn('[SiteSearch] Search error:', err);
        setResults({ products: [], collections: [], articles: [] });
        setIsLoading(false);
      });

    return () => {
      isSubscribed = false;
    };
  }, [debouncedQuery]);

  // 5. Flattened navigable list for arrow-key navigation
  const navigableItems: NavigableItem[] = useMemo(() => {
    const items: NavigableItem[] = [];

    for (const p of results.products) {
      items.push({ kind: 'product', data: p, href: `/products/${p.slug}` });
    }
    for (const c of results.collections) {
      items.push({ kind: 'collection', data: c, href: `/collections/${c.slug}` });
    }
    for (const a of results.articles) {
      items.push({ kind: 'article', data: a, href: `/journal/${a.slug}` });
    }

    return items;
  }, [results]);

  // 6. Keyboard navigation (ArrowDown, ArrowUp, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }

    if (e.key === 'Tab') {
      if (!dialogCardRef.current) return;
      const focusable = Array.from(
        dialogCardRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetParent !== null || el.offsetWidth > 0 || el.offsetHeight > 0);

      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (first && last) {
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
      return;
    }

    if (navigableItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % navigableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + navigableItems.length) % navigableItems.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < navigableItems.length) {
        e.preventDefault();
        const target = navigableItems[highlightedIndex];
        if (target) {
          saveRecentSearch(query);
          onClose();
          router.push(target.href);
        }
      } else if (query.trim()) {
        saveRecentSearch(query);
      }
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setQuery(suggestion);
    inputRef.current?.focus();
  };

  if (!isOpen) return null;

  const totalResults = navigableItems.length;
  const hasQuery = query.trim().length >= 2;
  const isEmptyResult = hasQuery && !isLoading && totalResults === 0;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site Search"
      className="fixed inset-0 z-modal flex flex-col items-center justify-start pt-space-12 sm:pt-space-16 px-space-4"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-ink/60 backdrop-blur-sm transition-opacity duration-fast"
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div
        ref={dialogCardRef}
        className="relative w-full max-w-2xl bg-surface-solid rounded-lg border border-border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] z-raised animate-in fade-in zoom-in-95 duration-fast"
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-space-5 py-space-4 border-b border-border bg-surface-solid">
          <svg
            className="w-5 h-5 text-fg-muted mr-space-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <label htmlFor="site-search-input" className="sr-only">
            Search fixtures, collections, finishes or articles
          </label>
          <input
            id="site-search-input"
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fixtures, collections, finishes or articles..."
            className="w-full bg-transparent text-body text-fg placeholder:text-fg-muted focus:outline-none"
            aria-autocomplete="list"
            aria-controls="search-results-list"
          />

          {isLoading ? (
            <div className="ml-space-2 flex-shrink-0">
              <Spinner size="sm" />
            </div>
          ) : query ? (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="text-caption font-medium text-fg-muted hover:text-fg px-space-2 py-space-1 rounded-sm focus-ring ml-space-2"
              aria-label="Clear search input"
            >
              Clear
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="ml-space-3 text-caption text-fg-muted px-space-2 py-space-1 rounded-sm border border-border hover:bg-surface focus-ring"
            aria-label="Close search (Escape)"
          >
            ESC
          </button>
        </div>

        {/* Results Container */}
        <div
          ref={resultsContainerRef}
          id="search-results-list"
          className="flex-1 overflow-y-auto p-space-5 divide-y divide-border/60"
        >
          {/* A. Results Present */}
          {hasQuery && totalResults > 0 && (
            <div className="space-y-space-6 pb-space-4">
              {/* 1. Products Group */}
              {results.products.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-space-3">
                    <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                      Products
                    </span>
                    <span className="text-caption text-fg-muted">
                      {results.products.length} {results.products.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  <div className="space-y-space-1">
                    {results.products.map((p) => {
                      const itemIdx = navigableItems.findIndex(
                        (i) => i.kind === 'product' && i.data.id === p.id
                      );
                      const isHighlighted = itemIdx === highlightedIndex;

                      return (
                        <Link
                          key={p.id}
                          href={`/products/${p.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          onMouseEnter={() => setHighlightedIndex(itemIdx)}
                          className={`flex items-center justify-between p-space-2.5 rounded-sm transition-colors ${
                            isHighlighted ? 'bg-primary-tint/30 text-fg ring-1 ring-primary/40' : 'hover:bg-surface text-fg'
                          }`}
                          aria-selected={isHighlighted}
                        >
                          <div className="flex items-center gap-space-3">
                            <div className="w-10 h-10 rounded-sm bg-surface overflow-hidden relative flex-shrink-0 border border-border">
                              {p.imageUrl ? (
                                <Image
                                  src={p.imageUrl}
                                  alt={p.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-surface-solid" />
                              )}
                            </div>
                            <div>
                              <p className="text-small font-medium text-fg">{p.name}</p>
                              <p className="text-caption text-fg-muted font-mono">{p.sku}</p>
                            </div>
                          </div>

                          <span className="text-small font-semibold text-fg">
                            {formatPaise(p.salePrice ? p.salePrice : p.price)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Collections Group */}
              {results.collections.length > 0 && (
                <div className="pt-space-4">
                  <div className="flex items-center justify-between mb-space-3">
                    <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                      Collections
                    </span>
                    <span className="text-caption text-fg-muted">
                      {results.collections.length} {results.collections.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  <div className="space-y-space-1">
                    {results.collections.map((c) => {
                      const itemIdx = navigableItems.findIndex(
                        (i) => i.kind === 'collection' && i.data.id === c.id
                      );
                      const isHighlighted = itemIdx === highlightedIndex;

                      return (
                        <Link
                          key={c.id}
                          href={`/collections/${c.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          onMouseEnter={() => setHighlightedIndex(itemIdx)}
                          className={`flex items-center justify-between p-space-2.5 rounded-sm transition-colors ${
                            isHighlighted ? 'bg-primary-tint/30 text-fg ring-1 ring-primary/40' : 'hover:bg-surface text-fg'
                          }`}
                          aria-selected={isHighlighted}
                        >
                          <div>
                            <p className="text-small font-medium text-fg">{c.name}</p>
                            {c.description && (
                              <p className="text-caption text-fg-muted line-clamp-1">{c.description}</p>
                            )}
                          </div>
                          <span className="text-caption text-fg-muted font-medium">Explore Collection →</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Journal Articles Group */}
              {results.articles.length > 0 && (
                <div className="pt-space-4">
                  <div className="flex items-center justify-between mb-space-3">
                    <span className="text-caption font-semibold uppercase tracking-wider text-primary">
                      Journal & Technical Guides
                    </span>
                    <span className="text-caption text-fg-muted">
                      {results.articles.length} {results.articles.length === 1 ? 'match' : 'matches'}
                    </span>
                  </div>

                  <div className="space-y-space-1">
                    {results.articles.map((a) => {
                      const itemIdx = navigableItems.findIndex(
                        (i) => i.kind === 'article' && i.data.id === a.id
                      );
                      const isHighlighted = itemIdx === highlightedIndex;

                      return (
                        <Link
                          key={a.id}
                          href={`/journal/${a.slug}`}
                          onClick={() => {
                            saveRecentSearch(query);
                            onClose();
                          }}
                          onMouseEnter={() => setHighlightedIndex(itemIdx)}
                          className={`flex flex-col p-space-2.5 rounded-sm transition-colors ${
                            isHighlighted ? 'bg-primary-tint/30 text-fg ring-1 ring-primary/40' : 'hover:bg-surface text-fg'
                          }`}
                          aria-selected={isHighlighted}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-small font-medium text-fg">{a.title}</span>
                            <span className="text-caption px-space-2 py-0.5 rounded-pill bg-surface text-fg-muted border border-border">
                              {a.category}
                            </span>
                          </div>
                          <p className="text-caption text-fg-muted line-clamp-1 mt-0.5">{a.excerpt}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* B. Empty State when query returned zero matches */}
          {isEmptyResult && (
            <div className="py-space-8 text-center space-y-space-4">
              <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mx-auto text-fg-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-body font-medium text-fg">No matches found for &ldquo;{query}&rdquo;</p>
                <p className="text-small text-fg-muted mt-1 max-w-sm mx-auto">
                  Check your spelling or browse popular collections and fittings below.
                </p>
              </div>

              {/* Suggestions */}
              <div className="pt-space-2">
                <p className="text-caption font-semibold uppercase text-fg-muted mb-space-2">
                  Suggested Searches
                </p>
                <div className="flex flex-wrap justify-center gap-space-2 max-w-md mx-auto">
                  {CURATED_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="px-space-3 py-space-1.5 rounded-pill border border-border text-caption font-medium text-fg hover:bg-surface focus-ring transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* C. Default State: No query entered yet */}
          {!hasQuery && (
            <div className="py-space-4 space-y-space-6">
              {/* Recent searches */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-space-3">
                    <span className="text-caption font-semibold uppercase tracking-wider text-fg-muted">
                      Recent Searches
                    </span>
                    <button
                      type="button"
                      onClick={clearRecentSearches}
                      className="text-caption text-primary hover:underline font-medium"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-space-2">
                    {recentSearches.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => handleSelectSuggestion(term)}
                        className="inline-flex items-center gap-space-1.5 px-space-3 py-space-1.5 rounded-pill bg-surface text-small font-medium text-fg hover:bg-border/60 transition-colors focus-ring"
                      >
                        <span className="text-fg-muted text-caption">🕒</span>
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Curated suggestions */}
              <div>
                <span className="text-caption font-semibold uppercase tracking-wider text-fg-muted block mb-space-3">
                  Suggested Searches
                </span>
                <div className="flex flex-wrap gap-space-2">
                  {CURATED_SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="px-space-3 py-space-1.5 rounded-pill border border-border text-small font-medium text-fg hover:bg-surface focus-ring transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-space-5 py-space-2.5 bg-surface border-t border-border flex items-center justify-between text-caption text-fg-muted">
          <div className="flex items-center gap-space-3">
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-solid border border-border text-[11px] font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded bg-surface-solid border border-border text-[11px] font-mono">↓</kbd> to navigate
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 rounded bg-surface-solid border border-border text-[11px] font-mono">↵</kbd> to select
            </span>
          </div>
          <span>Flowtop Architectural Search</span>
        </div>
      </div>
    </div>
  );
}
