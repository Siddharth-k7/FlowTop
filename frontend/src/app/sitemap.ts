import type { MetadataRoute } from 'next';
import { api } from '../lib/api';

/**
 * Dynamic sitemap.xml generated from Dev B's GET /sitemap-data endpoint
 * Drafts and archived products/content are strictly excluded.
 */
export const revalidate = 3600; // 1 hour ISR for dynamic sitemap

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  // 1. Core Public Landing Pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/collections`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/journal`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/support`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  try {
    const res = await api.getSitemapData();
    const items = res.data?.items || [];

    const dynamicRoutes: MetadataRoute.Sitemap = items.map((item) => {
      let path = '';
      let priority = 0.7;
      let changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] = 'weekly';

      switch (item.type) {
        case 'product':
          path = `/products/${item.slug}`;
          priority = 0.9;
          changeFrequency = 'weekly';
          break;
        case 'category':
          path = `/category/${item.slug}`;
          priority = 0.8;
          changeFrequency = 'weekly';
          break;
        case 'collection':
          path = `/collections/${item.slug}`;
          priority = 0.8;
          changeFrequency = 'weekly';
          break;
        case 'article':
          path = `/journal/${item.slug}`;
          priority = 0.7;
          changeFrequency = 'monthly';
          break;
        case 'page':
          path = `/${item.slug}`;
          priority = 0.6;
          changeFrequency = 'monthly';
          break;
      }

      return {
        url: `${siteUrl}${path}`,
        lastModified: item.updatedAt ? new Date(item.updatedAt) : new Date(),
        changeFrequency,
        priority,
      };
    });

    return [...staticRoutes, ...dynamicRoutes];
  } catch {
    return staticRoutes;
  }
}
