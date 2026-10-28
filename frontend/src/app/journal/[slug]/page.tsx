import React from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { api, ApiError } from '../../../lib/api';
import { sanitizeArticleHtml } from '../../../lib/sanitize';
import { Breadcrumbs, Badge } from '@flowtop/ui';
import { ProductCard } from '../../../components/Product/ProductCard';
import { ShareButtons } from '../ShareButtons';
import '../article.css';

export const revalidate = 30;

export async function generateStaticParams() {
  try {
    const res = await api.getJournal({ perPage: 50 });
    return (res.data || []).map((a) => ({ slug: a.slug }));
  } catch {
    return [];
  }
}

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  try {
    const res = await api.getJournalArticleBySlug(slug);
    const article = res.data;
    const title = `${article.title} | Flowtop Journal`;
    const description = article.excerpt;
    const canonical = `${siteUrl}/journal/${slug}`;

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
        type: 'article',
        publishedTime: article.publishedAt,
        authors: [article.author],
        images: article.coverImage ? [{ url: article.coverImage }] : undefined,
      },
    };
  } catch {
    return {
      title: 'Article Not Found | Flowtop',
    };
  }
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export default async function JournalArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

  let article;
  try {
    const res = await api.getJournalArticleBySlug(slug);
    article = res.data;
  } catch (err: unknown) {
    if (err instanceof ApiError && (err.status === 404 || err.code === 'NOT_FOUND')) {
      notFound();
    }
    throw err;
  }

  if (!article) {
    notFound();
  }

  const categorySlug = article.category.toLowerCase().replace(/\s+/g, '-');
  const sanitizedBody = sanitizeArticleHtml(article.contentHtml);
  const articleUrl = `${siteUrl}/journal/${article.slug}`;

  // Safe JSON-LD Serialization (escaping '<' to prevent XSS breakout)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    image: article.coverImage ? [article.coverImage] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.publishedAt,
    author: {
      '@type': 'Person',
      name: article.author,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Flowtop',
      url: siteUrl,
    },
    description: article.excerpt,
  };

  const safeJsonLdString = JSON.stringify(jsonLd).replace(/</g, '\\u003c');

  return (
    <article className="w-full flex flex-col py-space-6 md:py-space-8 max-w-full overflow-x-hidden">
      {/* Article Schema.org JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLdString }}
      />

      <div className="container-page flex flex-col gap-space-6 md:gap-space-8 w-full">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Journal', href: '/journal' },
            { label: article.category, href: `/journal?category=${categorySlug}` },
            { label: article.title },
          ]}
        />

        {/* Article Header & Headline (Solitary h1 on page) */}
        <header className="max-w-measure mx-auto w-full flex flex-col gap-space-4 pt-space-2 text-left">
          <div className="flex items-center gap-space-3">
            <Badge variant="primary">{article.category}</Badge>
            <span className="text-small text-fg-muted font-medium">
              {article.readTimeMinutes} min read
            </span>
          </div>

          <h1 className="text-display font-display font-normal tracking-tight text-fg leading-tight">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-space-4 gap-y-space-1 text-small text-fg-muted border-b border-border pb-space-4">
            <span className="font-medium text-fg">{article.author}</span>
            <span aria-hidden="true">&bull;</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
          </div>
        </header>

        {/* Hero Image */}
        {article.coverImage && (
          <div className="max-w-4xl mx-auto w-full overflow-hidden rounded-lg shadow-sm border border-border bg-surface-solid aspect-[16/9]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Editorial Body (rendered only through sanitizeArticleHtml) */}
        <div
          className="article-content w-full"
          dangerouslySetInnerHTML={{ __html: sanitizedBody }}
        />

        {/* Share Actions */}
        <div className="max-w-measure mx-auto w-full">
          <ShareButtons
            title={article.title}
            url={articleUrl}
            excerpt={article.excerpt}
          />
        </div>

        {/* Related Products Section (omitted when empty) */}
        {Array.isArray(article.relatedProducts) && article.relatedProducts.length > 0 && (
          <section className="max-w-4xl mx-auto w-full mt-space-8 pt-space-8 border-t border-border flex flex-col gap-space-6">
            <div className="flex flex-col gap-space-1">
              <span className="text-caption font-semibold uppercase tracking-wide text-primary">
                Associated Products
              </span>
              <h2 className="text-title md:text-headline font-display text-fg">
                Featured in this article
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-space-4">
              {article.relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
