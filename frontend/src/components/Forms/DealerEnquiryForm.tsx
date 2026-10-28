'use client';

import React, { useState } from 'react';
import { api, ApiError } from '../../lib/api';
import { EMAIL_REGEX, INDIAN_PHONE_REGEX } from '../Checkout/constants';
import { analytics } from '../../lib/analytics';
import { usePublicSettings } from '../../lib/usePublicSettings';
import { buildGeneralWhatsAppUrl } from '../../lib/whatsapp';
import { Button, Spinner } from '@flowtop/ui';
import type { SubmissionResponse } from '../../lib/types-pending';

export interface DealerEnquiryFormProps {
  className?: string;
  onSuccess?: (res: SubmissionResponse) => void;
}

interface FormState {
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  city: string;
  projectType: string;
  requirement: string;
  message: string;
  website: string; // Honeypot field (hidden from humans)
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const ROLES = [
  'Architect / Architectural Firm',
  'Interior Designer / Design Studio',
  'Bath & Kitchen Showroom Dealer',
  'Wholesale Distributor',
  'Luxury Real Estate Developer',
  'MEP / Plumbing Consultant',
  'Hospitality Project Manager',
] as const;

const PROJECT_TYPES = [
  'Luxury Residential Villa / Penthouse',
  'Multi-Unit Premium Apartments',
  'Boutique Hotel / Luxury Resort',
  'Commercial / Corporate Headquarters',
  'Retail Showroom Display / Dealership',
  'Institutional / Architectural Heritage',
] as const;

export function DealerEnquiryForm({ className = '', onSuccess }: DealerEnquiryFormProps) {
  const { settings } = usePublicSettings();
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    city: '',
    projectType: '',
    requirement: '',
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
        if (!value.trim()) return 'Please enter your contact name.';
        if (value.trim().length < 2) return 'Name must be at least 2 characters.';
        return undefined;
      case 'email':
        if (!value.trim()) return 'Please enter your business email.';
        if (!EMAIL_REGEX.test(value.trim())) return 'Please enter a valid email address.';
        return undefined;
      case 'phone': {
        if (!value.trim()) return 'Please enter your phone number.';
        const cleanPhone = value.replace(/[\s-]/g, '');
        if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
          return 'Please enter a valid 10-digit Indian phone number (with optional +91).';
        }
        return undefined;
      }
      case 'company':
        if (!value.trim()) return 'Please enter your company or practice name.';
        return undefined;
      case 'role':
        if (!value.trim()) return 'Please select your professional role.';
        return undefined;
      case 'city':
        if (!value.trim()) return 'Please enter your city/region.';
        return undefined;
      case 'projectType':
        if (!value.trim()) return 'Please select a project type.';
        return undefined;
      case 'requirement':
        if (!value.trim()) return 'Please state your product or project requirement.';
        return undefined;
      case 'message':
        if (!value.trim()) return 'Please enter project details or questions.';
        if (value.trim().length < 10) return 'Message must be at least 10 characters.';
        return undefined;
      default:
        return undefined;
    }
  };

  const validateAll = (): FormErrors => {
    const nextErrors: FormErrors = {};
    const fields: (keyof FormState)[] = [
      'name',
      'email',
      'phone',
      'company',
      'role',
      'city',
      'projectType',
      'requirement',
      'message',
    ];
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
    if (submitError) setSubmitError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Honeypot check: reject bot submissions
    if (form.website.trim().length > 0) {
      setSubmitError('Invalid submission.');
      return;
    }

    // Touch all fields
    const allTouched: Record<string, boolean> = {
      name: true,
      email: true,
      phone: true,
      company: true,
      role: true,
      city: true,
      projectType: true,
      requirement: true,
      message: true,
    };
    setTouched(allTouched);

    const validationErrors = validateAll();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      const firstField = Object.keys(validationErrors)[0];
      const el = document.getElementById(`dealer-${firstField}`);
      if (el) el.focus();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await api.submitForm({
        type: 'dealer',
        payload: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          company: form.company.trim(),
          role: form.role.trim(),
          city: form.city.trim(),
          projectType: form.projectType.trim(),
          requirement: form.requirement.trim(),
          message: form.message.trim(),
          website: form.website, // honeypot
        },
      });

      const submission = res.data;

      // CRITICAL ARCHITECTURAL RULE: NEVER show success when saved is false
      if (!submission.saved) {
        setSubmitError(
          submission.message || 'Unable to record your trade enquiry. Please try again.'
        );
        return;
      }

      setResult(submission);
      onSuccess?.(submission);

      // Track analytics submission (NOT a lead)
      analytics.formSubmit({
        formType: 'dealer',
        reference: submission.reference,
        emailSent: submission.emailSent,
      });
    } catch (err: unknown) {
      /**
       * CRITICAL ERROR RULE:
       * Keep everything the user typed on any failure.
       */
      if (err instanceof ApiError) {
        setSubmitError(err.message || 'Trade submission error. Please try again.');
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Network failure. All entered project specifications are preserved.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappFallbackHref = settings?.whatsapp?.number && result?.reference
    ? buildGeneralWhatsAppUrl({
        number: settings.whatsapp.number,
        template: `Hi Flowtop Trade Desk, I submitted a dealer/trade enquiry (Ref: ${result.reference}) from ${form.company}.`,
      })
    : undefined;

  // Success view (when saved === true)
  if (result && result.saved) {
    return (
      <div
        className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-2xl mx-auto space-y-space-6 ${className}`}
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
              Trade & Dealer Enquiry Recorded
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
              Thank you, <strong className="font-semibold text-fg">{form.name}</strong> from{' '}
              <strong className="font-semibold text-fg">{form.company}</strong>. Your project dossier has been allocated
              to our Senior Architectural Lead. A verification receipt has been dispatched to{' '}
              <span className="font-mono text-fg">{form.email}</span>.
            </p>
          </div>
        ) : (
          <div className="p-space-4 rounded-sm bg-warning-tint border border-warning/30 text-small text-fg space-y-space-2 leading-relaxed">
            <p className="font-medium text-fg">
              We have recorded your trade enquiry in our database (Ref: {result.reference}).
            </p>
            <p className="text-fg-muted">
              However, our automated email dispatch system encountered a temporary delivery outage.
              If you require immediate sample finishes or catalogue specifications, message our trade concierge directly on WhatsApp.
            </p>
            {whatsappFallbackHref && (
              <div className="pt-space-2">
                <a
                  href={whatsappFallbackHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-space-2 px-space-4 py-space-2 rounded-pill bg-success text-on-primary text-small font-medium hover:opacity-90 transition-opacity focus-ring"
                >
                  Message Trade Desk on WhatsApp with Ref: {result.reference}
                </a>
              </div>
            )}
          </div>
        )}

        <div className="pt-space-2 border-t border-border flex justify-between items-center text-caption text-fg-muted">
          <span>Flowtop Trade & Architecture Desk</span>
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setForm({
                name: '',
                email: '',
                phone: '',
                company: '',
                role: '',
                city: '',
                projectType: '',
                requirement: '',
                message: '',
                website: '',
              });
              setTouched({});
              setErrors({});
            }}
            className="text-primary hover:underline font-medium"
          >
            Submit another trade enquiry →
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className={`p-space-8 rounded-lg border border-border bg-surface-solid shadow-sm max-w-2xl mx-auto space-y-space-5 ${className}`}
    >
      <div>
        <h2 className="font-display font-light text-headline text-fg mb-space-1">
          Dealer & Architectural Network
        </h2>
        <p className="text-small text-fg-muted leading-relaxed">
          Partner with Flowtop for trade pricing, showroom displays, custom finishes, and dedicated project specifications.
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
            <p className="font-medium">Trade enquiry could not be processed</p>
            <p className="text-caption mt-0.5 opacity-90">{submitError}</p>
            <p className="text-caption mt-1 text-fg-muted">
              All entered details below are preserved. You can correct and resubmit.
            </p>
          </div>
        </div>
      )}

      {/* Honeypot field (hidden from humans) */}
      <div className="opacity-0 absolute -z-10 w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <label htmlFor="dealer-website">Company Website (Leave Blank)</label>
        <input
          type="text"
          id="dealer-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => handleChange('website', e.target.value)}
        />
      </div>

      {/* Row 1: Name & Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
        <div className="space-y-space-1">
          <label htmlFor="dealer-name" className="block text-small font-medium text-fg">
            Contact Person <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-name"
            name="name"
            type="text"
            disabled={isSubmitting}
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            onBlur={() => handleBlur('name')}
            aria-invalid={touched.name && Boolean(errors.name)}
            aria-describedby={touched.name && errors.name ? 'dealer-name-error' : undefined}
            placeholder="e.g. Ar. Vikram Singhania"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.name && errors.name ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.name && errors.name && (
            <p id="dealer-name-error" role="alert" className="text-caption text-error">
              {errors.name}
            </p>
          )}
        </div>

        <div className="space-y-space-1">
          <label htmlFor="dealer-company" className="block text-small font-medium text-fg">
            Company / Practice Name <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-company"
            name="company"
            type="text"
            disabled={isSubmitting}
            value={form.company}
            onChange={(e) => handleChange('company', e.target.value)}
            onBlur={() => handleBlur('company')}
            aria-invalid={touched.company && Boolean(errors.company)}
            aria-describedby={touched.company && errors.company ? 'dealer-company-error' : undefined}
            placeholder="e.g. Singhania Architects"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.company && errors.company ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.company && errors.company && (
            <p id="dealer-company-error" role="alert" className="text-caption text-error">
              {errors.company}
            </p>
          )}
        </div>
      </div>

      {/* Row 2: Role & City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
        <div className="space-y-space-1">
          <label htmlFor="dealer-role" className="block text-small font-medium text-fg">
            Professional Role <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="dealer-role"
            name="role"
            disabled={isSubmitting}
            value={form.role}
            onChange={(e) => handleChange('role', e.target.value)}
            onBlur={() => handleBlur('role')}
            aria-invalid={touched.role && Boolean(errors.role)}
            aria-describedby={touched.role && errors.role ? 'dealer-role-error' : undefined}
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.role && errors.role ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">Select your role...</option>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          {touched.role && errors.role && (
            <p id="dealer-role-error" role="alert" className="text-caption text-error">
              {errors.role}
            </p>
          )}
        </div>

        <div className="space-y-space-1">
          <label htmlFor="dealer-city" className="block text-small font-medium text-fg">
            City / Operating Region <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-city"
            name="city"
            type="text"
            disabled={isSubmitting}
            value={form.city}
            onChange={(e) => handleChange('city', e.target.value)}
            onBlur={() => handleBlur('city')}
            aria-invalid={touched.city && Boolean(errors.city)}
            aria-describedby={touched.city && errors.city ? 'dealer-city-error' : undefined}
            placeholder="e.g. Mumbai / MMR"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.city && errors.city ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.city && errors.city && (
            <p id="dealer-city-error" role="alert" className="text-caption text-error">
              {errors.city}
            </p>
          )}
        </div>
      </div>

      {/* Row 3: Email & Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
        <div className="space-y-space-1">
          <label htmlFor="dealer-email" className="block text-small font-medium text-fg">
            Business Email <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-email"
            name="email"
            type="email"
            disabled={isSubmitting}
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            onBlur={() => handleBlur('email')}
            aria-invalid={touched.email && Boolean(errors.email)}
            aria-describedby={touched.email && errors.email ? 'dealer-email-error' : undefined}
            placeholder="studio@company.in"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.email && errors.email ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.email && errors.email && (
            <p id="dealer-email-error" role="alert" className="text-caption text-error">
              {errors.email}
            </p>
          )}
        </div>

        <div className="space-y-space-1">
          <label htmlFor="dealer-phone" className="block text-small font-medium text-fg">
            Contact Number <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-phone"
            name="phone"
            type="tel"
            disabled={isSubmitting}
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            onBlur={() => handleBlur('phone')}
            aria-invalid={touched.phone && Boolean(errors.phone)}
            aria-describedby={touched.phone && errors.phone ? 'dealer-phone-error' : undefined}
            placeholder="+91 98765 43210"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.phone && errors.phone ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.phone && errors.phone && (
            <p id="dealer-phone-error" role="alert" className="text-caption text-error">
              {errors.phone}
            </p>
          )}
        </div>
      </div>

      {/* Row 4: Project Type & Requirement */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
        <div className="space-y-space-1">
          <label htmlFor="dealer-projectType" className="block text-small font-medium text-fg">
            Project Type <span className="text-error" aria-hidden="true">*</span>
          </label>
          <select
            id="dealer-projectType"
            name="projectType"
            disabled={isSubmitting}
            value={form.projectType}
            onChange={(e) => handleChange('projectType', e.target.value)}
            onBlur={() => handleBlur('projectType')}
            aria-invalid={touched.projectType && Boolean(errors.projectType)}
            aria-describedby={touched.projectType && errors.projectType ? 'dealer-projectType-error' : undefined}
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.projectType && errors.projectType ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            <option value="">Select project type...</option>
            {PROJECT_TYPES.map((pt) => (
              <option key={pt} value={pt}>
                {pt}
              </option>
            ))}
          </select>
          {touched.projectType && errors.projectType && (
            <p id="dealer-projectType-error" role="alert" className="text-caption text-error">
              {errors.projectType}
            </p>
          )}
        </div>

        <div className="space-y-space-1">
          <label htmlFor="dealer-requirement" className="block text-small font-medium text-fg">
            Requirement Scope <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="dealer-requirement"
            name="requirement"
            type="text"
            disabled={isSubmitting}
            value={form.requirement}
            onChange={(e) => handleChange('requirement', e.target.value)}
            onBlur={() => handleBlur('requirement')}
            aria-invalid={touched.requirement && Boolean(errors.requirement)}
            aria-describedby={touched.requirement && errors.requirement ? 'dealer-requirement-error' : undefined}
            placeholder="e.g. 24 Bath Suites (Aura & Cascade collections)"
            className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
              touched.requirement && errors.requirement ? 'border-error' : 'border-border-input hover:border-fg'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          />
          {touched.requirement && errors.requirement && (
            <p id="dealer-requirement-error" role="alert" className="text-caption text-error">
              {errors.requirement}
            </p>
          )}
        </div>
      </div>

      {/* Message */}
      <div className="space-y-space-1">
        <label htmlFor="dealer-message" className="block text-small font-medium text-fg">
          Project Scope & Notes <span className="text-error" aria-hidden="true">*</span>
        </label>
        <textarea
          id="dealer-message"
          name="message"
          rows={4}
          disabled={isSubmitting}
          value={form.message}
          onChange={(e) => handleChange('message', e.target.value)}
          onBlur={() => handleBlur('message')}
          aria-invalid={touched.message && Boolean(errors.message)}
          aria-describedby={touched.message && errors.message ? 'dealer-message-error' : undefined}
          placeholder="Share site timeline, BOQ specifications, or specific finish samples required..."
          className={`w-full px-space-4 py-space-2.5 rounded-sm border bg-surface-solid text-fg text-body focus-ring transition-colors ${
            touched.message && errors.message ? 'border-error' : 'border-border-input hover:border-fg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {touched.message && errors.message && (
          <p id="dealer-message-error" role="alert" className="text-caption text-error">
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
              <span>Submitting Trade Enquiry...</span>
            </span>
          ) : (
            <span>Submit Trade Enquiry →</span>
          )}
        </Button>
      </div>

      <p className="text-caption text-fg-muted text-center">
        Flowtop Trade Desk provides sample kits, architectural submittals, and dedicated technical support.
      </p>
    </form>
  );
}
