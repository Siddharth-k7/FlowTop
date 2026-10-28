import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface-white border-t border-border-subtle pt-space-16 pb-space-12 text-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 pb-space-12 border-b border-border-subtle">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-purple-deep"></span>
              <span className="font-display font-bold text-xl tracking-[0.2em] uppercase">
                FLOWTOP
              </span>
            </div>
            <p className="text-ink-muted text-sm max-w-sm leading-relaxed">
              Architectural bathfittings crafted for residential sanctuaries and boutique developments. Focused on solid brass materiality, pure geometry, and dependable water control.
            </p>
            <div className="pt-2 text-xs text-ink-subtle space-y-0.5">
              <p>Designed for Contemporary Living</p>
              <p>Crafted in India</p>
            </div>
          </div>

          {/* Fittings Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-deep">
              Fittings & Mixers
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <a href="#products" className="hover:text-purple-deep transition-colors">
                  Basin Mixers
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-purple-deep transition-colors">
                  Pillar Cocks
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-purple-deep transition-colors">
                  Bib Cocks
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-purple-deep transition-colors">
                  Shower Mixers
                </a>
              </li>
              <li>
                <a href="#products" className="hover:text-purple-deep transition-colors">
                  Kitchen Faucets
                </a>
              </li>
            </ul>
          </div>

          {/* Collections Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-deep">
              Collections
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <a href="#collections" className="hover:text-purple-deep transition-colors">
                  The Opel Series
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-purple-deep transition-colors">
                  Vectra Monolith
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-purple-deep transition-colors">
                  Aura Kitchen
                </a>
              </li>
              <li>
                <a href="#collections" className="hover:text-purple-deep transition-colors">
                  Architectural Finishes
                </a>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-purple-deep">
              Enquiries & Studio
            </h4>
            <ul className="space-y-2 text-sm text-ink-muted">
              <li>
                <a href="#contact" className="hover:text-purple-deep transition-colors">
                  Trade Enquiries
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-purple-deep transition-colors">
                  Project Consultation
                </a>
              </li>
              <li>
                <a href="#craftsmanship" className="hover:text-purple-deep transition-colors">
                  Design Philosophy
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-purple-deep transition-colors">
                  Completed Spaces
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-space-8 flex flex-col sm:flex-row items-center justify-between text-xs text-ink-subtle gap-4">
          <p>© {new Date().getFullYear()} Flowtop Bathfittings. All rights reserved.</p>
          <div className="flex space-x-6">
            <a href="#showroom" className="hover:text-purple-deep transition-colors">
              Back to Top ↑
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
