'use client';

import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  /** Returns a real URL for a given page, ensuring navigation works without JavaScript. */
  getHref: (page: number) => string;
  /** Optional interactive callback to intercept clicks for client-side routing or state updates. */
  onPageChange?: (page: number) => void;
  siblingCount?: number;
  className?: string;
  'aria-label'?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  getHref,
  onPageChange,
  siblingCount = 1,
  className = '',
  'aria-label': ariaLabel = 'Pagination',
}) => {
  if (totalPages <= 1) return null;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      e.preventDefault();
      return;
    }
    if (onPageChange) {
      e.preventDefault();
      onPageChange(page);
    }
  };

  // Generate pagination items with ellipses
  const getPageNumbers = (): (number | '...')[] => {
    const totalNumbers = siblingCount * 2 + 5; // siblingCount + first + last + current + 2 dots
    if (totalPages <= totalNumbers) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, '...', totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [1, '...', ...rightRange];
    }

    const middleRange = Array.from(
      { length: rightSiblingIndex - leftSiblingIndex + 1 },
      (_, i) => leftSiblingIndex + i
    );
    return [1, '...', ...middleRange, '...', totalPages];
  };

  const pages = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <nav
      role="navigation"
      aria-label={ariaLabel}
      className={`flex items-center justify-center gap-space-1 ${className}`}
    >
      <ul className="flex items-center flex-wrap gap-space-1 list-none p-0 m-0">
        {/* Previous page link */}
        <li>
          {hasPrev ? (
            <a
              href={getHref(currentPage - 1)}
              onClick={(e) => handleClick(e, currentPage - 1)}
              rel="prev"
              className="min-w-touch min-h-touch px-space-3 flex items-center justify-center text-small font-medium text-text-primary rounded-sm hover:bg-purple-pale transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Go to previous page"
            >
              Previous
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="min-w-touch min-h-touch px-space-3 flex items-center justify-center text-small font-medium text-text-muted opacity-40 cursor-not-allowed select-none"
            >
              Previous
            </span>
          )}
        </li>

        {/* Page links and dots */}
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <li key={`ellipsis-${index}`}>
                <span
                  aria-hidden="true"
                  className="min-w-touch min-h-touch flex items-center justify-center text-small text-text-muted select-none"
                >
                  &hellip;
                </span>
              </li>
            );
          }

          const isCurrent = page === currentPage;

          return (
            <li key={page}>
              <a
                href={getHref(page)}
                onClick={(e) => handleClick(e, page)}
                aria-current={isCurrent ? 'page' : undefined}
                className={[
                  'min-w-touch min-h-touch px-space-3 flex items-center justify-center text-small rounded-sm font-medium transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring',
                  isCurrent
                    ? 'bg-primary text-on-primary font-semibold'
                    : 'text-text-primary hover:bg-purple-pale',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label={`Page ${page}`}
              >
                {page}
              </a>
            </li>
          );
        })}

        {/* Next page link */}
        <li>
          {hasNext ? (
            <a
              href={getHref(currentPage + 1)}
              onClick={(e) => handleClick(e, currentPage + 1)}
              rel="next"
              className="min-w-touch min-h-touch px-space-3 flex items-center justify-center text-small font-medium text-text-primary rounded-sm hover:bg-purple-pale transition-colors duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
              aria-label="Go to next page"
            >
              Next
            </a>
          ) : (
            <span
              aria-disabled="true"
              className="min-w-touch min-h-touch px-space-3 flex items-center justify-center text-small font-medium text-text-muted opacity-40 cursor-not-allowed select-none"
            >
              Next
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
};
