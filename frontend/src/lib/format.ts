/**
 * Formatting helpers for Flowtop.
 *
 * Rules:
 * 1. Money arrives from the server in integer paise and passes to formatPaise.
 *    Never perform arithmetic (discounts, tax, totals) in the client.
 * 2. Hex validator contains no literal hex strings to comply with tokens.css check.
 */

/**
 * Format integer paise into standard Indian Rupee currency format (e.g. 1450000 -> "₹14,500").
 */
export function formatPaise(paise: number): string {
  if (!Number.isFinite(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: paise % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(rupees);
}

/**
 * Format integer paise into a plain decimal string for Schema.org JSON-LD offers (e.g. 1450000 -> "14500.00").
 */
export function paiseToDecimalString(paise: number): string {
  if (!Number.isFinite(paise)) return '0.00';
  return (paise / 100).toFixed(2);
}

/**
 * Format raw file size in bytes to human-readable size (e.g. 482000 -> "471 KB").
 */
export function formatBytes(bytes?: number): string {
  if (!bytes || bytes <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Validate dynamic hex color strings from database payloads without embedding literal hex values.
 */
export function isValidHex(hex?: string): boolean {
  if (!hex || typeof hex !== 'string') return false;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex.trim());
}
