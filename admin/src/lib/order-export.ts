/** The CSV download uses the same filters as the order list. */
export function orderExportPath(filters: Record<string, string>, search: string): string {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  const qs = params.toString();
  return qs ? `/admin/orders/export?${qs}` : '/admin/orders/export';
}
