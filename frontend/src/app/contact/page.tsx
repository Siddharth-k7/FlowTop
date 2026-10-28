import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { ContactView } from './ContactView';

export const metadata: Metadata = {
  title: 'Contact & Architectural Trade Desk | Flowtop',
  description:
    'Connect with Flowtop for residential enquiries, architectural specifications, dealer partnerships, and bespoke brassware finishes.',
  alternates: {
    canonical: 'https://flowtop.in/contact',
  },
};

export const revalidate = 30;

export default function ContactPage() {
  return (
    <Suspense
      fallback={
        <div className="py-space-12 text-center text-small text-fg-muted">
          Loading enquiry desk...
        </div>
      }
    >
      <ContactView />
    </Suspense>
  );
}
