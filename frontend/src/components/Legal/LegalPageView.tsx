import React from 'react';
import Link from 'next/link';
import type { PageResponse } from '../../lib/types-pending';

interface LegalPageViewProps {
  page: PageResponse;
}

const LEGAL_NAV_ITEMS = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Shipping & Delivery', href: '/shipping' },
  { label: 'Returns & Refunds', href: '/refunds' },
];

export function LegalPageView({ page }: LegalPageViewProps) {
  const content = page.content || '';
  const currentSlug = page.slug;

  // Split markdown content into sections based on ### headings
  const sections = content
    .split(/\n(?=###\s+)/)
    .map((sec) => sec.trim())
    .filter(Boolean);

  const formattedDate = page.updatedAt
    ? new Date(page.updatedAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'October 2026';

  return (
    <article className="w-full max-w-measure mx-auto px-space-4 sm:px-space-6 py-space-10 md:py-space-14">
      {/* Breadcrumbs */}
      <nav aria-label="Legal Breadcrumb" className="mb-space-6 text-caption text-fg-muted">
        <ol className="flex items-center gap-space-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors focus-ring">
              Home
            </Link>
          </li>
          <li aria-hidden="true">&rsaquo;</li>
          <li>
            <span className="text-fg font-medium">Legal &amp; Compliance</span>
          </li>
          <li aria-hidden="true">&rsaquo;</li>
          <li aria-current="page" className="text-fg truncate max-w-[200px]">
            {page.title}
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-space-8 border-b border-border pb-space-6">
        <div className="flex items-center gap-space-2 text-caption font-semibold uppercase tracking-wider text-purple-deep mb-space-2">
          <span>Flowtop Compliance &amp; Policies</span>
          <span>&bull;</span>
          <time dateTime={page.updatedAt || '2026-10-28'}>Last Updated: {formattedDate}</time>
        </div>
        <h1 className="text-headline sm:text-display font-display font-semibold text-fg tracking-tight mb-space-3">
          {page.title}
        </h1>
        <p className="text-body text-fg-muted leading-relaxed">
          Official architectural trade, consumer rights, and operational policy guidelines for Flowtop Brassware India Pvt. Ltd.
        </p>

        {/* Legal Page Switcher Tabs */}
        <div className="flex flex-wrap gap-space-2 pt-space-6" role="tablist" aria-label="Legal documents">
          {LEGAL_NAV_ITEMS.map((item) => {
            const isActive = item.href === `/${currentSlug}`;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-space-3 py-space-2 text-small rounded-sm border transition-colors focus-ring font-medium ${
                  isActive
                    ? 'bg-purple-pale text-purple-deep border-purple-deep'
                    : 'bg-surface-solid text-fg hover:border-primary border-border'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Prominent Placeholder Notice */}
      <div
        className="mb-space-8 p-space-4 rounded-md border border-amber-300 bg-amber-50/70 text-amber-900 text-small leading-relaxed flex flex-col gap-space-1 shadow-sm"
        role="alert"
      >
        <div className="flex items-center gap-space-2 font-semibold text-amber-950 uppercase tracking-wider text-caption">
          <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse" aria-hidden="true" />
          <span>Placeholder Text — Pending Final Legal Sign-Off</span>
        </div>
        <p>
          This policy document contains clearly marked draft placeholder text. Flowtop administrative staff can edit,
          reformat, and publish the final legal copy directly through the Admin CMS without code deployment.
        </p>
      </div>

      {/* Document Content */}
      <div className="flex flex-col gap-space-8 text-body text-fg leading-relaxed">
        {sections.length > 0 ? (
          sections.map((section, idx) => {
            const lines = section.split('\n');
            const titleLine = (lines[0] || '').replace(/^###\s+/, '').trim();
            const bodyLines = lines.slice(1).join('\n').trim();

            const paragraphs = bodyLines.split(/\n\s*\n/).filter(Boolean);

            return (
              <section key={idx} className="flex flex-col gap-space-3">
                <h2 className="text-title font-display font-semibold text-fg tracking-tight border-b border-border/50 pb-space-2">
                  {titleLine}
                </h2>
                {paragraphs.map((p, pIdx) => {
                  if (p.startsWith('- ')) {
                    const items = p
                      .split('\n')
                      .filter((l) => l.trim().startsWith('- '))
                      .map((l) => l.replace(/^- \s*/, ''));
                    return (
                      <ul key={pIdx} className="list-disc pl-space-5 flex flex-col gap-space-2 text-fg">
                        {items.map((item, iIdx) => (
                          <li key={iIdx} dangerouslySetInnerHTML={{ __html: renderFormattedText(item) }} />
                        ))}
                      </ul>
                    );
                  }

                  return (
                    <p
                      key={pIdx}
                      className="text-body text-fg leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: renderFormattedText(p) }}
                    />
                  );
                })}
              </section>
            );
          })
        ) : (
          <p className="text-fg-muted italic">Policy content is currently being prepared by the legal team.</p>
        )}
      </div>

      {/* Footer Support Desk Notice */}
      <footer className="mt-space-12 pt-space-8 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-4 bg-surface p-space-6 rounded-md">
        <div>
          <h3 className="font-semibold text-fg text-body">Have legal or compliance questions?</h3>
          <p className="text-small text-fg-muted">Our compliance desk is available Monday to Saturday, 9 AM – 6 PM IST.</p>
        </div>
        <Link
          href="/contact"
          className="px-space-4 py-space-2 rounded-sm bg-surface-solid border border-border text-fg hover:border-primary text-small font-medium transition-colors focus-ring"
        >
          Contact Legal Desk &rarr;
        </Link>
      </footer>
    </article>
  );
}

/**
 * Basic safe inline formatter for bold text and linebreaks
 */
function renderFormattedText(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
}
