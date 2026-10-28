import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard accessibility: Close mobile drawer on Escape
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 animate-nav-enter transition-all duration-300 ${
        isScrolled
          ? 'glass-panel shadow-subtle py-3 border-b border-border-subtle/80'
          : 'bg-surface-white/95 backdrop-blur-md py-4 border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Brand Wordmark */}
        <a
          href="#"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-deep rounded-sm p-1 -m-1 shrink-0"
          aria-label="Flowtop Homepage"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-purple-deep group-hover:scale-125 transition-transform duration-300"></span>
          <span className="font-display font-bold text-xl tracking-[0.2em] text-ink uppercase">
            FLOWTOP
          </span>
          <span className="hidden sm:inline-block text-[10px] tracking-wider text-purple-light uppercase font-semibold pl-1.5 border-l border-border-subtle">
            BATHFITTINGS
          </span>
        </a>

        {/* Desktop Navigation (Visible at lg >= 1024px to prevent label wrapping) */}
        <nav
          className="hidden lg:flex items-center space-x-6 xl:space-x-8 shrink-0"
          aria-label="Main Navigation"
        >
          <a
            href="#showroom"
            className="whitespace-nowrap text-sm font-medium text-ink hover:text-purple-deep transition-colors py-2"
          >
            Showroom
          </a>
          <a
            href="#catalogue"
            className="whitespace-nowrap text-sm font-medium text-ink hover:text-purple-deep transition-colors py-2"
          >
            Fittings & Mixers
          </a>
          <a
            href="#collections"
            className="whitespace-nowrap text-sm font-medium text-ink hover:text-purple-deep transition-colors py-2"
          >
            Collections
          </a>
          <a
            href="#craftsmanship"
            className="whitespace-nowrap text-sm font-medium text-ink hover:text-purple-deep transition-colors py-2"
          >
            Craftsmanship
          </a>
          <a
            href="#gallery"
            className="whitespace-nowrap text-sm font-medium text-ink hover:text-purple-deep transition-colors py-2"
          >
            Spaces
          </a>
        </nav>

        {/* Action Button */}
        <div className="hidden lg:flex items-center space-x-4 shrink-0">
          <Button asLink href="#contact" variant="primary" size="sm" arrowDirection="up-right">
            Project Enquiry
          </Button>
        </div>

        {/* Mobile / Tablet Menu Trigger (Visible on < 1024px) */}
        <div className="flex lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="min-h-[44px] min-w-[44px] p-2 inline-flex items-center justify-center text-ink hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink rounded-token-md transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile & Tablet Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden glass-panel border-b border-border-subtle px-4 pt-4 pb-6 space-y-4 shadow-elevated animate-in fade-in slide-in-from-top-2 duration-200"
          role="dialog"
          aria-modal="true"
        >
          <nav className="flex flex-col space-y-3" aria-label="Mobile Navigation">
            <a
              href="#showroom"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink hover:text-purple-deep py-2 px-3 rounded-token-sm hover:bg-purple-pale/50"
            >
              Showroom
            </a>
            <a
              href="#catalogue"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink hover:text-purple-deep py-2 px-3 rounded-token-sm hover:bg-purple-pale/50"
            >
              Fittings & Mixers
            </a>
            <a
              href="#collections"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink hover:text-purple-deep py-2 px-3 rounded-token-sm hover:bg-purple-pale/50"
            >
              Collections
            </a>
            <a
              href="#craftsmanship"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink hover:text-purple-deep py-2 px-3 rounded-token-sm hover:bg-purple-pale/50"
            >
              Craftsmanship
            </a>
            <a
              href="#gallery"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink hover:text-purple-deep py-2 px-3 rounded-token-sm hover:bg-purple-pale/50"
            >
              Spaces
            </a>
          </nav>
          <div className="pt-2 border-t border-border-subtle">
            <Button
              asLink
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              variant="primary"
              className="w-full justify-between"
            >
              Project Consultation
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
