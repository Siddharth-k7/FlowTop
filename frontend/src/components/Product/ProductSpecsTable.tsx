import React from 'react';
import type { ProductSpecification } from '../../lib/types-pending';

export interface GroupedSpecContract {
  group?: string | null;
  items: {
    name: string;
    value: string;
    unit?: string | null;
  }[];
}

export type RawSpecifications =
  | GroupedSpecContract[]
  | ProductSpecification[]
  | (ProductSpecification & { name?: string })[];

export interface ProductSpecsTableProps {
  specifications?: RawSpecifications | null;
}

interface NormalizedSpecItem {
  name: string;
  value: string;
  unit?: string | null;
}

interface NormalizedGroup {
  group?: string | null;
  items: NormalizedSpecItem[];
}

export function ProductSpecsTable({ specifications }: ProductSpecsTableProps) {
  if (!specifications || !Array.isArray(specifications) || specifications.length === 0) {
    return null;
  }

  // 1. Normalize specifications into groups
  const groups: NormalizedGroup[] = [];

  const firstEntry = specifications[0] as unknown as Record<string, unknown>;

  if (firstEntry && 'items' in firstEntry && Array.isArray(firstEntry.items)) {
    // Contract grouped shape: [{ group?: string, items: [{ name, value, unit }] }]
    (specifications as GroupedSpecContract[]).forEach((grp) => {
      const validItems = (grp.items || [])
        .map((item) => ({
          name: (item.name || '').trim(),
          value: (item.value || '').trim(),
          unit: item.unit ? item.unit.trim() : null,
        }))
        // Filter out any row with a blank name or value, never add a dash
        .filter((item) => item.name.length > 0 && item.value.length > 0);

      if (validItems.length > 0) {
        groups.push({
          group: grp.group ? grp.group.trim() : null,
          items: validItems,
        });
      }
    });
  } else {
    // Mock flat shape: [{ key, label, value, unit }] or [{ name, value, unit }]
    const validItems = (specifications as (ProductSpecification & { name?: string })[])
      .map((item) => ({
        name: (item.label || item.name || item.key || '').trim(),
        value: (item.value || '').trim(),
        unit: item.unit ? item.unit.trim() : null,
      }))
      // Filter out any row with a blank name or value, never add a dash
      .filter((item) => item.name.length > 0 && item.value.length > 0);

    if (validItems.length > 0) {
      groups.push({
        group: null,
        items: validItems,
      });
    }
  }

  // If no specifications remain after filtering, hide the section entirely
  if (groups.length === 0) {
    return null;
  }

  const hasGroups = groups.some((g) => Boolean(g.group));

  return (
    <section
      aria-labelledby="specs-heading"
      className="mt-space-8 pt-space-8 border-t border-border"
    >
      <h2
        id="specs-heading"
        className="font-display font-light text-headline tracking-tight text-fg mb-space-4"
      >
        Specifications
      </h2>

      <div className="overflow-x-auto rounded-md border border-border bg-surface-solid shadow-sm">
        <table className="w-full text-left border-collapse">
          <caption className="sr-only">Product technical specifications</caption>
          <tbody>
            {groups.map((grp, gIdx) => (
              <React.Fragment key={grp.group || `grp-${gIdx}`}>
                {/* Group header row only if group is sent by API */}
                {hasGroups && grp.group && (
                  <tr>
                    <th
                      colSpan={2}
                      scope="colgroup"
                      className="bg-surface font-semibold text-small text-fg py-space-3 px-space-4 border-b border-border"
                    >
                      {grp.group}
                    </th>
                  </tr>
                )}

                {/* Specification item rows */}
                {grp.items.map((item, itemIdx) => (
                  <tr
                    key={`${item.name}-${itemIdx}`}
                    className="hover:bg-surface/50 transition-colors"
                  >
                    <th
                      scope="row"
                      className="w-1/3 md:w-1/4 py-space-3 px-space-4 font-medium text-small text-fg-muted border-b border-border/60 align-top"
                    >
                      {item.name}
                    </th>
                    <td className="py-space-3 px-space-4 text-small text-fg border-b border-border/60 align-top">
                      {item.value}
                      {item.unit ? ` ${item.unit}` : ''}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
