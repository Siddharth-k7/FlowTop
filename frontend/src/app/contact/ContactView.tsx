'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ContactForm, DealerEnquiryForm } from '../../components/Forms';
import { usePublicSettings } from '../../lib/usePublicSettings';
import { buildGeneralWhatsAppUrl } from '../../lib/whatsapp';

export function ContactView() {
  const searchParams = useSearchParams();
  const initialType = searchParams?.get('type') === 'dealer' ? 'dealer' : 'contact';
  const [activeTab, setActiveTab] = useState<'contact' | 'dealer'>(initialType);
  const { settings } = usePublicSettings();

  useEffect(() => {
    const type = searchParams?.get('type');
    if (type === 'dealer') {
      setActiveTab('dealer');
    } else if (type === 'contact') {
      setActiveTab('contact');
    }
  }, [searchParams]);

  const whatsappHref = settings?.whatsapp?.number
    ? buildGeneralWhatsAppUrl({
        number: settings.whatsapp.number,
        template: settings.whatsapp.generalTemplate || "Hi, I'd like to know more about Flowtop products.",
      })
    : undefined;

  return (
    <div className="min-h-screen bg-surface py-space-8 md:py-space-12 px-space-4 sm:px-space-6 lg:px-space-8">
      <div className="max-w-5xl mx-auto">
        {/* Header Header */}
        <div className="text-center max-w-2xl mx-auto mb-space-8 md:mb-space-10">
          <span className="text-caption font-semibold tracking-wider uppercase text-primary mb-space-2 inline-block">
            Concierge & Trade Network
          </span>
          <h1 className="font-display font-light text-display md:text-headline text-fg mb-space-3">
            Get in touch with Flowtop
          </h1>
          <p className="text-body text-fg-muted leading-relaxed">
            Whether specifying fixtures for an architectural masterwork or requesting dealer partnerships,
            our specialists ensure seamless execution.
          </p>
        </div>

        {/* Tab Switch */}
        <div className="flex justify-center mb-space-8">
          <div
            role="tablist"
            aria-label="Enquiry Type"
            className="inline-flex p-1 rounded-pill bg-surface-solid border border-border shadow-xs"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'contact'}
              onClick={() => setActiveTab('contact')}
              className={`px-space-6 py-space-2 rounded-pill text-small font-medium transition-all focus-ring ${
                activeTab === 'contact'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              General & Product Enquiry
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'dealer'}
              onClick={() => setActiveTab('dealer')}
              className={`px-space-6 py-space-2 rounded-pill text-small font-medium transition-all focus-ring ${
                activeTab === 'dealer'
                  ? 'bg-primary text-on-primary shadow-xs'
                  : 'text-fg-muted hover:text-fg'
              }`}
            >
              Architect & Dealer Network
            </button>
          </div>
        </div>

        {/* Form Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 items-start">
          <div className="lg:col-span-8">
            {activeTab === 'contact' ? (
              <ContactForm />
            ) : (
              <DealerEnquiryForm />
            )}
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-space-6">
            {/* Direct Studio Contact */}
            <div className="p-space-6 rounded-lg border border-border bg-surface-solid shadow-xs space-y-space-4">
              <h2 className="font-display font-medium text-title text-fg">
                Experience Studios
              </h2>
              <div className="space-y-space-3 text-small text-fg-muted leading-relaxed">
                <div>
                  <p className="font-semibold text-fg">Mumbai Flagship</p>
                  <p>Worli Sea Face, Ground Gallery, Mumbai, Maharashtra 400018</p>
                </div>
                <div className="pt-space-2 border-t border-border">
                  <p className="font-semibold text-fg">New Delhi Studio</p>
                  <p>Defence Colony Architectural Arcade, New Delhi 110024</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Concierge Banner */}
            {whatsappHref && (
              <div className="p-space-6 rounded-lg border border-success/30 bg-success-tint/20 shadow-xs space-y-space-3">
                <div className="flex items-center gap-space-2 text-success font-medium text-small">
                  <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
                  <span>Immediate Concierge Support</span>
                </div>
                <p className="text-small text-fg leading-relaxed">
                  Need rapid availability checks or finishing advice? Message our studio specialists directly.
                </p>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full px-space-4 py-space-2.5 rounded-pill bg-success text-on-primary font-medium text-small hover:opacity-90 transition-opacity focus-ring"
                >
                  Chat with Concierge on WhatsApp →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
