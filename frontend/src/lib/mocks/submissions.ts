// TODO(mock): replace on swap day
import type { SubmissionResponse } from '../types-pending';

export interface MockSubmissionError extends Error {
  status: number;
  code: string;
}

export function createMockSubmissionError(
  status: number,
  code: string,
  message: string
): MockSubmissionError {
  const err = new Error(message) as MockSubmissionError;
  err.status = status;
  err.code = code;
  return err;
}

export function submitMockForm(payload: unknown): SubmissionResponse {
  const sub = payload as { type?: string; payload?: Record<string, unknown> } | undefined;
  const inner = sub?.payload || {};

  // Honeypot check: If hidden honeypot field is filled, reject immediately
  if (inner.website || inner.hp) {
    throw createMockSubmissionError(
      400,
      'VALIDATION_FAILED',
      'Submission rejected by bot defense filter.'
    );
  }

  // Simulation flags for testing edge cases
  const messageText = typeof inner.message === 'string' ? inner.message : '';
  if (messageText.includes('[simulate-save-failure]')) {
    throw createMockSubmissionError(
      500,
      'SERVER_ERROR',
      'Database write failed. Enquiry not saved.'
    );
  }

  const isEmailFailure =
    messageText.includes('[simulate-email-failure]') || messageText.includes('[email-fail]');

  return {
    reference: `CT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    saved: true,
    emailSent: !isEmailFailure,
    message: isEmailFailure
      ? 'We have your message. Our email notification failed, so please also WhatsApp us if urgent.'
      : 'Your enquiry has been received. Our architectural advisor will contact you within 24 hours.',
  };
}
