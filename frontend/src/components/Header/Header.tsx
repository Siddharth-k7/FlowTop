'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { NavigationItem } from '../../lib/types-pending';
import { useOptionalCart } from '../Cart';

// Code split search overlay so search index & fuzzing logic load only on-demand
const SiteSearchOverlay = dynamic(
  () => import('../Search').then((mod) => mod.SiteSearchOverlay),
  { ssr: false }
);

export interface HeaderProps {
  items: NavigationItem[];
  cartCount?: number;
}

export function Header({ items, cartCount = 0 }: HeaderProps) {
  const cartContext = useOptionalCart();
  const liveCount = cartContext ? cartContext.itemCount : cartCount;
  const openCartFn = cartContext?.openCart;

  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileItem, setExpandedMobileItem] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const hamburgerRef = useRef<HTMLButtonElement | null>(null);
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Global Cmd+K / Ctrl+K keyboard shortcut to open search
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // 1. IntersectionObserver for sticky background change (No scroll listener)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry) {
          setIsScrolled(!entry.isIntersecting);
        }
      },
      { root: null, threshold: 0 }
    );

    observer.observe(sentinel);
    return () => {
      observer.disconnect();
    };
  }, []);

  // 2. Desktop dropdown: Close on outside click or Escape
  useEffect(() => {
    if (!openDropdown) return undefined;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const currentDropdownId = openDropdown;
        setOpenDropdown(null);
        // Return focus to the trigger button
        const trigger = document.getElementById(`dropdown-btn-${currentDropdownId}`);
        trigger?.focus();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [openDropdown]);

  // 3. Mobile menu: Focus trap and Escape return
  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on open
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 50);

    const handleMobileKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMobileMenuOpen(false);
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key === 'Tab' && mobileMenuRef.current) {
        const focusables = mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first && last) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last && first) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleMobileKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleMobileKeyDown);
    };
  }, [isMobileMenuOpen]);

  const handleCloseMobileMenu = () => {
    setIsMobileMenuOpen(false);
    hamburgerRef.current?.focus();
  };

  return (
    <>
      {/* 0. Scroll Sentinel for IntersectionObserver */}
      <div ref={sentinelRef} className="absolute top-0 left-0 w-full h-px pointer-events-none -z-base" aria-hidden="true" />

      {/* Header Container (Fixed 64px height to avoid layout shift) */}
      <header
        className={[
          'sticky top-0 z-sticky w-full h-space-8 transition-colors duration-fast select-none border-b border-border',
          isScrolled
            ? 'bg-surface-solid/95 backdrop-blur-md shadow-sm'
            : 'bg-surface-solid',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="container-page h-full flex items-center justify-between gap-space-4">
          {/* Left: Hamburger (Mobile) + Wordmark */}
          <div className="flex items-center gap-space-3">
            <button
              ref={hamburgerRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={isMobileMenuOpen}
              aria-controls={isMobileMenuOpen ? 'mobile-navigation-drawer' : undefined}
              className="lg:hidden min-w-touch min-h-touch flex items-center justify-center rounded-sm text-fg hover:text-primary transition-colors focus-ring"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            {/* Wordmark */}
            <Link
              href="/"
              className="inline-flex items-center gap-space-2 text-fg focus-ring rounded-sm py-space-1 px-space-1"
              aria-label="Flowtop - Go to homepage"
            >
              <span className="font-display font-semibold tracking-wider text-title text-primary uppercase">
                FLOWTOP
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav
            ref={dropdownRef}
            aria-label="Main Navigation"
            className="hidden lg:flex items-center gap-space-6 h-full"
          >
            {items.map((item) => {
              const hasDropdown = Boolean(item.items && item.items.length > 0);
              const isCurrentOpen = openDropdown === item.id;

              if (!hasDropdown && item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="text-small font-medium text-fg hover:text-primary transition-colors focus-ring px-space-2 py-space-1 rounded-sm"
                  >
                    {item.label}
                  </Link>
                );
              }

              return (
                <div key={item.id} className="relative h-full flex items-center">
                  <button
                    id={`dropdown-btn-${item.id}`}
                    type="button"
                    aria-expanded={isCurrentOpen}
                    aria-haspopup="true"
                    aria-controls={isCurrentOpen ? `dropdown-panel-${item.id}` : undefined}
                    onClick={() => setOpenDropdown(isCurrentOpen ? null : item.id)}
                    className={[
                      'inline-flex items-center gap-space-1 text-small font-medium transition-colors focus-ring px-space-2 py-space-1 rounded-sm',
                      isCurrentOpen ? 'text-primary' : 'text-fg hover:text-primary',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <span>{item.label}</span>
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-fast ${isCurrentOpen ? 'rotate-180 text-primary' : 'text-fg-muted'}`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Dropdown Panel */}
                  {isCurrentOpen && (
                    <div
                      id={`dropdown-panel-${item.id}`}
                      role="region"
                      aria-label={`${item.label} sub-menu`}
                      className="absolute top-full left-0 mt-px w-72 bg-surface-solid rounded-md border border-border shadow-lg p-space-3 z-dropdown flex flex-col gap-space-1 transition-opacity duration-fast"
                    >
                      {item.items?.map((sub) => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={() => setOpenDropdown(null)}
                          className="flex flex-col p-space-2 rounded-sm hover:bg-surface transition-colors focus-ring text-left"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-small font-medium text-fg">
                              {sub.label}
                            </span>
                            {sub.badge && (
                              <span className="px-space-2 py-px rounded-pill text-caption font-semibold bg-purple-pale text-purple-deep">
                                {sub.badge}
                              </span>
                            )}
                          </div>
                          {sub.description && (
                            <span className="text-caption text-fg-muted mt-px line-clamp-1">
                              {sub.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Right Side Actions: Search (no behaviour yet) & Cart with Count */}
          <div className="flex items-center gap-space-1">
            {/* Search Icon Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              aria-label="Search catalogue (Cmd+K)"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-sm text-fg hover:text-primary transition-colors focus-ring"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>

            {/* Cart Icon Button with Count Badge */}
            <Link
              href="/cart"
              onClick={(e) => {
                if (openCartFn) {
                  e.preventDefault();
                  openCartFn();
                }
              }}
              aria-label={liveCount > 0 ? `Shopping cart, ${liveCount} items` : 'Shopping cart'}
              className="min-w-touch min-h-touch relative flex items-center justify-center rounded-sm text-fg hover:text-primary transition-colors focus-ring"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>

              {/* Count badge: hidden at 0 */}
              {liveCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute top-space-1 right-space-1 min-w-[18px] h-[18px] px-1 rounded-pill bg-primary text-on-primary text-[10px] font-semibold flex items-center justify-center leading-none"
                >
                  {liveCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Full-Screen Slide-in Menu */}
      {isMobileMenuOpen && (
        <div
          id="mobile-navigation-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          ref={mobileMenuRef}
          className="fixed inset-0 z-modal bg-surface-solid flex flex-col p-space-6 overflow-y-auto lg:hidden"
        >
          {/* Header inside drawer */}
          <div className="flex items-center justify-between border-b border-border pb-space-4">
            <span className="font-display font-semibold tracking-tight text-title text-primary uppercase">
              FLOWTOP
            </span>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={handleCloseMobileMenu}
              aria-label="Close navigation menu"
              className="min-w-touch min-h-touch flex items-center justify-center rounded-sm text-fg hover:text-primary transition-colors focus-ring"
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Links list */}
          <nav className="flex flex-col py-space-6 gap-space-2 divide-y divide-border">
            {items.map((item) => {
              const hasDropdown = Boolean(item.items && item.items.length > 0);
              const isExpanded = expandedMobileItem === item.id;

              if (!hasDropdown && item.href) {
                return (
                  <div key={item.id} className="pt-space-2 first:pt-0">
                    <Link
                      href={item.href}
                      onClick={handleCloseMobileMenu}
                      className="min-h-touch flex items-center text-title font-medium text-fg hover:text-primary transition-colors focus-ring rounded-sm px-space-2"
                    >
                      {item.label}
                    </Link>
                  </div>
                );
              }

              return (
                <div key={item.id} className="flex flex-col pt-space-2 first:pt-0">
                  <button
                    type="button"
                    aria-expanded={isExpanded}
                    onClick={() => setExpandedMobileItem(isExpanded ? null : item.id)}
                    className="min-h-touch flex items-center justify-between text-title font-medium text-fg hover:text-primary transition-colors focus-ring rounded-sm px-space-2 text-left"
                  >
                    <span>{item.label}</span>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className={`transition-transform duration-fast ${isExpanded ? 'rotate-180 text-primary' : 'text-fg-muted'}`}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>

                  {/* Accordion children */}
                  {isExpanded && (
                    <div className="flex flex-col pl-space-4 py-space-2 gap-space-1 bg-surface rounded-sm my-space-1">
                      {item.items?.map((sub) => (
                        <Link
                          key={sub.id}
                          href={sub.href}
                          onClick={handleCloseMobileMenu}
                          className="min-h-touch flex flex-col justify-center px-space-2 rounded-sm text-small font-medium text-fg hover:text-primary focus-ring"
                        >
                          <div className="flex items-center gap-space-2">
                            <span>{sub.label}</span>
                            {sub.badge && (
                              <span className="px-space-2 py-px rounded-pill text-caption font-semibold bg-purple-pale text-purple-deep">
                                {sub.badge}
                              </span>
                            )}
                          </div>
                          {sub.description && (
                            <span className="text-caption text-fg-muted">
                              {sub.description}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Quick contact / trade CTA in mobile drawer */}
          <div className="mt-auto pt-space-6 border-t border-border flex flex-col gap-space-3">
            <Link
              href="/trade"
              onClick={handleCloseMobileMenu}
              className="min-h-touch flex items-center justify-center bg-primary text-on-primary font-medium rounded-sm focus-ring"
            >
              Architect & Trade Portal
            </Link>
            <Link
              href="/contact"
              onClick={handleCloseMobileMenu}
              className="min-h-touch flex items-center justify-center border border-border text-fg font-medium rounded-sm hover:bg-surface focus-ring"
            >
              Contact Experience Studio
            </Link>
          </div>
        </div>
      )}

      {/* Site Search Overlay */}
      <SiteSearchOverlay
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}
