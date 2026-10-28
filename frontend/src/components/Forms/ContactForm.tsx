'use client';

import React, { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { EMAIL_REGEX, INDIAN_PHONE_REGEX } from '../Checkout/constants';
import { analytics } from '../../lib/analytics';
import { usePublicSettings } from '../../lib/usePublicSettings';
import { buildGeneralWhatsAppUrl } from '../../lib/whatsapp';
import { Button, Spinner } from '@flowtop/ui';
import type { SubmissionResponse } from '../../lib/types-pending';

export interface ContactFormProps {
  className?: string;
  onSuccess?: (res: SubmissionResponse) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  website: string; // Honeypot field (hidden from humans)
}

type FormErrors = Partial<Record<keyof FormState, string>>;

export function ContactForm({ className = '', onSuccess }: ContactFormProps) {
  const { settings } = usePublicSettings();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    website: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmissionResponse | null>(null);

  // Field validation on blur
  const validateField = (field: keyof FormState, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return 'Please enter your full name.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Please enter your email address.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
        return undefined;
      case 'phone': {
        if (!value.trim()) return 'Please enter your mobile number.';
        const cleanPhone = value.replace(/[\s-]/g, '');
        if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
          return 'Please enter a valid 10-digit Indian phone number (with optional +91).';
        }
        return undefined;
      }
      case 'subject':
        if (!value.trim()) return 'Please enter a subject.';
        if (value.trim().length < 3) return 'Subject must be at least 3 characters.';
        return undefined;
      case 'message':
        if (!value.trim()) return 'Please enter your message.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAll = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const fields: (keyof FormState)[] = ['name', 'email', 'phone', 'subject', 'message'];
    for (const f of fields) {
      const err = validateField(f, form[f]);
      if (err) nextErrors[f] = err;
    }
    return nextErrors;
  };

  const handleBlur = (field: keyof FormState) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const err = validateField(field, form[field]);
    setErrors((prev) => ({ ...prev, [field]: err }));
  };

  const handleChange = (field: keyof FormState, val: string) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    // Clear submission error banner when typing
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check honeypot: if filled by a bot, silently discard or reject
    if (form.website.trim().length > 0) {
      // Bot trapped
      setSubmitError('Invalid submission.');
      return;
    }

    // Mark all fields touched and validate
    const allTouched: Record<string, boolean> = {
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true,
    };
    setTouched(allTouched);

    const validationErrors = validateAll();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      // Focus first error field
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`contact-${firstField}`);
      if (el) el.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.submitForm({
        type: 'contact',
        payload: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          website: form.website, // honeypot
        },
      });

      const submission = res.data;

      // CRITICAL ARCHITECTURAL RULE: NEVER show success when saved is false
      if (!submission.saved) {
        setSubmitError(
          submission.message || 'Unable to record your enquiry. Please verify details and try again.'
        );
        return;
      }

      setResult(submission);
      onSuccess?.(submission);

      // Track analytics submission event (NOT a lead)
      analytics.formSubmit({
        formType: 'contact',
        reference: submission.reference,
        emailSent: submission.emailSent,
      });
    } catch (err: unknown) {
      /**
       * CRITICAL ERROR RULE:
       * Keep everything the user typed on any failure.
       * Form state `form` is NOT cleared on error.
       */
      if (err instanceof ApiError) {
        setSubmitError(err.message || 'Submission error. Please try again.');
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unexpected network error occurred. Your entered information is preserved.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Build emergency WhatsApp fallback link if emailSent is false
  const whatsappFallbackHref = settings?.whatsapp?.number && result?.reference
    ? buildGeneralWhatsAppUrl({
        number: settings.whatsapp.number,
        template: `Hi Flowtop, I submitted an enquiry (Ref: ${result.reference}) on the website regarding "${form.subject}".`,
      })
    : undefined;

  // Success view (when saved === true)
  if (result && result.saved) {
    return (
      <div
        className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-xl mx-auto space-y-space-6 ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-space-3">
          <div className="w-10 h-10 rounded-full bg-success-tint flex items-center justify-center text-success flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="font-display font-medium text-title text-fg">
              Enquiry Received
            </h3>
            <p className="text-caption text-fg-muted">
              Reference: <span className="font-mono font-semibold text-fg">{result.reference}</span>
            </p>
          </div>
        </div>

        {/* Honest feedback on saved vs emailSent */}
        {result.emailSent ? (
          <div className="p-space-4 rounded-sm bg-success-tint/30 border border-success/20 text-small text-fg leading-relaxed">
            <p>
              Thank you, <strong className="font-semibold text-fg">{form.name}</strong>. Your enquiry has been routed
              to our architectural concierge. A confirmation email has been dispatched to{' '}
              <span className="font-mono text-fg">{form.email}</span>, and our team will get in touch within 24 hours.
            </p>
          </div>
        ) : (
          <div className="p-space-4 rounded-sm bg-warning-tint border border-warning/30 text-small text-fg space-y-space-2 leading-relaxed">
            <p className="font-medium text-fg">
              We have received your message in our database (Ref: {result.reference}).
            </p>
            <p className="text-fg-muted">
              However, our automated email dispatch service encountered a temporary delivery failure.
              If your request is urgent, please connect directly with our studio via WhatsApp.
            </p>
            {whatsappFallbackHref && (
              <div className="pt-space-2">
                <a
                  href={whatsappFallbackHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-space-2 px-space-4 py-space-2 rounded-pill bg-success text-on-primary text-small font-medium hover:opacity-90 transition-opacity focus-ring"
                >
                  Message on WhatsApp with Ref: {result.reference}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="pt-space-2 border-t border-border flex justify-between items-center text-caption text-fg-muted">
          <span>Flowtop Architectural Brassware</span>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setForm({ name: '', email: '', phone: '', subject: '', message: '', website: '' });
              setTouched({});
              setErrors({});
            }}
            className="text-primary hover:underline font-medium"
          >
            Send another enquiry →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-xl mx-auto space-y-space-5 ${className}`}
    >
      <div>
        <h2 className="font-display font-light text-headline text-fg mb-space-1">
          Contact Our Studio
        </h2>
        <p className="text-small text-fg-muted leading-relaxed">
          Reach our architectural specifications team for residential and commercial enquiries.
        </p>
      </div>

      {/* Error banner on failure */}
      {submitError && (
        <div
          role="alert"
          className="p-space-3 rounded-sm bg-error-tint border border-error/30 text-small text-error flex items-start gap-space-2"
        >
          <span className="flex-shrink-0 mt-0.5">⚠️</span>
          <div>
            <p className="font-medium">Submission could not be completed</p>
            <p className="text-caption mt-0.5 opacity-90">{submitError}</p>
            <p className="text-caption mt-1 text-fg-muted">
              All entered details below have been preserved. You can correct and retry.
            </p>
          </div>
        </div>
      )}

      {/* Honeypot field (hidden from humans, trapped bots fill this) */}
      <div className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <label htmlFor="contact-website">Website (Leave Blank)</label>
        <input
          type="text"
          id="contact-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => handleChange('website', e.target.value)}
        />
      </div>

      {/* Name */}
      <div className="space-y-space-1">
        <label htmlFor="contact-name" className="block text-small font-medium text-fg">
          Full Name <span className="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          disabled={isSubmitting}
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          onBlur={() => handleBlur('name')}
          aria-invalid={touched.name && Boolean(errors.name)}
          aria-describedby={touched.name && errors.name ? 'contact-name-error' : undefined}
          placeholder="e.g. Rohini Mehta"
          className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
            touched.name && errors.name ? 'border-error' : 'border-border-input hover:border-fg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {touched.name && errors.name && (
          <p id="contact-name-error" role="alert" className="text-caption text-error">
            {errors.name}
          </p>
        )}
      </div>

      {/* Grid: Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
        {/* Email */}
        <div className="space-y-space-1">
          <label htmlFor="contact-email" className="block text-small font-medium text-fg">
            Email Address <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            disabled={isSubmitting}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={touched.email && Boolean(errors.email)}
            aria-describedby={touched.email && errors.email ? 'contact-email-error' : undefined}
            placeholder="name@domain.com"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.email && errors.email ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.email && errors.email && (
            <p id="contact-email-error" role="alert" className="text-caption text-error">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="space-y-space-1">
          <label htmlFor="contact-phone" className="block text-small font-medium text-fg">
            Phone Number <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="contact-phone"
            name="phone"
            type="tel"
            disabled={isSubmitting}
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            aria-invalid={touched.phone && Boolean(errors.phone)}
            aria-describedby={touched.phone && errors.phone ? 'contact-phone-error' : undefined}
            placeholder="+91 98765 43210"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.phone && errors.phone ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.phone && errors.phone && (
            <p id="contact-phone-error" role="alert" className="text-caption text-error">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Subject */}
      <div className="space-y-space-1">
        <label htmlFor="contact-subject" className="block text-small font-medium text-fg">
          Subject <span className="text-error" aria-hidden="true">*</span>
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          disabled={isSubmitting}
          value={form.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          onBlur={() => handleBlur('subject')}
          aria-invalid={touched.subject && Boolean(errors.subject)}
          aria-describedby={touched.subject && errors.subject ? 'contact-subject-error' : undefined}
          placeholder="e.g. Specification for Private Villa Project"
          className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
            touched.subject && errors.subject ? 'border-error' : 'border-border-input hover:border-fg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {touched.subject && errors.subject && (
          <p id="contact-subject-error" role="alert" className="text-caption text-error">
            {errors.subject}
          </p>
        )}
      </div>

      {/* Message */}
      <div className="space-y-space-1">
        <label htmlFor="contact-message" className="block text-small font-medium text-fg">
          Message <span className="text-error" aria-hidden="true">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={4}
          disabled={isSubmitting}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          aria-invalid={touched.message && Boolean(errors.message)}
          aria-describedby={touched.message && errors.message ? 'contact-message-error' : undefined}
          placeholder="Share your requirements, timelines or fitting specifications..."
          className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
            touched.message && errors.message ? 'border-error' : 'border-border-input hover:border-fg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {touched.message && errors.message && (
          <p id="contact-message-error" role="alert" className="text-caption text-error">
            {errors.message}
          </p>
        )}
      </div>

      {/* Submit Action */}
      <div className="pt-space-2">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-space-2">
              <Spinner size="sm" />
              <span>Submitting Enquiry...</span>
            </span>
          ) : (
            <span>Send Enquiry →</span>
          )}
        </Button>
      </div>

      <p className="text-caption text-fg-muted text-center">
        Your enquiry is protected by Flowtop Privacy Standards. No unsolicited marketing.
      </p>
    </form>
  );
}
