import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Flowtop | Premium Bath Fittings',
  description: 'Architectural bath fittings and brassware crafted for enduring luxury.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-surface text-primary antialiased min-h-screen">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-space-4 focus:left-space-4 focus:z-skip-link focus:bg-white focus:text-primary focus:p-space-3 focus:rounded-sm focus-ring shadow-md"
        >
          Skip to main content
        </a>
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
