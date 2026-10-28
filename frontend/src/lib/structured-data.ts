/**
 * Structured Data (JSON-LD) Generators for Flowtop
 *
 * Implements schema.org standards for:
 * - Organization (Site & Brand identity)
 * - BreadcrumbList (Hierarchical page trails)
 * - Product (Catalogue fixtures with Sedal / lead-free specifications)
 * - Article (Editorial journal stories)
 *
 * All serializers escape '<' to '\u003c' to prevent script breakout attacks.
 */

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

/**
 * Escapes characters for safe embedding inside <script type="application/ld+json">
 */
export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/**
 * Generates schema.org/Organization data for Flowtop
 */
export function createOrganizationJsonLd(siteUrl: string = 'https://flowtop.in') {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Flowtop',
    legalName: 'Flowtop Bath Fittings Pvt. Ltd.',
    url: siteUrl,
    logo: `${siteUrl}/images/flowtop-logo.png`,
    description:
      'Architectural luxury bath fittings and precision brassware crafted in India for enduring spaces.',
    sameAs: [
      'https://www.instagram.com/flowtop.in',
      'https://www.linkedin.com/company/flowtop',
    ],
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+91-98765-43210',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['en', 'hi'],
      },
    ],
  };
}

/**
 * Generates schema.org/BreadcrumbList from breadcrumb items
 */
export function createBreadcrumbsJsonLd(
  items: BreadcrumbItem[],
  siteUrl: string = 'https://flowtop.in'
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => {
      const position = index + 1;
      const fullUrl = item.href
        ? item.href.startsWith('http')
          ? item.href
          : `${siteUrl}${item.href.startsWith('/') ? '' : '/'}${item.href}`
        : siteUrl;

      return {
        '@type': 'ListItem',
        position,
        name: item.label,
        item: fullUrl,
      };
    }),
  };
}
