import React from 'react';
import { formatBytes } from '../../lib/format';

export interface ProductDocumentItem {
  id?: string;
  name?: string;
  title?: string;
  url: string;
  sizeBytes?: number;
  type?: string;
  fileType?: string;
}

export interface ProductDocumentsProps {
  documents?: ProductDocumentItem[] | null;
}

export function ProductDocuments({ documents }: ProductDocumentsProps) {
  if (!documents || !Array.isArray(documents) || documents.length === 0) {
    return null;
  }

  // Filter out any entries without URL or title/name
  const validDocs = documents.filter((doc) => Boolean(doc.url && (doc.name || doc.title)));

  if (validDocs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="documents-heading"
      className="mt-space-8 pt-space-8 border-t border-border"
    >
      <h2
        id="documents-heading"
        className="font-display font-light text-headline tracking-tight text-fg mb-space-4"
      >
        Downloads & Documents
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-4">
        {validDocs.map((doc, idx) => {
          const docName = doc.name || doc.title || 'Technical Document';
          const docType = (doc.type || doc.fileType || 'PDF').toUpperCase();
          const docSize = doc.sizeBytes ? formatBytes(doc.sizeBytes) : '';

          return (
            <a
              key={doc.id || doc.url || idx}
              href={doc.url}
              target="_blank"
              rel="noopener"
              className="flex items-center justify-between p-space-4 rounded-md border border-border bg-surface-solid hover:bg-surface hover:shadow-sm focus-ring transition-all group"
            >
              <div className="flex items-center gap-space-3 min-w-0">
                {/* Document Icon */}
                <div className="w-10 h-10 rounded-sm bg-primary-tint/50 text-primary flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                <div className="flex flex-col min-w-0">
                  <span className="font-medium text-small text-fg group-hover:text-primary transition-colors truncate">
                    {docName}
                  </span>
                  <div className="flex items-center gap-space-2 text-caption text-text-muted">
                    <span className="font-semibold">{docType}</span>
                    {docSize && (
                      <>
                        <span>•</span>
                        <span>{docSize}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Download / Open Arrow */}
              <div className="text-text-muted group-hover:text-primary transition-colors ml-space-3 flex-shrink-0">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
