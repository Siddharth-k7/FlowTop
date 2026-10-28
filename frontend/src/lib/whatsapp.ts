/**
 * Flowtop WhatsApp URL & Message Formatter
 *
 * Requirements:
 * 1. Number and template come from GET /settings/public (NEVER hardcoded).
 * 2. Replaces {productName}, {sku}, {finish}, {url}.
 * 3. URL-encode properly via encodeURIComponent (handles ampersands '&', non-ASCII, accents, symbols).
 * 4. Generates clean https://wa.me/{cleanPhone}?text={encodedText}.
 */

export interface ProductWhatsAppContext {
  productName: string;
  sku: string;
  finish?: string | null;
  url?: string | null;
}

export function cleanWhatsAppNumber(number: string): string {
  return number.replace(/[^\d]/g, '');
}

export function buildProductWhatsAppText(
  template: string,
  product: ProductWhatsAppContext
): string {
  const finishText = product.finish && product.finish.trim() ? product.finish.trim() : 'Standard Finish';
  const urlText = product.url && product.url.trim() ? product.url.trim() : '';

  return template
    .replace('{productName}', product.productName)
    .replace('{sku}', product.sku)
    .replace('{finish}', finishText)
    .replace('{url}', urlText)
    .trim();
}

export function buildProductWhatsAppUrl(params: {
  number: string;
  template: string;
  product: ProductWhatsAppContext;
}): string {
  const cleanPhone = cleanWhatsAppNumber(params.number);
  const text = buildProductWhatsAppText(params.template, params.product);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildGeneralWhatsAppUrl(params: {
  number: string;
  template: string;
}): string {
  const cleanPhone = cleanWhatsAppNumber(params.number);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(params.template.trim())}`;
}
