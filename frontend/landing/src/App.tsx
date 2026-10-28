import React, { useEffect } from 'react';
import { Navbar } from '@/components/common/Navbar';
import { Footer } from '@/components/common/Footer';
import { SectionRenderer } from '@/components/sections/SectionRenderer';
import { mockHomepageSections } from '@/mocks/homepageData';

export const App: React.FC = () => {
  // Ensure direct URL navigation with hash (e.g. /#catalogue) lands cleanly below the fixed header
  useEffect(() => {
    const scrollToTarget = () => {
      const hash = window.location.hash;
      if (!hash) return;
      const targetId = hash.replace(/^#/, '');
      const element = document.getElementById(targetId);
      if (element) {
        // Small delay to allow any dynamic elements/layouts to stabilize
        requestAnimationFrame(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        });
      }
    };

    // Run after mount
    const timeout = setTimeout(scrollToTarget, 50);
    window.addEventListener('hashchange', scrollToTarget);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('hashchange', scrollToTarget);
    };
  }, []);

  return (
    <div className="min-h-screen bg-surface-white text-ink flex flex-col font-sans selection:bg-purple-pale selection:text-purple-deep overflow-x-clip min-w-[360px]">
      {/* Accessibility Skip Link */}
      <a
        href="#showroom"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-purple-deep focus:text-white focus:rounded-token-sm focus:shadow-floating"
      >
        Skip to main product showroom
      </a>

      {/* Floating Public Navigation */}
      <Navbar />

      {/* Contract-Driven Homepage Sections */}
      <SectionRenderer sections={mockHomepageSections} />

      {/* Architectural Public Footer */}
      <Footer />
    </div>
  );
};

export default App;
