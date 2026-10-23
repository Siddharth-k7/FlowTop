import React from 'react';
import { Skeleton } from '@flowtop/ui';

export default function Loading() {
  return (
    <div className="w-full max-w-7xl mx-auto px-space-4 md:px-space-6 py-space-8 flex flex-col gap-space-8" aria-busy="true" aria-label="Loading page content">
      {/* Hero Section Skeleton */}
      <div className="w-full h-80 sm:h-96 rounded-md bg-surface border border-border p-space-6 md:p-space-8 flex flex-col justify-end gap-space-4">
        <Skeleton variant="text" className="w-32 h-space-3" />
        <Skeleton variant="text" className="w-3/4 max-w-md h-space-6" />
        <Skeleton variant="text" className="w-1/2 max-w-sm h-space-4" />
        <div className="flex gap-space-3 pt-space-2">
          <Skeleton variant="rectangular" className="w-36 h-touch rounded-sm" />
          <Skeleton variant="rectangular" className="w-36 h-touch rounded-sm" />
        </div>
      </div>

      {/* Featured Grid Section Skeleton */}
      <div className="flex flex-col gap-space-4">
        <div className="flex justify-between items-end border-b border-border pb-space-3">
          <div className="flex flex-col gap-space-2">
            <Skeleton variant="text" className="w-24 h-space-3" />
            <Skeleton variant="text" className="w-48 h-space-5" />
          </div>
          <Skeleton variant="text" className="w-20 h-space-3" />
        </div>

        {/* 4-Column Product/Collection Skeleton Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-md border border-border bg-surface-solid overflow-hidden p-space-3 gap-space-3"
            >
              <Skeleton variant="rectangular" className="w-full h-48 rounded-sm" />
              <div className="flex flex-col gap-space-2">
                <Skeleton variant="text" className="w-3/4 h-space-4" />
                <Skeleton variant="text" className="w-1/2 h-space-3" />
              </div>
              <div className="flex justify-between items-center pt-space-2 border-t border-border mt-auto">
                <Skeleton variant="text" className="w-1/3 h-space-3" />
                <Skeleton variant="circular" className="w-space-6 h-space-6" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
