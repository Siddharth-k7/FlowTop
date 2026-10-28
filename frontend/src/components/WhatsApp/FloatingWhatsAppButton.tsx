'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { usePublicSettings } from '../../lib/usePublicSettings';
import { buildGeneralWhatsAppUrl } from '../../lib/whatsapp';
import { analytics } from '../../lib/analytics';

/**
 * FloatingWhatsAppButton
 *
 * Requirements:
 * 1. Present on every public page, bottom-right corner.
 * 2. Positioned above mobile sticky bars (e.g. bottom-20 on mobile, bottom-8 on desktop).
 * 3. HIDDEN ON CHECKOUT (checkout flow must remain focused with zero distractions).
 * 4. WhatsApp number retrieved from GET /settings/public - NEVER hardcoded.
 * 5. Fires an analytics click event. A WhatsApp click is strictly a click, NEVER a lead.
 */
export function FloatingWhatsAppButton() {
  const pathname = usePathname();
  const { settings } = usePublicSettings();

  // Hide on checkout flow
  if (pathname && pathname.startsWith('/checkout')) {
    return null;
  }

  // Do not render until public settings are loaded
  if (!settings?.whatsapp?.number) {
    return null;
  }

  const href = buildGeneralWhatsAppUrl({
    number: settings.whatsapp.number,
    template: settings.whatsapp.generalTemplate || "Hi, I'd like to know more about Flowtop products.",
  });

  const handleClick = () => {
    // Analytics event: whatsapp_click (NOT a lead)
    analytics.whatsAppClick({
      placement: 'floating_button',
    });
  };

  return (
    <div
      className="fixed bottom-20 md:bottom-space-8 right-space-4 md:right-space-8 z-fixed flex items-center group pointer-events-auto"
      role="region"
      aria-label="WhatsApp Concierge"
    >
      {/* Tooltip on hover/focus */}
      <div className="hidden lg:flex items-center mr-space-3 px-space-3 py-space-1.5 rounded-pill bg-surface-inverse text-on-surface-inverse text-caption font-medium opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-base shadow-md pointer-events-none whitespace-nowrap">
        <span>Chat with Concierge</span>
      </div>

      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="w-13 h-13 md:w-14 md:h-14 rounded-full bg-success text-on-primary flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-base focus-ring touch-target"
        aria-label="Chat with Flowtop Concierge on WhatsApp (opens in new tab)"
      >
        {/* WhatsApp Icon */}
        <svg
          className="w-7 h-7 fill-current"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12.031 2C6.505 2 2.016 6.488 2.016 12.015c0 1.954.561 3.82 1.626 5.419L2 22l4.721-1.603a9.98 9.98 0 005.31 1.618h.004c5.524 0 10.015-4.489 10.015-10.016 0-2.677-1.043-5.195-2.936-7.087C17.222 3.039 14.704 2 12.031 2zm5.823 14.168c-.244.686-1.42 1.31-1.959 1.391-.512.077-1.168.109-3.754-.962-3.155-1.306-5.184-4.512-5.34-4.722-.157-.209-1.282-1.704-1.282-3.25 0-1.547.81-2.308 1.098-2.622.287-.314.628-.393.837-.393.209 0 .419.002.602.011.194.009.454-.073.71.541.263.63 1.022 2.493 1.111 2.676.089.183.149.398.029.637-.119.239-.179.387-.358.597-.18.21-.378.468-.54.629-.18.179-.367.373-.158.732.209.359.93 1.534 1.996 2.483 1.369 1.219 2.523 1.597 2.882 1.776.359.179.569.15.779-.09.21-.239.897-1.047 1.137-1.406.239-.359.478-.3.799-.18.322.12 2.037.961 2.387 1.136.35.175.583.262.668.409.085.147.085.852-.159 1.538z" />
        </svg>
      </a>
    </div>
  );
}
