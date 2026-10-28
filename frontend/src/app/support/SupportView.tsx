'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@flowtop/ui';
import type { SupportDataResponse, PublicSettingsResponse } from '../../lib/types-pending';
import { trackEvent } from '../../lib/analytics';
import { buildGeneralWhatsAppUrl } from '../../lib/whatsapp';
import { api } from '../../lib/api';

interface SupportViewProps {
  supportData: SupportDataResponse;
  settings?: PublicSettingsResponse | null;
}

export function SupportView({ supportData, settings }: SupportViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [openFaqId, setOpenFaqId] = useState<string | null>('faq-01');
  const [faqSearchQuery, setFaqSearchQuery] = useState<string>('');

  // Support Form State
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [formMessage, setFormMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // WhatsApp Support URL
  const whatsappNumber = settings?.whatsapp?.number || '+918025200000';
  const whatsappTemplate =
    settings?.whatsapp?.generalTemplate ||
    'Hello Flowtop Care Concierge, I need technical guidance regarding an architectural fitting.';
  const whatsappUrl = buildGeneralWhatsAppUrl({
    number: whatsappNumber,
    template: whatsappTemplate,
  });

  const handleWhatsAppClick = () => {
    trackEvent('whatsapp_click', {
      placement: 'support_page',
    });
  };

  const handleManualDownload = (manual: { id: string; title: string; fileType: string }) => {
    trackEvent('document_download', {
      id: manual.id,
      name: manual.title,
      documentType: manual.fileType,
    });
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

  // Filter FAQs
  const filteredFaqs = supportData.faqs.filter((faq) => {
    const matchesCategory =
      selectedCategory === 'All Categories' || faq.category === selectedCategory;
    const matchesSearch =
      faqSearchQuery.trim() === '' ||
      faq.question.toLowerCase().includes(faqSearchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(faqSearchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Form Submit
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formSubmitting) return;

    if (honeypot) {
      // Silently discard bot submissions
      setFormSuccess(true);
      return;
    }

    if (!formName.trim() || !formEmail.trim() || !formMessage.trim()) {
      setFormError('Please complete your name, email address, and inquiry details.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      const res = await api.submitForm({
        type: 'contact',
        payload: {
          inquiryType: 'support',
          name: formName.trim(),
          email: formEmail.trim(),
          phone: formPhone.trim(),
          product: formProduct.trim(),
          message: formMessage.trim(),
        },
      });

      if (res.data?.saved) {
        setFormSuccess(true);
        trackEvent('form_submit', {
          formType: 'support',
          reference: res.data.reference,
          emailSent: res.data.emailSent,
        });
      } else {
        setFormError('Unable to register inquiry. Please reach us via WhatsApp or phone.');
      }
    } catch {
      setFormError('Network communication failed. Please check your connection or contact us via WhatsApp.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-space-4 sm:px-space-6 py-space-8 md:py-space-12">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="mb-space-6 text-caption text-fg-muted">
        <ol className="flex items-center gap-space-2">
          <li>
            <Link href="/" className="hover:text-primary transition-colors focus-ring">
              Home
            </Link>
          </li>
          <li aria-hidden="true">&rsaquo;</li>
          <li aria-current="page" className="text-fg font-medium">
            Support &amp; Technical Care
          </li>
        </ol>
      </nav>

      {/* Header */}
      <header className="mb-space-10 border-b border-border pb-space-8">
        <div className="max-w-3xl">
          <span className="text-caption font-semibold uppercase tracking-wider text-purple-deep mb-space-2 block">
            Flowtop Client Concierge
          </span>
          <h1 className="text-headline sm:text-display font-display font-semibold text-fg tracking-tight mb-space-3">
            Customer Care &amp; Technical Support
          </h1>
          <p className="text-body text-fg-muted leading-relaxed">
            Access installation templates, technical CAD manuals, PVD maintenance instructions, and reach our dedicated Bengaluru architectural technical desk.
          </p>
        </div>

        {/* Quick Action Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-4 mt-space-6">
          {/* WhatsApp Support */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleWhatsAppClick}
            className="flex items-center gap-space-3 p-space-4 rounded-md border border-border bg-surface-solid hover:border-primary hover:shadow-sm transition-all focus-ring"
            aria-label="Chat with Flowtop Technical Support on WhatsApp"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-small shrink-0">
              WA
            </div>
            <div>
              <div className="font-semibold text-fg text-small">WhatsApp Support</div>
              <div className="text-caption text-fg-muted">Direct architectural concierge</div>
            </div>
          </a>

          {/* Direct Phone */}
          <a
            href="tel:+918025200000"
            className="flex items-center gap-space-3 p-space-4 rounded-md border border-border bg-surface-solid hover:border-primary hover:shadow-sm transition-all focus-ring"
          >
            <div className="w-10 h-10 rounded-full bg-purple-pale text-purple-deep flex items-center justify-center font-bold text-small shrink-0">
              PH
            </div>
            <div>
              <div className="font-semibold text-fg text-small">+91 80 2520 0000</div>
              <div className="text-caption text-fg-muted">Mon–Sat, 9 AM – 6 PM IST</div>
            </div>
          </a>

          {/* Technical Desk Email */}
          <a
            href="mailto:care@flowtop.in"
            className="flex items-center gap-space-3 p-space-4 rounded-md border border-border bg-surface-solid hover:border-primary hover:shadow-sm transition-all focus-ring"
          >
            <div className="w-10 h-10 rounded-full bg-surface text-fg flex items-center justify-center font-bold text-small shrink-0 border border-border">
              @
            </div>
            <div>
              <div className="font-semibold text-fg text-small">care@flowtop.in</div>
              <div className="text-caption text-fg-muted">Responses within 4 business hours</div>
            </div>
          </a>
        </div>
      </header>

      {/* Prominent Warranty Coming Soon Banner */}
      <section
        className="mb-space-12 p-space-6 rounded-md border border-purple-deep/30 bg-purple-pale text-purple-deep flex flex-col md:flex-row items-start md:items-center justify-between gap-space-4 shadow-sm"
        aria-labelledby="warranty-heading"
      >
        <div className="flex flex-col gap-space-1 max-w-2xl">
          <div className="flex items-center gap-space-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-deep animate-pulse" aria-hidden="true" />
            <h2 id="warranty-heading" className="text-small font-semibold uppercase tracking-wider text-purple-deep">
              {supportData.warrantyNotice.title}
            </h2>
          </div>
          <p className="text-small text-fg leading-relaxed">
            {supportData.warrantyNotice.description}
          </p>
          <p className="text-caption text-fg-muted font-medium">
            {supportData.warrantyNotice.comingSoonMessage}
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-block px-space-3 py-space-1.5 rounded-pill bg-purple-deep text-white text-caption font-semibold tracking-wide uppercase">
            10-Year Active Coverage
          </span>
        </div>
      </section>

      {/* SECTION 1: CMS-Managed FAQ Accordion */}
      <section className="mb-space-16" aria-labelledby="faqs-heading">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-4 mb-space-6 border-b border-border pb-space-4">
          <div>
            <h2 id="faqs-heading" className="text-title font-display font-semibold text-fg tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-small text-fg-muted mt-space-1">
              Specification, plumbing compatibility, finish care, and warranty policies.
            </p>
          </div>

          {/* Search Input */}
          <div className="w-full md:w-72">
            <label htmlFor="faq-search" className="sr-only">
              Search FAQs
            </label>
            <input
              id="faq-search"
              type="search"
              value={faqSearchQuery}
              onChange={(e) => setFaqSearchQuery(e.target.value)}
              placeholder="Search questions..."
              className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg placeholder:text-fg-muted"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div
          className="flex flex-wrap gap-space-2 mb-space-6"
          role="tablist"
          aria-label="FAQ Categories"
        >
          {supportData.categories.map((category) => {
            const isSelected = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setSelectedCategory(category)}
                className={`px-space-3 py-space-1.5 text-small rounded-sm border transition-colors focus-ring font-medium ${
                  isSelected
                    ? 'bg-purple-deep text-white border-purple-deep'
                    : 'bg-surface-solid text-fg hover:border-primary border-border'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* Accordion List */}
        <div className="flex flex-col border border-border rounded-md divide-y divide-border bg-surface-solid overflow-hidden">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const contentId = `faq-answer-${faq.id}`;
              const buttonId = `faq-button-${faq.id}`;

              return (
                <div key={faq.id} className="transition-colors">
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={contentId}
                      onClick={() => toggleFaq(faq.id)}
                      className="w-full py-space-4 px-space-5 flex items-center justify-between gap-space-4 text-left font-display font-medium text-fg text-body hover:bg-surface focus-ring transition-colors"
                    >
                      <span className="flex-1 pr-space-2">{faq.question}</span>
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center border border-border text-fg-muted text-caption font-bold shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 bg-surface' : ''
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                    </button>
                  </h3>
                  {isOpen && (
                    <div
                      id={contentId}
                      role="region"
                      aria-labelledby={buttonId}
                      className="px-space-5 pb-space-5 pt-space-1 text-small text-fg leading-relaxed bg-surface/40 border-t border-border/40"
                    >
                      <p>{faq.answer}</p>
                      <div className="mt-space-3 pt-space-2 border-t border-border/30 text-caption text-fg-muted flex items-center gap-space-2">
                        <span>Category:</span>
                        <span className="font-medium text-fg">{faq.category}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-space-8 text-center text-small text-fg-muted">
              No questions found matching your search. Try adjusting keywords or contact our team directly.
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: Downloadable Manuals & Care Guides */}
      <section className="mb-space-16" aria-labelledby="manuals-heading">
        <div className="mb-space-6 border-b border-border pb-space-4">
          <h2 id="manuals-heading" className="text-title font-display font-semibold text-fg tracking-tight">
            Downloadable Installation Manuals &amp; Guides
          </h2>
          <p className="text-small text-fg-muted mt-space-1">
            Official dimensional templates, rough-in schematics, and PVD finish care documentation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-space-6">
          {supportData.manualProductTypes.map((productType) => {
            const items = supportData.manuals.filter((m) => m.productType === productType);
            if (items.length === 0) return null;

            return (
              <div
                key={productType}
                className="flex flex-col border border-border rounded-md bg-surface-solid overflow-hidden p-space-5 shadow-sm"
              >
                <div className="flex items-center gap-space-2 border-b border-border pb-space-3 mb-space-4">
                  <span className="w-2 h-2 rounded-full bg-primary" aria-hidden="true" />
                  <h3 className="font-semibold text-fg text-body font-display">{productType}</h3>
                </div>

                <div className="flex flex-col gap-space-3">
                  {items.map((manual) => (
                    <div
                      key={manual.id}
                      className="flex items-center justify-between gap-space-3 p-space-3 rounded-sm border border-border/70 hover:border-primary transition-colors bg-surface/30"
                    >
                      <div className="flex flex-col flex-1 min-w-0 pr-space-2">
                        <span className="text-small font-medium text-fg truncate">
                          {manual.title}
                        </span>
                        <span className="text-caption text-fg-muted">
                          {manual.fileType} &bull; {manual.fileSize}
                        </span>
                      </div>
                      <a
                        href={manual.downloadUrl}
                        download
                        onClick={() => handleManualDownload(manual)}
                        className="px-space-3 py-space-1.5 rounded-sm bg-surface-solid border border-border hover:border-primary text-small font-medium text-fg transition-colors focus-ring shrink-0 flex items-center gap-space-1.5"
                        aria-label={`Download ${manual.title} (${manual.fileSize})`}
                      >
                        <span aria-hidden="true">&darr;</span>
                        <span>PDF</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 3: Technical Support Contact Form */}
      <section className="border border-border rounded-md bg-surface p-space-6 md:p-space-8 shadow-sm" aria-labelledby="form-heading">
        <div className="max-w-2xl mb-space-6">
          <span className="text-caption font-semibold uppercase tracking-wider text-purple-deep mb-space-1 block">
            Direct Technical Inquiry
          </span>
          <h2 id="form-heading" className="text-title font-display font-semibold text-fg tracking-tight">
            Contact the Flowtop Engineering Desk
          </h2>
          <p className="text-small text-fg-muted mt-space-1">
            Need site-specific rough-in guidance or warranty validation? Submit your project query below.
          </p>
        </div>

        {formSuccess ? (
          <div
            className="p-space-6 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-col gap-space-2"
            role="status"
          >
            <h3 className="font-semibold text-body">Support Inquiry Submitted</h3>
            <p className="text-small text-emerald-900 leading-relaxed">
              Thank you. Your technical support ticket has been registered. An engineering specialist will review your project parameters and respond within 4 business hours.
            </p>
            <Button
              variant="secondary"
              className="self-start mt-space-2"
              onClick={() => {
                setFormSuccess(false);
                setFormMessage('');
              }}
            >
              Submit Another Inquiry
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSupportSubmit} className="flex flex-col gap-space-4 max-w-2xl" noValidate>
            {/* Honeypot field */}
            <div className="hidden" aria-hidden="true">
              <label htmlFor="company_code_hp">Leave empty</label>
              <input
                id="company_code_hp"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {formError && (
              <div className="p-space-3 rounded-sm bg-red-50 border border-red-300 text-red-900 text-small" role="alert">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
              <div>
                <label htmlFor="support-name" className="block text-small font-medium text-fg mb-space-1">
                  Full Name <span className="text-primary">*</span>
                </label>
                <input
                  id="support-name"
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Architect / Homeowner Name"
                  className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg"
                />
              </div>

              <div>
                <label htmlFor="support-email" className="block text-small font-medium text-fg mb-space-1">
                  Email Address <span className="text-primary">*</span>
                </label>
                <input
                  id="support-email"
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
              <div>
                <label htmlFor="support-phone" className="block text-small font-medium text-fg mb-space-1">
                  Phone / WhatsApp
                </label>
                <input
                  id="support-phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg"
                />
              </div>

              <div>
                <label htmlFor="support-product" className="block text-small font-medium text-fg mb-space-1">
                  Product / SKU Reference
                </label>
                <input
                  id="support-product"
                  type="text"
                  value={formProduct}
                  onChange={(e) => setFormProduct(e.target.value)}
                  placeholder="e.g. Aura Tall Basin Mixer (FT-AUR-BM-01)"
                  className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg"
                />
              </div>
            </div>

            <div>
              <label htmlFor="support-message" className="block text-small font-medium text-fg mb-space-1">
                Details of Technical Inquiry <span className="text-primary">*</span>
              </label>
              <textarea
                id="support-message"
                required
                rows={4}
                value={formMessage}
                onChange={(e) => setFormMessage(e.target.value)}
                placeholder="Describe water pressure parameters, rough-in questions, or maintenance support needed..."
                className="w-full px-space-3 py-space-2 text-small rounded-sm border border-border bg-surface-solid focus-ring text-fg"
              />
            </div>

            <div className="pt-space-2 flex items-center justify-between">
              <Button type="submit" variant="primary" disabled={formSubmitting}>
                {formSubmitting ? 'Registering...' : 'Submit Support Request'}
              </Button>
              <span className="text-caption text-fg-muted">
                Protected by Flowtop Privacy Guarantee. Zero Spam.
              </span>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
