import type { CtaSectionConfig } from './types';
import { SectionShell } from './SectionShell';
import { safeHref } from './safeHref';
import { buttonClasses } from '../components/Button';

export interface DocumentAsset {
  filename: string;
  mimeType: string;
  sizeBytes: number;
  url: string;
}

export interface CtaSectionProps {
  config: CtaSectionConfig;
  documentAsset?: DocumentAsset | null;
  className?: string;
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatMimeType(mime: string, filename: string): string {
  if (mime.includes('pdf') || filename.endsWith('.pdf')) return 'PDF Document';
  if (mime.includes('zip') || filename.endsWith('.zip')) return 'Archive Package';
  if (mime.includes('dwg') || filename.endsWith('.dwg')) return 'CAD Drawing';
  if (mime.includes('bim') || filename.endsWith('.rfa')) return 'BIM Family Model';
  return 'Technical Document';
}

/**
 * CTA Section Component
 *
 * Requirements:
 * - Heading and optional body
 * - Mode: "button" -> Action CTA link
 * - Mode: "download" -> Real download link with download attribute, rel="noopener",
 *   displaying file name, type and size
 * - Neither button nor document: renders text only with NO dead button
 * - 44px touch targets and focus rings
 */
export function CtaSection({
  config,
  documentAsset,
  className = '',
}: CtaSectionProps) {
  const headingId = `cta-heading-${config.heading.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;
  const safeButtonUrl = config.cta ? safeHref(config.cta.href) : null;

  const isButtonMode = config.mode === 'button' && Boolean(config.cta && safeButtonUrl);
  const isDownloadMode = config.mode === 'download' && Boolean(documentAsset && documentAsset.url);

  const isDarkBg = config.layout?.background === 'black' || config.layout?.background === 'deep';

  return (
    <SectionShell layout={config.layout} headingId={headingId} className={className}>
      <div className="flex flex-col items-center text-center max-w-2xl mx-auto w-full">
        {/* Section Heading */}
        <h2
          id={headingId}
          className={`font-display font-light text-headline md:text-display tracking-tight mb-space-3 leading-tight ${
            isDarkBg ? 'text-white' : 'text-fg'
          }`}
        >
          {config.heading}
        </h2>

        {/* Optional Body */}
        {config.body && (
          <p
            className={`text-body leading-relaxed max-w-measure mb-space-6 ${
              isDarkBg ? 'text-white/90' : 'text-fg-muted'
            }`}
          >
            {config.body}
          </p>
        )}

        {/* Action: Button Mode */}
        {isButtonMode && config.cta && safeButtonUrl && (
          <div className="pt-space-2">
            <a
              href={safeButtonUrl}
              className={buttonClasses({
                variant: config.cta.style === 'secondary' ? 'secondary' : 'primary',
                size: 'lg',
              })}
            >
              {config.cta.label}
            </a>
          </div>
        )}

        {/* Action: Document Download Mode */}
        {isDownloadMode && documentAsset && (
          <div className="pt-space-2">
            <a
              href={documentAsset.url}
              download={documentAsset.filename}
              rel="noopener"
              className="inline-flex items-center gap-space-3 px-space-6 py-space-3 rounded-sm bg-primary text-white hover:bg-primary/90 focus-ring font-medium shadow-sm min-h-touch transition-colors"
              aria-label={`Download ${documentAsset.filename} (${formatMimeType(documentAsset.mimeType, documentAsset.filename)}, ${formatFileSize(documentAsset.sizeBytes)})`}
            >
              {/* Document Download SVG Icon */}
              <svg
                className="w-5 h-5 text-white shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <div className="flex flex-col text-left">
                <span className="text-small font-medium leading-none mb-space-1">
                  {documentAsset.filename}
                </span>
                <span className="text-caption text-white/80 leading-none">
                  {formatMimeType(documentAsset.mimeType, documentAsset.filename)} • {formatFileSize(documentAsset.sizeBytes)}
                </span>
              </div>
            </a>
          </div>
        )}

        {/* Neither button nor document: No dead button is rendered */}
      </div>
    </SectionShell>
  );
}
