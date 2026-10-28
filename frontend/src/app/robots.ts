import type { MetadataRoute } from 'next';

/**
 * Dynamic robots.txt configuration
 * Blocks admin, checkout, cart, and internal API routes from search crawlers.
 */
export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/admin/*', '/checkout', '/checkout/*', '/cart', '/api/*'],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
