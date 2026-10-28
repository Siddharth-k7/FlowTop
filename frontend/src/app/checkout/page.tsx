'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '../../components/Cart';
import { api, ApiError } from '../../lib/api';
import { useToast } from '@flowtop/ui';
import type {
  CheckoutContact,
  CheckoutDelivery,
  OrderDetailResponse,
} from '../../lib/types-pending';
import {
  CheckoutStepper,
  type CheckoutStep,
  ContactStep,
  DeliveryStep,
  ReviewStep,
  PaymentPollingView,
  ConfirmationView,
  FailureView,
} from '../../components/Checkout';
import { formatPaise } from '../../lib/format';
import { analytics } from '../../lib/analytics';

type ViewMode = 'steps' | 'polling' | 'confirmed' | 'failed';

function CheckoutContent() {
  const searchParams = useSearchParams();
  const { cart, isLoading: isCartLoading, refreshCart } = useCart();

  let toast: ReturnType<typeof useToast> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    toast = useToast();
  } catch {
    toast = null;
  }

  // 1. Wizard Steps & State
  const [step, setStep] = useState<CheckoutStep>(1);
  const [viewMode, setViewMode] = useState<ViewMode>('steps');
  const [orderReference, setOrderReference] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderDetailResponse | null>(null);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Data
  const [contact, setContact] = useState<CheckoutContact>({
    name: '',
    email: '',
    phone: '',
  });

  const [delivery, setDelivery] = useState<CheckoutDelivery>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: 'Maharashtra',
    pin: '',
    landmark: '',
    notes: '',
  });

  // 2. Gateway Redirect URL Handling
  // CRITICAL RULE: Even if the gateway redirects with ?reference=FT-12345,
  // NEVER trust any URL status. We unconditionally enter 'polling' mode to verify server-side.
  useEffect(() => {
    const refParam = searchParams.get('reference');
    if (refParam) {
      setOrderReference(refParam);
      setViewMode('polling');
    }
  }, [searchParams]);

  // Handle Step 1 Complete
  const handleContactSubmit = (data: CheckoutContact) => {
    setContact(data);
    setStep(2);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Step 2 Complete
  const handleDeliverySubmit = (data: CheckoutDelivery) => {
    setDelivery(data);
    setStep(3);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Pay Click (Step 3)
  const handlePay = async () => {
    if (!cart || cart.items.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.createCheckout({
        contact,
        delivery,
      });

      const { reference } = res.data;
      setOrderReference(reference);

      // Transition immediately into the verification polling view
      setViewMode('polling');
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      if (
        err instanceof ApiError &&
        (err.status === 401 || err.code === 'UNAUTHENTICATED' || (err.code as string) === 'SESSION_EXPIRED')
      ) {
        setSessionNotice(
          'Your checkout session timed out. For your security, your contact and delivery entries were preserved. Session restored—please click Pay again to proceed.'
        );
        toast?.error('Session expired. Details preserved. Please retry payment.');
        refreshCart();
        return;
      }
      setSessionNotice(null);
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
          ? err.message
          : 'Unable to initialize checkout. Please review your details and try again.';
      toast?.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Polling Paid Event
  const handlePaymentPaid = async () => {
    if (!orderReference) return;

    try {
      // Fetch full order specifications for the confirmation screen
      const res = await api.getOrderDetail(orderReference, contact.email);
      setConfirmedOrder(res.data);
    } catch {
      // Fallback order detail if read encounters error
      setConfirmedOrder({
        id: `ord-${orderReference}`,
        reference: orderReference,
        customerName: contact.name,
        customerEmail: contact.email,
        customerPhone: contact.phone,
        deliveryAddressLine1: delivery.addressLine1,
        deliveryAddressLine2: delivery.addressLine2 || null,
        deliveryCity: delivery.city,
        deliveryState: delivery.state,
        deliveryPin: delivery.pin,
        deliveryLandmark: delivery.landmark || null,
        deliveryNotes: delivery.notes || null,
        subtotal: cart?.subtotal || 0,
        shipping: cart?.shipping || 0,
        tax: cart?.tax || 0,
        total: cart?.total || 0,
        paymentStatus: 'paid',
        orderStatus: 'confirmed',
        createdAt: new Date().toISOString(),
        items: (cart?.items || []).map((i) => ({
          id: i.id,
          productId: i.productId,
          variantId: null,
          productName: i.productName,
          sku: i.sku,
          finishName: i.finishName || null,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
          imageUrl: i.imageUrl || null,
        })),
      });
    }

    // Refresh cart to empty in background
    refreshCart();
    setViewMode('confirmed');

    // Fire purchase analytics event (strictly reference, total, itemCount - no PII)
    analytics.purchase({
      reference: orderReference,
      total: cart?.total || 0,
      itemCount: cart?.itemCount || 1,
    });

    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle Polling Failed Event
  const handlePaymentFailed = (reason?: string) => {
    setFailureReason(reason || 'Your payment was not authorized by the gateway.');
    setViewMode('failed');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Retry from Failure
  const handleTryAgainFromFailure = () => {
    setViewMode('steps');
    setStep(3);
    setFailureReason(null);
  };

  const hasItems = cart && cart.items && cart.items.length > 0;

  return (
    <div className="w-full bg-surface-muted min-h-screen py-space-6 sm:py-space-10">
      <div className="max-w-5xl mx-auto px-space-4 sm:px-space-6 lg:px-space-8">
        {/* Simplified Calm Header */}
        <header className="flex items-center justify-between pb-space-6 mb-space-8 border-b border-border">
          <Link
            href="/"
            className="font-display font-black text-title text-primary tracking-wider uppercase focus-ring rounded-xs"
          >
            FLOWTOP
          </Link>

          <div className="flex items-center gap-space-2 text-caption text-fg-muted">
            <svg
              className="w-space-4 h-space-4 text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
            <span>256-Bit SSL Encrypted Checkout</span>
          </div>
        </header>

        {/* View Router */}
        {viewMode === 'polling' && orderReference && (
          <PaymentPollingView
            reference={orderReference}
            onPaid={handlePaymentPaid}
            onFailed={handlePaymentFailed}
          />
        )}

        {viewMode === 'confirmed' && confirmedOrder && (
          <ConfirmationView order={confirmedOrder} />
        )}

        {viewMode === 'failed' && (
          <FailureView
            reference={orderReference || undefined}
            reason={failureReason || undefined}
            onTryAgain={handleTryAgainFromFailure}
          />
        )}

        {viewMode === 'steps' && (
          <>
            <h1 className="font-display font-light text-display tracking-tight text-fg mb-space-6">
              Checkout
            </h1>

            {/* Empty Cart Safeguard */}
            {!hasItems && !isCartLoading ? (
              <div className="p-space-8 rounded-lg border border-border bg-surface-solid text-center space-y-space-4 max-w-lg mx-auto">
                <h2 className="font-display font-medium text-title text-fg">Your shopping bag is empty</h2>
                <p className="text-small text-fg-muted">
                  Please add architectural fittings to your cart before proceeding to checkout.
                </p>
                <div className="pt-space-2">
                  <Link
                    href="/products"
                    className="inline-flex items-center justify-center px-space-6 py-space-2.5 rounded-pill bg-primary text-on-primary text-small font-medium hover:bg-primary-dark transition-colors focus-ring"
                  >
                    Browse Collections →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-8 lg:gap-space-12 items-start">
                {/* Left Column: Multi-Step Wizard (7 Cols) */}
                <main className="lg:col-span-7 bg-surface-solid rounded-lg border border-border shadow-sm p-space-6 sm:p-space-8">
                  {/* Stepper Navigation */}
                  <CheckoutStepper
                    currentStep={step}
                    onStepClick={(s) => setStep(s)}
                    canNavigateToStep={(s) => {
                      if (s === 1) return true;
                      if (s === 2) return Boolean(contact.name && contact.email && contact.phone);
                      if (s === 3) return Boolean(delivery.addressLine1 && delivery.city && delivery.pin);
                      return false;
                    }}
                    className="mb-space-8"
                  />

                  {/* Wizard Step 1: Contact */}
                  {step === 1 && (
                    <ContactStep initialValues={contact} onSubmit={handleContactSubmit} />
                  )}

                  {/* Wizard Step 2: Delivery */}
                  {step === 2 && (
                    <DeliveryStep
                      initialValues={delivery}
                      onSubmit={handleDeliverySubmit}
                      onBack={() => setStep(1)}
                    />
                  )}

                  {/* Wizard Step 3: Review */}
                  {step === 3 && cart && (
                    <>
                      {sessionNotice && (
                        <div
                          role="alert"
                          className="mb-space-6 p-space-4 rounded-md bg-warning-tint border border-warning/40 text-fg text-small flex items-start gap-space-3"
                        >
                          <span className="text-warning font-bold text-title" aria-hidden="true">ⓘ</span>
                          <div className="flex-1">
                            <strong className="font-semibold block text-fg">Session Refreshed</strong>
                            {sessionNotice}
                          </div>
                        </div>
                      )}
                      <ReviewStep
                        contact={contact}
                        delivery={delivery}
                        cart={cart}
                        isSubmitting={isSubmitting}
                        onEditContact={() => setStep(1)}
                        onEditDelivery={() => setStep(2)}
                        onPay={handlePay}
                      />
                    </>
                  )}
                </main>

                {/* Right Column: Order Summary (5 Cols) */}
                {cart && (
                  <aside className="lg:col-span-5 sticky top-20 space-y-space-4">
                    <div className="bg-surface-solid rounded-lg border border-border shadow-sm p-space-6">
                      <h2 className="font-display font-medium text-title text-fg pb-space-3 border-b border-border">
                        Order Summary
                      </h2>

                      {/* Items Mini-list */}
                      <div className="py-space-4 divide-y divide-border max-h-64 overflow-y-auto">
                        {cart.items.map((i) => (
                          <div key={i.id} className="py-space-2.5 flex items-center justify-between text-small">
                            <div className="min-w-0 pr-space-2">
                              <p className="font-medium text-fg truncate">{i.productName}</p>
                              {i.finishName && <p className="text-caption text-fg-muted">{i.finishName}</p>}
                              <p className="text-caption text-fg-muted">Qty: {i.quantity}</p>
                            </div>
                            <span className="font-medium text-fg shrink-0">{formatPaise(i.lineTotal)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Financial Breakdown: NEVER ADD UP IN JS */}
                      <div className="border-t border-border pt-space-4 space-y-space-2 text-small text-fg">
                        <div className="flex justify-between">
                          <span className="text-fg-muted">Subtotal</span>
                          <span className="font-medium">{formatPaise(cart.subtotal)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fg-muted">White-Glove Shipping</span>
                          <span className="font-medium">
                            {cart.shipping === 0 ? (
                              <span className="text-success font-semibold">Complimentary</span>
                            ) : (
                              formatPaise(cart.shipping)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-fg-muted">Estimated GST (18%)</span>
                          <span className="font-medium">{formatPaise(cart.tax)}</span>
                        </div>
                        <div className="border-t border-border pt-space-2 flex items-baseline justify-between font-semibold text-body">
                          <span>Total</span>
                          <span className="text-primary font-display text-title">{formatPaise(cart.total)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Guarantees Box */}
                    <div className="p-space-4 rounded-md bg-surface border border-border text-caption text-fg-muted space-y-space-1.5">
                      <p className="font-semibold text-fg">Architectural Reassurance</p>
                      <p>• Lead-free CuZn39Pb3 brass billets with Sedal ceramic cartridges.</p>
                      <p>• 15-Year structural warranty with full dispatch tracking.</p>
                    </div>
                  </aside>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <React.Suspense
      fallback={
        <div className="w-full bg-surface-muted min-h-screen py-space-12 text-center text-fg-muted font-display text-body">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </React.Suspense>
  );
}
