import React from 'react';
import Link from 'next/link';
import type { FooterColumn, SocialLink } from '../../lib/types-pending';

export interface FooterProps {
  columns: FooterColumn[];
  socialLinks: SocialLink[];
  legalNotice: string;
}

export function Footer({ columns, socialLinks, legalNotice }: FooterProps) {
  return (
    <footer className="w-full bg-surface-solid border-t border-border pt-space-8 pb-space-6 text-fg select-none">
      <div className="max-w-7xl mx-auto px-space-4 md:px-space-6 flex flex-col gap-space-8">
        {/* Brand & Introduction */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 border-b border-border pb-space-6">
          <div className="flex flex-col gap-space-2 max-w-lg">
            <span className="font-display font-semibold tracking-tight text-headline text-primary uppercase">
              FLOWTOP
            </span>
            <p className="text-small text-fg-muted leading-relaxed">
              Architectural bath fittings and brassware crafted in India from lead-free brass. Engineered for enduring luxury and flawless precision.
            </p>
          </div>

          {/* Social Icons */}
          <div className="flex items-center gap-space-2">
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="min-w-touch min-h-touch flex items-center justify-center rounded-sm text-fg-muted hover:text-primary transition-colors focus-ring"
              >
                {social.platform === 'instagram' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                )}
                {social.platform === 'linkedin' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect x="2" y="9" width="4" height="12" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                )}
                {social.platform === 'pinterest' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="12" y1="4" x2="12" y2="20" />
                    <path d="M18 8.5a6 6 0 0 0-9.33-5 6 6 0 0 0-2.67 7.5c.67 2 2 3.5 3 4.5" />
                    <path d="M10 13a3 3 0 0 0 4.5 2.5 3 3 0 0 0 1.5-2.5" />
                  </svg>
                )}
                {social.platform === 'youtube' && (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
                    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
                  </svg>
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Four Link Columns */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-space-6">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col gap-space-3">
              <h3 className="text-small font-semibold text-fg tracking-tight">
                {col.title}
              </h3>
              <ul className="flex flex-col gap-space-2 list-none p-0 m-0">
                {col.links.map((link) => (
                  <li key={link.id}>
                    <Link
                      href={link.href}
                      className="text-small text-fg-muted hover:text-primary transition-colors focus-ring rounded-sm inline-block py-px"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Legal Line & Credits */}
        <div className="border-t border-border pt-space-6 flex flex-col sm:flex-row items-center justify-between gap-space-3 text-caption text-fg-muted">
          <p>{legalNotice}</p>
          <div className="flex flex-wrap items-center gap-space-4">
            <Link href="/privacy" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Terms of Service
            </Link>
            <Link href="/shipping" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Shipping Policy
            </Link>
            <Link href="/refunds" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Returns &amp; Refunds
            </Link>
            <Link href="/support" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Support &amp; FAQs
            </Link>
            <Link href="/sitemap.xml" className="hover:text-primary transition-colors focus-ring rounded-sm">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
