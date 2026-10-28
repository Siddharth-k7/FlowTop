'use client';

import React, { useState } from 'react';
import { Button } from '@flowtop/ui';
import type { CheckoutContact } from '../../lib/types-pending';
import { EMAIL_REGEX, INDIAN_PHONE_REGEX } from './constants';

export interface ContactStepProps {
  initialValues: CheckoutContact;
  onSubmit: (contact: CheckoutContact) => void;
  className?: string;
}

export function ContactStep({ initialValues, onSubmit, className = '' }: ContactStepProps) {
  const [name, setName] = useState(initialValues.name);
  const [email, setEmail] = useState(initialValues.email);
  const [phone, setPhone] = useState(initialValues.phone);

  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  const validate = (): boolean => {
    const newErrors: { name?: string; email?: string; phone?: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (minimum 2 characters)';
    }

    if (!email.trim() || !EMAIL_REGEX.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address for order notifications';
    }

    const cleanPhone = phone.trim().replace(/[\s-]/g, '');
    if (!cleanPhone || !INDIAN_PHONE_REGEX.test(cleanPhone)) {
      newErrors.phone = 'Please enter a valid 10-digit Indian phone number (e.g. +91 98765 43210)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-space-6 ${className}`}>
      {/* Step Header */}
      <div>
        <h2 className="font-display font-medium text-title text-fg">Contact Information</h2>
        <p className="text-small text-fg-muted mt-space-1">
          Guest checkout. We will send your digital receipt, tracking details, and structural warranty
          certificate to this address.
        </p>
      </div>

      <div className="space-y-space-4">
        {/* Full Name */}
        <div>
          <label htmlFor="checkout-name" className="block text-small font-medium text-fg mb-space-1.5">
            Full Name <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="checkout-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="e.g. Arjun Sharma"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'checkout-name-error' : undefined}
            className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors ${
              errors.name ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
            }`}
          />
          {errors.name && (
            <p id="checkout-name-error" className="text-caption text-error mt-space-1" role="alert">
              {errors.name}
            </p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label htmlFor="checkout-email" className="block text-small font-medium text-fg mb-space-1.5">
            Email Address <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="checkout-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="e.g. arjun.sharma@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'checkout-email-error' : undefined}
            className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors ${
              errors.email ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
            }`}
          />
          {errors.email && (
            <p id="checkout-email-error" className="text-caption text-error mt-space-1" role="alert">
              {errors.email}
            </p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="checkout-phone" className="block text-small font-medium text-fg mb-space-1.5">
            Phone Number (for White-Glove Logistics) <span className="text-error" aria-hidden="true">*</span>
          </label>
          <div className="relative">
            <input
              id="checkout-phone"
              name="phone"
              type="tel"
              required
              autoComplete="tel"
              placeholder="+91 98765 43210"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
              }}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? 'checkout-phone-error' : 'checkout-phone-hint'}
              className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors ${
                errors.phone ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
              }`}
            />
          </div>
          {errors.phone ? (
            <p id="checkout-phone-error" className="text-caption text-error mt-space-1" role="alert">
              {errors.phone}
            </p>
          ) : (
            <p id="checkout-phone-hint" className="text-caption text-fg-muted mt-space-1">
              Indian 10-digit mobile number with optional +91 prefix
            </p>
          )}
        </div>
      </div>

      {/* Reassurance Banner */}
      <div className="p-space-3 rounded-sm bg-surface border border-border text-caption text-fg-muted flex items-center gap-space-2">
        <svg
          className="w-space-4 h-space-4 text-primary shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Your data is protected. Guest checkout never shares or markets your personal details.</span>
      </div>

      {/* Submit Action */}
      <div className="pt-space-2">
        <Button variant="primary" size="lg" type="submit" className="w-full sm:w-auto px-space-8 font-medium">
          Continue to Delivery →
        </Button>
      </div>
    </form>
  );
}
