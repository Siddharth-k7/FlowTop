import type { Metadata } from 'next';
import { SectionRenderer } from '@flowtop/ui';
import { getPage, resolveSectionData } from '../lib/pages';

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  try {
    const page = await getPage('');
    const title = page.seo?.title || page.title || 'Flowtop | Architectural Bathfittings';
    const description =
      page.seo?.description ||
      'Premium bathfittings and brassware crafted in India for enduring architectural luxury.';
    const canonical = page.seo?.canonical || siteUrl;
    const shareImageUrl = page.seo?.shareImage?.url
      ? page.seo.shareImage.url.startsWith('http')
        ? page.seo.shareImage.url
        : `${siteUrl}${page.seo.shareImage.url.startsWith('/') ? '' : '/'}${page.seo.shareImage.url}`
      : undefined;

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        url: canonical,
        siteName: 'Flowtop',
        images: shareImageUrl ? [{ url: shareImageUrl }] : undefined,
        type: 'website',
      },
    };
  } catch {
    return {
      title: 'Flowtop | Architectural Bathfittings',
      description: 'Premium bathfittings and brassware crafted in India for enduring architectural luxury.',
    };
  }
}

export default async function HomePage() {
  const page = await getPage('');
  const data = await resolveSectionData(page.sections);

  return (
    <div className="w-full flex flex-col max-w-full overflow-x-hidden">
      <SectionRenderer sections={page.sections} data={data} />
    </div>
  );
}
