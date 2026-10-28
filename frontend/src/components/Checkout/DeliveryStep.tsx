'use client';

import React, { useState } from 'react';
import { Button } from '@flowtop/ui';
import type { CheckoutDelivery } from '../../lib/types-pending';
import { INDIAN_STATES, PIN_CODE_REGEX } from './constants';

export interface DeliveryStepProps {
  initialValues: CheckoutDelivery;
  onSubmit: (delivery: CheckoutDelivery) => void;
  onBack: () => void;
  className?: string;
}

export function DeliveryStep({
  initialValues,
  onSubmit,
  onBack,
  className = '',
}: DeliveryStepProps) {
  const [addressLine1, setAddressLine1] = useState(initialValues.addressLine1);
  const [addressLine2, setAddressLine2] = useState(initialValues.addressLine2 || '');
  const [city, setCity] = useState(initialValues.city);
  const [state, setState] = useState(initialValues.state || 'Maharashtra');
  const [pin, setPin] = useState(initialValues.pin);
  const [landmark, setLandmark] = useState(initialValues.landmark || '');
  const [notes, setNotes] = useState(initialValues.notes || '');

  const [errors, setErrors] = useState<{
    addressLine1?: string;
    city?: string;
    state?: string;
    pin?: string;
  }>({});

  const validate = (): boolean => {
    const newErrors: {
      addressLine1?: string;
      city?: string;
      state?: string;
      pin?: string;
    } = {};

    if (!addressLine1.trim() || addressLine1.trim().length < 5) {
      newErrors.addressLine1 = 'Please enter your street address or building details';
    }

    if (!city.trim() || city.trim().length < 2) {
      newErrors.city = 'Please enter your city';
    }

    if (!state.trim()) {
      newErrors.state = 'Please select your state or union territory';
    }

    const cleanPin = pin.trim();
    if (!cleanPin || !PIN_CODE_REGEX.test(cleanPin)) {
      newErrors.pin = 'Please enter a valid 6-digit Indian PIN code (e.g. 110001)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        addressLine1: addressLine1.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        pin: pin.trim(),
        landmark: landmark.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className={`space-y-space-6 ${className}`}>
      {/* Step Header */}
      <div>
        <h2 className="font-display font-medium text-title text-fg">Delivery Address</h2>
        <p className="text-small text-fg-muted mt-space-1">
          White-glove insured delivery across India. Hand-checked and custom packed in foam cradle crates.
        </p>
      </div>

      <div className="space-y-space-4">
        {/* Address Line 1 */}
        <div>
          <label htmlFor="checkout-address1" className="block text-small font-medium text-fg mb-space-1.5">
            Address Line 1 <span className="text-error" aria-hidden="true">*</span>
          </label>
          <input
            id="checkout-address1"
            name="addressLine1"
            type="text"
            required
            autoComplete="address-line1"
            placeholder="Flat / Villa No., Building Name, Street / Road"
            value={addressLine1}
            onChange={(e) => {
              setAddressLine1(e.target.value);
              if (errors.addressLine1) setErrors((prev) => ({ ...prev, addressLine1: undefined }));
            }}
            aria-invalid={Boolean(errors.addressLine1)}
            aria-describedby={errors.addressLine1 ? 'checkout-address1-error' : undefined}
            className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors ${
              errors.addressLine1 ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
            }`}
          />
          {errors.addressLine1 && (
            <p id="checkout-address1-error" className="text-caption text-error mt-space-1" role="alert">
              {errors.addressLine1}
            </p>
          )}
        </div>

        {/* Address Line 2 */}
        <div>
          <label htmlFor="checkout-address2" className="block text-small font-medium text-fg mb-space-1.5">
            Address Line 2 <span className="text-caption text-fg-muted font-normal">(Optional)</span>
          </label>
          <input
            id="checkout-address2"
            name="addressLine2"
            type="text"
            autoComplete="address-line2"
            placeholder="Apartment, suite, tower, wing"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
            className="w-full px-space-4 py-space-2.5 rounded-sm border border-border-input hover:border-fg text-body text-fg bg-surface-solid focus-ring transition-colors"
          />
        </div>

        {/* City and State Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
          {/* City */}
          <div>
            <label htmlFor="checkout-city" className="block text-small font-medium text-fg mb-space-1.5">
              City <span className="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-city"
              name="city"
              type="text"
              required
              autoComplete="address-level2"
              placeholder="e.g. Mumbai / Bengaluru"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                if (errors.city) setErrors((prev) => ({ ...prev, city: undefined }));
              }}
              aria-invalid={Boolean(errors.city)}
              aria-describedby={errors.city ? 'checkout-city-error' : undefined}
              className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors ${
                errors.city ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
              }`}
            />
            {errors.city && (
              <p id="checkout-city-error" className="text-caption text-error mt-space-1" role="alert">
                {errors.city}
              </p>
            )}
          </div>

          {/* State Dropdown */}
          <div>
            <label htmlFor="checkout-state" className="block text-small font-medium text-fg mb-space-1.5">
              State / Union Territory <span className="text-error" aria-hidden="true">*</span>
            </label>
            <div className="relative">
              <select
                id="checkout-state"
                name="state"
                required
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  if (errors.state) setErrors((prev) => ({ ...prev, state: undefined }));
                }}
                aria-invalid={Boolean(errors.state)}
                aria-describedby={errors.state ? 'checkout-state-error' : undefined}
                className="w-full appearance-none px-space-4 py-space-2.5 pr-space-10 rounded-sm border border-border-input hover:border-fg text-body text-fg bg-surface-solid focus-ring transition-colors"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-space-3 text-fg-muted" aria-hidden="true">
                <svg className="w-space-4 h-space-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
            {errors.state && (
              <p id="checkout-state-error" className="text-caption text-error mt-space-1" role="alert">
                {errors.state}
              </p>
            )}
          </div>
        </div>

        {/* PIN Code and Landmark Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-space-4">
          {/* PIN Code */}
          <div>
            <label htmlFor="checkout-pin" className="block text-small font-medium text-fg mb-space-1.5">
              PIN Code (6 Digits) <span className="text-error" aria-hidden="true">*</span>
            </label>
            <input
              id="checkout-pin"
              name="pin"
              type="text"
              required
              maxLength={6}
              autoComplete="postal-code"
              placeholder="e.g. 400001"
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                if (errors.pin) setErrors((prev) => ({ ...prev, pin: undefined }));
              }}
              aria-invalid={Boolean(errors.pin)}
              aria-describedby={errors.pin ? 'checkout-pin-error' : undefined}
              className={`w-full px-space-4 py-space-2.5 rounded-sm border text-body text-fg bg-surface-solid focus-ring transition-colors font-mono ${
                errors.pin ? 'border-error ring-1 ring-error' : 'border-border-input hover:border-fg'
              }`}
            />
            {errors.pin && (
              <p id="checkout-pin-error" className="text-caption text-error mt-space-1" role="alert">
                {errors.pin}
              </p>
            )}
          </div>

          {/* Landmark */}
          <div>
            <label htmlFor="checkout-landmark" className="block text-small font-medium text-fg mb-space-1.5">
              Landmark <span className="text-caption text-fg-muted font-normal">(Optional)</span>
            </label>
            <input
              id="checkout-landmark"
              name="landmark"
              type="text"
              placeholder="e.g. Near Grand Hyatt"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              className="w-full px-space-4 py-space-2.5 rounded-sm border border-border-input hover:border-fg text-body text-fg bg-surface-solid focus-ring transition-colors"
            />
          </div>
        </div>

        {/* Delivery Notes */}
        <div>
          <label htmlFor="checkout-notes" className="block text-small font-medium text-fg mb-space-1.5">
            Delivery Notes <span className="text-caption text-fg-muted font-normal">(Optional)</span>
          </label>
          <textarea
            id="checkout-notes"
            name="notes"
            rows={2}
            placeholder="Special site access notes, gate security code, or preferred delivery timing"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-space-4 py-space-2.5 rounded-sm border border-border-input hover:border-fg text-body text-fg bg-surface-solid focus-ring transition-colors resize-none"
          />
        </div>
      </div>

      {/* Button Actions */}
      <div className="pt-space-4 flex items-center justify-between gap-space-4">
        <button
          type="button"
          onClick={onBack}
          className="text-small font-medium text-fg-muted hover:text-primary transition-colors focus-ring rounded-sm py-space-2"
        >
          ← Back to Contact
        </button>

        <Button variant="primary" size="lg" type="submit" className="px-space-8 font-medium">
          Continue to Review →
        </Button>
      </div>
    </form>
  );
}
