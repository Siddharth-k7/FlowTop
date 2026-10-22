'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ApiError } from '@/lib/api';
import { requestPasswordReset } from '@/lib/auth';
import { btnPrimary, inputCls } from '@/lib/ui-classes';
import { FormField } from '@/components/FormField';
import { AuthCard } from './AuthCard';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get('email') ?? '');
    setBusy(true); setError(undefined);
    try { await requestPasswordReset(email); setSent(true); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Something went wrong.'); }
    finally { setBusy(false); }
  }

  return (
    <AuthCard title="Forgot your password?" subtitle="We will email you a link to choose a new one.">
      {sent ? (
        <p role="status" className="text-sm">If that email belongs to an account, a reset link is on its way.</p>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          <FormField id="email" label="Email" error={error}>
            {(p) => <input {...p} name="email" type="email" className={inputCls} autoComplete="email" required />}
          </FormField>
          <button className={btnPrimary} disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
      )}
      <Link href="/login" className="mt-4 flex min-h-touch items-center justify-center text-sm text-purple-deep underline">Back to log in</Link>
    </AuthCard>
  );
}
