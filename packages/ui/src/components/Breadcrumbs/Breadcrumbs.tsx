import React from 'react';

export interface BreadcrumbItem {
  label: React.ReactNode;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
}

export const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ items, separator, className = '', ...props }, ref) => {
    if (!items || items.length === 0) return null;

    const defaultSeparator = (
      <svg
        className="w-space-4 h-space-4 text-muted shrink-0"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    );

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={`flex items-center text-small text-muted ${className}`}
        {...props}
      >
        <ol className="flex items-center gap-space-2 flex-wrap">
          {items.map((item, idx) => {
            const isLast = idx === items.length - 1;

            return (
              <li key={idx} className="inline-flex items-center gap-space-2">
                {idx > 0 && (
                  <span className="select-none" aria-hidden="true">
                    {separator || defaultSeparator}
                  </span>
                )}
                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={
                      isLast
                        ? 'font-medium text-primary select-none'
                        : 'text-muted'
                    }
                  >
                    {item.label}
                  </span>
                ) : (
                  <a
                    href={item.href}
                    className="text-muted hover:text-primary focus-ring rounded-sm touch-target py-space-1 px-space-1 -mx-space-1 inline-flex items-center transition-colors"
                  >
                    {item.label}
                  </a>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }
);

Breadcrumbs.displayName = 'Breadcrumbs';
