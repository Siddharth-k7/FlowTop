import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SectionRenderer } from '@flowtop/ui';
import { getPage, resolveSectionData } from '../../lib/pages';
import { isReservedSlug } from '../../lib/reserved-slugs';

import { LegalPageView } from '../../components/Legal/LegalPageView';
import { createBreadcrumbsJsonLd, safeJsonLd } from '../../lib/structured-data';

export const revalidate = 30;

export async function generateStaticParams() {
  return [
    { slug: 'opel-launch' },
    { slug: 'about' },
    { slug: 'manufacturing' },
    { slug: 'quality' },
    { slug: 'privacy' },
    { slug: 'terms' },
    { slug: 'shipping' },
    { slug: 'refunds' },
  ];
}

interface CampaignPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (isReservedSlug(slug)) {
    return {};
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  try {
    const page = await getPage(slug);
    const title = page.seo?.title || page.title || `${page.title} | Flowtop`;
    const description =
      page.seo?.description ||
      'Architectural bath fittings and brassware crafted in India for enduring luxury.';
    const canonical = page.seo?.canonical || `${siteUrl}/${slug}`;
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
    };
  }
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;

  // Protect reserved slugs: static routes win over [slug]
  if (isReservedSlug(slug)) {
    notFound();
  }

  const page = await getPage(slug);
  const data = await resolveSectionData(page.sections);
  const isLegal = page.template === 'legal' || ((!page.sections || page.sections.length === 0) && Boolean(page.content));

  const breadcrumbsJsonLd = createBreadcrumbsJsonLd([
    { label: 'Home', href: 'https://flowtop.in' },
    { label: page.title, href: `https://flowtop.in/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbsJsonLd) }}
      />
      <div className="w-full flex flex-col max-w-full overflow-x-hidden">
        {isLegal ? (
          <LegalPageView page={page} />
        ) : (
          <SectionRenderer sections={page.sections} data={data} />
        )}
      </div>
    </>
  );
}
