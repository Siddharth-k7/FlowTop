import type { Metadata, Viewport } from 'next';
import './globals.css';
import { getNavigation } from '../lib/navigation';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Flowtop | Premium Bath Fittings',
  description: 'Architectural bath fittings and brassware crafted in India for enduring luxury.',
};

// Every public page is static and regenerated in the background (ISR). This is
// the floor even when the build-time navigation fetch fails and falls back to
// the seed fixtures, so a backend outage at build time heals within the window.
// Must be a literal (Next reads it statically) and equal PUBLIC_REVALIDATE_SECONDS
// in lib/api.ts; scripts/check-static-routes.mjs checks both.
export const revalidate = 300;

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
    <html lang="en" className="h-full">
      <body className="min-h-screen flex flex-col bg-surface text-fg antialiased max-w-full overflow-x-hidden">
        {/* Skip to Content link (first focusable element) */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-space-4 focus:left-space-4 focus:z-skip-link focus:bg-surface-solid focus:text-fg focus:p-space-3 focus:rounded-sm focus-ring shadow-md font-medium text-small"
        >
          Skip to main content
        </a>

        <Providers>
          {/* Header */}
          <Header items={navData.header.items} cartCount={navData.header.cartCount} />

          {/* Main Landmark */}
          <main id="main" className="flex-1 w-full flex flex-col">
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
