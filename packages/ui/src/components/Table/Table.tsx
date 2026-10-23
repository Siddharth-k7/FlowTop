'use client';

import React from 'react';

export type SortDirection = 'asc' | 'desc';

export interface TableColumn<T> {
  id: string;
  header: React.ReactNode;
  accessor?: (item: T) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey: (item: T) => string;
  caption?: string;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (columnId: string, direction: SortDirection) => void;
  loading?: boolean;
  skeletonRowCount?: number;
  emptyState?: React.ReactNode;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  caption,
  sortColumn,
  sortDirection = 'asc',
  onSort,
  loading = false,
  skeletonRowCount = 5,
  emptyState,
  onRowClick,
  className = '',
}: TableProps<T>) {
  const handleSortClick = (columnId: string) => {
    if (!onSort) return;
    const isCurrent = sortColumn === columnId;
    const nextDirection: SortDirection = isCurrent && sortDirection === 'asc' ? 'desc' : 'asc';
    onSort(columnId, nextDirection);
  };

  return (
    <div
      role="region"
      aria-label={caption || 'Data table'}
      className={`w-full overflow-x-auto rounded-md border border-border bg-surface-solid ${className}`}
    >
      <table className="w-full text-left border-collapse text-small">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-b border-border bg-surface/60">
            {columns.map(col => {
              const isSorted = sortColumn === col.id;
              const ariaSort = !col.sortable
                ? undefined
                : isSorted
                ? sortDirection === 'asc'
                  ? 'ascending'
                  : 'descending'
                : 'none';

              const alignClass =
                col.align === 'right'
                  ? 'text-right'
                  : col.align === 'center'
                  ? 'text-center'
                  : 'text-left';

              return (
                <th
                  key={col.id}
                  scope="col"
                  aria-sort={ariaSort}
                  style={col.width ? { width: col.width } : undefined}
                  className={`p-space-3 font-medium text-fg select-none ${alignClass} ${
                    col.className || ''
                  }`}
                >
                  {col.sortable ? (
                    <button
                      type="button"
                      onClick={() => handleSortClick(col.id)}
                      className={`inline-flex items-center gap-space-2 touch-target py-space-1 px-space-2 -mx-space-2 rounded-sm focus-ring font-medium text-fg hover:text-primary transition-colors ${
                        col.align === 'right' ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <span>{col.header}</span>
                      <span className="text-fg-muted inline-flex items-center" aria-hidden="true">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <svg className="w-space-4 h-space-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                            </svg>
                          ) : (
                            <svg className="w-space-4 h-space-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                          )
                        ) : (
                          <svg className="w-space-4 h-space-4 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        )}
                      </span>
                    </button>
                  ) : (
                    <span>{col.header}</span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>

        <tbody className="divide-y divide-border">
          {loading ? (
            Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
              <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                {columns.map((_col, cIdx) => (
                  <td key={`skeleton-cell-${cIdx}`} className="p-space-3">
                    <div className="h-space-4 bg-grey-200 rounded-sm w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-space-6 text-center text-fg-muted">
                {emptyState || 'No records found.'}
              </td>
            </tr>
          ) : (
            data.map(item => {
              const key = rowKey(item);
              const isClickable = Boolean(onRowClick);

              return (
                <tr
                  key={key}
                  onClick={isClickable ? () => onRowClick?.(item) : undefined}
                  className={`transition-colors ${
                    isClickable ? 'cursor-pointer hover:bg-surface/70 focus-within:bg-surface/70' : 'hover:bg-surface/40'
                  }`}
                >
                  {columns.map((col, colIndex) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    const cellContent = col.accessor
                      ? col.accessor(item)
                      : (item as Record<string, React.ReactNode>)[col.id];

                    return (
                      <td
                        key={col.id}
                        className={`p-space-3 text-fg ${alignClass} ${col.className || ''}`}
                      >
                        {colIndex === 0 && isClickable ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRowClick?.(item);
                            }}
                            className="font-medium text-left text-fg hover:text-primary focus-ring rounded-sm touch-target py-space-1 px-space-1 -mx-space-1 inline-flex items-center"
                          >
                            {cellContent}
                          </button>
                        ) : (
                          cellContent
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
