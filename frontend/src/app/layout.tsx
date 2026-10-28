import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { getNavigation } from '../lib/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Providers } from './providers';

// Self-hosted fonts: preload only the two weights actually used (400 regular, 600 semibold), font-display: swap
const flowtopBodyFont = localFont({
  src: [
    {
      path: '../../public/fonts/flowtop-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/flowtop-semibold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-body-face',
});

const flowtopDisplayFont = localFont({
  src: [
    {
      path: '../../public/fonts/flowtop-regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/flowtop-semibold.woff2',
      weight: '600',
      style: 'normal',
    },
  ],
  display: 'swap',
  preload: true,
  variable: '--font-display-face',
});

import { createOrganizationJsonLd, safeJsonLd } from '../lib/structured-data';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://flowtop.in';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Flowtop | Architectural Bathfittings',
    template: '%s',
  },
  description:
    'Architectural luxury bath fittings and precision brassware crafted in India for enduring spaces.',
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Flowtop',
    title: 'Flowtop | Architectural Bathfittings',
    description:
      'Architectural luxury bath fittings and precision brassware crafted in India for enduring spaces.',
    images: [
      {
        url: '/images/og-share-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Flowtop Architectural Bathfittings',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@flowtop',
    creator: '@flowtop',
    title: 'Flowtop | Architectural Bathfittings',
    description:
      'Architectural luxury bath fittings and precision brassware crafted in India for enduring spaces.',
    images: ['/images/og-share-default.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Every public page is static and regenerated in the background (ISR). This is
// the floor even when the build-time navigation fetch fails and falls back to
// the seed fixtures, so a backend outage at build time heals within the window.
// Must be a literal (Next reads it statically) and equal PUBLIC_REVALIDATE_SECONDS
// in lib/api.ts; scripts/check-static-routes.mjs checks both.
export const revalidate = 30;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const navData = await getNavigation();

  return (
    <html
      lang="en"
      className={`${flowtopBodyFont.variable} ${flowtopDisplayFont.variable} h-full`}
    >
      <body className="min-h-screen flex flex-col bg-surface text-fg antialiased max-w-full overflow-x-hidden">
        {/* Skip to Content link (first focusable element) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-space-4 focus:left-space-4 focus:z-skip-link focus:bg-surface-solid focus:text-fg focus:p-space-3 focus:rounded-sm focus-ring shadow-md font-medium text-small"
        >
          Skip to main content
        </a>

        {/* Organization Structured Data (JSON-LD) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(createOrganizationJsonLd(siteUrl)) }}
        />

        <Providers>
          {/* Header */}
          <Header items={navData.header.items} cartCount={navData.header.cartCount} />

          {/* Main Landmark */}
          <main id="main" tabIndex={-1} className="flex-1 w-full flex flex-col focus:outline-none">
            {children}
          </main>

          {/* Footer */}
          <Footer
            columns={navData.footer.columns}
            socialLinks={navData.footer.socialLinks}
            legalNotice={navData.footer.legalNotice}
          />
        </Providers>
      </body>
    </html>
  );
}
