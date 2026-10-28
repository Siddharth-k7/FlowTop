import React from 'react';
import type { Metadata } from 'next';
import { api } from '../../lib/api';
import { SupportView } from './SupportView';
import { createBreadcrumbsJsonLd, safeJsonLd } from '../../lib/structured-data';

export const revalidate = 30;

export const metadata: Metadata = {
  title: 'Customer Care & Technical Support | Flowtop',
  description:
    'Architectural care guides, downloadable installation manuals, FAQ accordion, and technical support for Flowtop luxury bath fittings.',
  alternates: {
    canonical: 'https://flowtop.in/support',
  },
  openGraph: {
    title: 'Customer Care & Technical Support | Flowtop',
    description:
      'Access dimensional templates, maintenance manuals, and reach Flowtop architectural technical concierge.',
    url: 'https://flowtop.in/support',
    type: 'website',
  },
};

export default async function SupportPage() {
  const [supportRes, settingsRes] = await Promise.all([
    api.getSupportData().catch(() => ({ data: null })),
    api.getPublicSettings().catch(() => ({ data: null })),
  ]);

  const supportData = supportRes.data || {
    categories: ['General Support'],
    faqs: [],
    manualProductTypes: [],
    manuals: [],
    warrantyNotice: {
      title: 'Warranty Registration',
      standardDurationYears: 10,
      description: 'Flowtop architectural fittings carry a 10-year manufacturer warranty.',
      comingSoonMessage: 'Digital warranty registration is coming soon.',
    },
  };

  const breadcrumbsJsonLd = createBreadcrumbsJsonLd([
    { label: 'Home', href: 'https://flowtop.in' },
    { label: 'Support & Technical Care', href: 'https://flowtop.in/support' },
  ]);

  // Schema.org FAQPage structured data
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: supportData.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbsJsonLd) }}
      />
      {supportData.faqs.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(faqJsonLd) }}
        />
      )}
      <SupportView supportData={supportData} settings={settingsRes.data} />
    </>
  );
}
